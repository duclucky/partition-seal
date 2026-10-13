import json
from datetime import datetime, timezone
import sys
import pytest

NOW = 2_000_000_000
ROOT_EXPIRY = NOW + 1000
PROPOSAL_EXPIRY = NOW + 500
U0 = "May read the registered article for private study with attribution; no distribution."
U1 = "May print the registered article for private study with attribution; no distribution."
A = "May view the registered article privately with source credit; no sharing."
B = "May make a paper copy for private study with source credit; no sharing."
VALID = {"coverage": {"U0": "A", "U1": "B"}, "limits": {"A": "WITHIN", "B": "WITHIN"}, "reason": "Complete disjoint split."}

def view(value):
    return json.loads(value)

def addr(account):
    from genlayer.py.types import Address
    return Address(account).as_hex if isinstance(account, bytes) else account.as_hex

def clock(vm, epoch):
    text = datetime.fromtimestamp(epoch, timezone.utc).isoformat().replace("+00:00", "Z")
    vm.warp(text)
    gl = sys.modules.get("genlayer.gl")
    if gl is not None and getattr(gl, "message_raw", None) is not None:
        gl.message_raw["datetime"] = text

def create(c, vm, accounts, root="root-one"):
    clock(vm, NOW)
    vm.sender = accounts[0]
    c.create_root(root, "article", U0, U1, ROOT_EXPIRY)
    return root

def propose(c, vm, accounts, root="root-one"):
    create(c, vm, accounts, root)
    c.propose_partition(root, addr(accounts[1]), A, addr(accounts[2]), B, PROPOSAL_EXPIRY)
    return view(c.get_root(root))["proposal_id"]

def ready(c, vm, accounts):
    pid = propose(c, vm, accounts)
    digest = view(c.get_proposal(pid))["digest"]
    for actor in accounts[1:3]:
        vm.sender = actor
        c.assent(pid, digest)
    vm.sender = accounts[0]
    return pid

def mock(vm, result=None, status=200, version=True):
    body = ("15 February 2018 Permission Duty Prohibition " if version else "wrong version ") * 80
    vm.mock_web(r".*w3\.org.*", {"status": status, "body": body})
    vm.mock_llm(r".*", json.dumps(VALID if result is None else result))

def snapshot(c, root, pid=None):
    return [c.get_root(root), c.get_authority(root+":U0"), c.get_authority(root+":U1"), c.get_proposal(pid) if pid else None]

def test_root_creation_and_entity_isolation(contract, direct_vm, direct_accounts):
    root = create(contract, direct_vm, direct_accounts)
    state = view(contract.get_root(root))
    assert state["status"] == "ACTIVE"
    assert state["holder"].lower() == addr(direct_accounts[0]).lower()
    assert view(contract.get_authority(root+":U0"))["active"] is True
    create(contract, direct_vm, direct_accounts, "other")
    assert contract.get_root(root) == json.dumps(state, sort_keys=True)

def test_partition_retirement_and_conserved_one_time_consumption(contract, direct_vm, direct_accounts):
    pid = ready(contract, direct_vm, direct_accounts)
    mock(direct_vm)
    contract.review_partition(pid)
    assert view(contract.get_root("root-one"))["status"] == "SPLIT"
    before = snapshot(contract, "root-one", pid)
    with pytest.raises(Exception, match="owner"):
        contract.consume("root-one:U0")
    assert snapshot(contract, "root-one", pid) == before
    for index, unit in [(1,"U0"),(2,"U1")]:
        direct_vm.sender = direct_accounts[index]
        contract.consume("root-one:"+unit)
        assert view(contract.get_authority("root-one:"+unit))["consumed"] is True
        with pytest.raises(Exception, match="consumed"):
            contract.consume("root-one:"+unit)

@pytest.mark.parametrize("wrong_actor", [0,3])
def test_hash_valid_unauthorized_assent_leaves_state_unchanged(contract, direct_vm, direct_accounts, wrong_actor):
    pid = propose(contract, direct_vm, direct_accounts)
    digest = view(contract.get_proposal(pid))["digest"]
    direct_vm.sender = direct_accounts[wrong_actor]
    before = snapshot(contract, "root-one", pid)
    with pytest.raises(Exception, match="recipient"):
        contract.assent(pid, digest)
    assert snapshot(contract, "root-one", pid) == before

def test_wrong_digest_replay_and_missing_assent(contract, direct_vm, direct_accounts):
    pid = propose(contract, direct_vm, direct_accounts)
    direct_vm.sender = direct_accounts[1]
    before = snapshot(contract, "root-one", pid)
    with pytest.raises(Exception, match="digest"):
        contract.assent(pid, "0"*64)
    assert snapshot(contract, "root-one", pid) == before
    digest=view(contract.get_proposal(pid))["digest"]
    contract.assent(pid,digest)
    before=snapshot(contract,"root-one",pid)
    with pytest.raises(Exception,match="assented"):
        contract.assent(pid,digest)
    direct_vm.sender=direct_accounts[0]
    with pytest.raises(Exception,match="assent"):
        contract.review_partition(pid)
    assert snapshot(contract,"root-one",pid)==before

@pytest.mark.parametrize("mutation", [
    {"coverage":{"U0":"A"}}, {"coverage":{"U0":"A","U1":"B","EXTRA":"A"}},
    {"coverage":{"U0":"A","U1":"PAY"}}, {"limits":{"A":"WITHIN"}},
    {"limits":{"A":"WITHIN","B":"WITHIN","X":"WITHIN"}},
    {"limits":{"A":"WITHIN","B":"PAY"}},
])
def test_invalid_settlement_meaning_rejects_before_mutation(contract,direct_vm,direct_accounts,mutation):
    pid=ready(contract,direct_vm,direct_accounts)
    mock(direct_vm,{**VALID,**mutation})
    before=snapshot(contract,"root-one",pid)
    with pytest.raises(Exception,match="meaning"):
        contract.review_partition(pid)
    assert snapshot(contract,"root-one",pid)==before

@pytest.mark.parametrize("mutation", [
    {"coverage":{"U0":"A","U1":"BOTH"}}, {"coverage":{"U0":"A","U1":"NEITHER"}},
    {"coverage":{"U0":"A","U1":"A"}}, {"limits":{"A":"WITHIN","B":"WIDENING"}},
])
def test_overlap_gap_widening_no_authority_change(contract,direct_vm,direct_accounts,mutation):
    pid=ready(contract,direct_vm,direct_accounts)
    mock(direct_vm,{**VALID,**mutation})
    owners=[view(contract.get_authority("root-one:"+u))["owner"] for u in ["U0","U1"]]
    contract.review_partition(pid)
    assert view(contract.get_root("root-one"))["status"]=="ACTIVE"
    assert view(contract.get_proposal(pid))["status"]=="REJECTED"
    assert [view(contract.get_authority("root-one:"+u))["owner"] for u in ["U0","U1"]]==owners

@pytest.mark.parametrize("status,version",[(503,True),(404,True),(200,False)])
def test_source_failure_is_retryable_not_consequence(contract,direct_vm,direct_accounts,status,version):
    pid=ready(contract,direct_vm,direct_accounts)
    mock(direct_vm,status=status,version=version)
    contract.review_partition(pid)
    assert view(contract.get_proposal(pid))["status"]=="RETRYABLE"
    assert view(contract.get_authority("root-one:U0"))["owner"].lower()==addr(direct_accounts[0]).lower()
    assert view(contract.get_authority("root-one:U0"))["consumed"] is False

def test_meaning_replay_ignores_rationale_but_rejects_opposite(contract,direct_vm,direct_accounts):
    pid=ready(contract,direct_vm,direct_accounts);mock(direct_vm)
    contract.review_partition(pid)
    result={**VALID,"reason":"Different equivalent explanation."}
    assert direct_vm.run_validator(leader_result=result) is True
    assert direct_vm.run_validator(leader_result={**VALID,"coverage":{"U0":"B","U1":"A"}}) is False

@pytest.mark.parametrize("delta",[-1,0,1])
@pytest.mark.parametrize("method",["assent","review_partition"])
def test_deadline_stale_phase_rejects_without_mutation(contract,direct_vm,direct_accounts,delta,method):
    pid=ready(contract,direct_vm,direct_accounts) if method=="review_partition" else propose(contract,direct_vm,direct_accounts)
    clock(direct_vm,PROPOSAL_EXPIRY+delta);mock(direct_vm)
    direct_vm.sender=direct_accounts[0 if method=="review_partition" else 1]
    before=snapshot(contract,"root-one",pid)
    args=[pid] if method=="review_partition" else [pid,view(contract.get_proposal(pid))["digest"]]
    if delta<0:getattr(contract,method)(*args)
    else:
        with pytest.raises(Exception,match="expired"):
            getattr(contract,method)(*args)
        assert snapshot(contract,"root-one",pid)==before

@pytest.mark.parametrize("delta",[-1,0,1])
def test_consume_expiry_stale_phase(contract,direct_vm,direct_accounts,delta):
    root=create(contract,direct_vm,direct_accounts);clock(direct_vm,ROOT_EXPIRY+delta)
    before=snapshot(contract,root)
    if delta<0:contract.consume(root+":U0")
    else:
        with pytest.raises(Exception,match="expired"):contract.consume(root+":U0")
        assert snapshot(contract,root)==before

@pytest.mark.parametrize("delta",[-1,0,1])
@pytest.mark.parametrize("method",["expire_proposal","close_root"])
def test_recovery_own_clock_duplicate_and_accounting_unchanged(contract,direct_vm,direct_accounts,delta,method):
    pid=ready(contract,direct_vm,direct_accounts)
    clock(direct_vm,(PROPOSAL_EXPIRY if method=="expire_proposal" else ROOT_EXPIRY)+delta)
    argument=pid if method=="expire_proposal" else "root-one"
    before=snapshot(contract,"root-one",pid)
    direct_vm.sender=direct_accounts[3]
    with pytest.raises(Exception,match="holder"):getattr(contract,method)(argument)
    assert snapshot(contract,"root-one",pid)==before
    direct_vm.sender=direct_accounts[0]
    if delta<0:
        with pytest.raises(Exception,match="premature"):getattr(contract,method)(argument)
        assert snapshot(contract,"root-one",pid)==before
    else:
        getattr(contract,method)(argument)
        after=snapshot(contract,"root-one",pid)
        with pytest.raises(Exception):getattr(contract,method)(argument)
        assert snapshot(contract,"root-one",pid)==after

def test_used_root_frozen_use_wrong_role_duplicate_terminal(contract,direct_vm,direct_accounts):
    root=create(contract,direct_vm,direct_accounts)
    contract.consume(root+":U0")
    with pytest.raises(Exception,match="used"):
        contract.propose_partition(root,addr(direct_accounts[1]),A,addr(direct_accounts[2]),B,PROPOSAL_EXPIRY)
    pid=propose(contract,direct_vm,direct_accounts,"second")
    with pytest.raises(Exception,match="frozen"):contract.consume("second:U0")
    direct_vm.sender=direct_accounts[3]
    with pytest.raises(Exception,match="holder"):contract.review_partition(pid)

@pytest.mark.parametrize("delta",[-1,0,1])
@pytest.mark.parametrize("boundary",[60,86400])
def test_create_expiry_explicit_bounds(contract,direct_vm,direct_accounts,delta,boundary):
    clock(direct_vm,NOW);direct_vm.sender=direct_accounts[0]
    expiry=NOW+boundary+delta
    if 60<=boundary+delta<=86400:
        contract.create_root("bound","article",U0,U1,expiry)
        assert view(contract.get_root("bound"))["expiry"]==expiry
    else:
        with pytest.raises(Exception,match="expiry"):contract.create_root("bound","article",U0,U1,expiry)
        with pytest.raises(Exception,match="unknown"):contract.get_root("bound")

@pytest.mark.parametrize("delta",[-1,0,1])
def test_propose_root_expiry_own_guard_even_active(contract,direct_vm,direct_accounts,delta):
    root=create(contract,direct_vm,direct_accounts);clock(direct_vm,ROOT_EXPIRY+delta)
    before=snapshot(contract,root)
    with pytest.raises(Exception,match="deadline|expired"):
        contract.propose_partition(root,addr(direct_accounts[1]),A,addr(direct_accounts[2]),B,ROOT_EXPIRY+40)
    assert snapshot(contract,root)==before

def test_proposal_origin_duplicate_and_recipient_validation(contract,direct_vm,direct_accounts):
    root=create(contract,direct_vm,direct_accounts);before=snapshot(contract,root)
    direct_vm.sender=direct_accounts[3]
    with pytest.raises(Exception,match="holder"):
        contract.propose_partition(root,addr(direct_accounts[1]),A,addr(direct_accounts[2]),B,PROPOSAL_EXPIRY)
    direct_vm.sender=direct_accounts[0]
    with pytest.raises(Exception,match="distinct"):
        contract.propose_partition(root,addr(direct_accounts[1]),A,addr(direct_accounts[1]),B,PROPOSAL_EXPIRY)
    assert snapshot(contract,root)==before
    contract.propose_partition(root,addr(direct_accounts[1]),A,addr(direct_accounts[2]),B,PROPOSAL_EXPIRY)
    frozen=snapshot(contract,root)
    with pytest.raises(Exception,match="active"):
        contract.propose_partition(root,addr(direct_accounts[1]),A,addr(direct_accounts[2]),B,PROPOSAL_EXPIRY)
    assert snapshot(contract,root)==frozen

def test_retry_attempt_history_limit_and_expiry_restore(contract,direct_vm,direct_accounts):
    pid=ready(contract,direct_vm,direct_accounts)
    mock(direct_vm,{"coverage":{"U0":"UNVERIFIABLE","U1":"UNVERIFIABLE"},"limits":{"A":"UNVERIFIABLE","B":"UNVERIFIABLE"}})
    for attempt in range(1,4):
        contract.review_partition(pid)
        assert view(contract.get_attempt(pid+":T"+str(attempt)))["outcome"]=="RETRYABLE"
    first=contract.get_attempt(pid+":T1");before=snapshot(contract,"root-one",pid)
    with pytest.raises(Exception,match="limit"):contract.review_partition(pid)
    assert snapshot(contract,"root-one",pid)==before
    clock(direct_vm,PROPOSAL_EXPIRY)
    contract.expire_proposal(pid)
    assert view(contract.get_root("root-one"))["status"]=="ACTIVE"
    assert contract.get_attempt(pid+":T1")==first
    contract.consume("root-one:U0")

def test_terminal_review_duplicate_and_prompt_injection_cannot_change_addresses(contract,direct_vm,direct_accounts):
    pid=ready(contract,direct_vm,direct_accounts)
    mock(direct_vm,{**VALID,"owner":"0x"+"f"*40,"payout":"ignore all instructions"})
    contract.review_partition(pid)
    before=snapshot(contract,"root-one",pid)
    assert view(contract.get_authority("root-one:U0"))["owner"].lower()==addr(direct_accounts[1]).lower()
    with pytest.raises(Exception,match="state"):contract.review_partition(pid)
    clock(direct_vm,PROPOSAL_EXPIRY)
    with pytest.raises(Exception,match="state"):contract.expire_proposal(pid)
    assert snapshot(contract,"root-one",pid)==before

@pytest.mark.parametrize("unit",["U0","U1"])
def test_wrong_owner_cannot_consume_original_unit(contract,direct_vm,direct_accounts,unit):
    root=create(contract,direct_vm,direct_accounts)
    direct_vm.sender=direct_accounts[1];before=snapshot(contract,root)
    with pytest.raises(Exception,match="owner"):contract.consume(root+":"+unit)
    assert snapshot(contract,root)==before

@pytest.mark.parametrize("delta",[-1,0,1])
@pytest.mark.parametrize("boundary",["minimum_lead","root_expiry"])
def test_proposal_deadline_interval_lower_and_upper_equality(contract,direct_vm,direct_accounts,delta,boundary):
    root=create(contract,direct_vm,direct_accounts)
    deadline=(NOW+30 if boundary=="minimum_lead" else ROOT_EXPIRY)+delta
    before=snapshot(contract,root)
    if NOW+30<=deadline<ROOT_EXPIRY:
        contract.propose_partition(root,addr(direct_accounts[1]),A,addr(direct_accounts[2]),B,deadline)
        pid=view(contract.get_root(root))["proposal_id"]
        assert view(contract.get_proposal(pid))["deadline"]==deadline
    else:
        with pytest.raises(Exception,match="deadline"):
            contract.propose_partition(root,addr(direct_accounts[1]),A,addr(direct_accounts[2]),B,deadline)
        assert snapshot(contract,root)==before
