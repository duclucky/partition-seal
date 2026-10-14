"""Escrow accounting and actual pinned EVM message-boundary checks, local only."""
import json
import pytest
from test_partition_seal import ready, propose, mock, clock, addr, snapshot, NOW, ROOT_EXPIRY, PROPOSAL_EXPIRY, VALID

GEN=10**18

def account(c):
    return json.loads(c.get_accounting())

def credit(c,a):
    return json.loads(c.get_credit(addr(a)))["credit_gen"]

def pay(c,vm,pid,digest,amount=GEN):
    vm.value=amount
    try:
        return c.assent(pid,digest)
    finally:
        vm.value=0

def purchase(c,vm,accounts,one=False):
    pid=propose(c,vm,accounts)
    digest=json.loads(c.get_proposal(pid))["digest"]
    for actor in accounts[1:2 if one else 3]:
        vm.sender=actor;pay(c,vm,pid,digest)
    vm.sender=accounts[0]
    return pid

def money_snapshot(c,accounts,pid):
    return [c.get_accounting(),c.get_payment(pid),*[c.get_credit(addr(a)) for a in accounts[:4]],*snapshot(c,"root-one",pid)]

def test_two_paid_assents_lock_2gen_and_valid_partition_credits_seller(contract,direct_vm,direct_accounts):
    pid=purchase(contract,direct_vm,direct_accounts)
    assert account(contract)=={"received_gen":"2","withdrawn_gen":"0","escrow_gen":"2","credit_gen":"0","liability_gen":"2"}
    mock(direct_vm);contract.review_partition(pid)
    assert credit(contract,direct_accounts[0])=="2"
    assert account(contract)["escrow_gen"]=="0"
    assert json.loads(contract.get_payment(pid))["status"]=="HOLDER_CREDIT"

@pytest.mark.parametrize("amount",[0,1,GEN-1,GEN+1,2*GEN])
def test_assent_wrong_value_never_changes_money_or_authority(contract,direct_vm,direct_accounts,amount):
    pid=propose(contract,direct_vm,direct_accounts);direct_vm.sender=direct_accounts[1]
    digest=json.loads(contract.get_proposal(pid))["digest"]
    before=money_snapshot(contract,direct_accounts,pid)
    with pytest.raises(Exception,match="1 GEN"):
        pay(contract,direct_vm,pid,digest,amount)
    assert money_snapshot(contract,direct_accounts,pid)==before

@pytest.mark.parametrize("bad",["origin","digest","late","duplicate"])
def test_hash_valid_provenance_and_replay_cannot_collect_or_credit(contract,direct_vm,direct_accounts,bad):
    pid=propose(contract,direct_vm,direct_accounts);direct_vm.sender=direct_accounts[1]
    digest=json.loads(contract.get_proposal(pid))["digest"]
    if bad=="origin":direct_vm.sender=direct_accounts[3]
    if bad=="digest":digest="0"*64
    if bad=="late":clock(direct_vm,PROPOSAL_EXPIRY)
    if bad=="duplicate":pay(contract,direct_vm,pid,digest)
    before=money_snapshot(contract,direct_accounts,pid)
    with pytest.raises(Exception):pay(contract,direct_vm,pid,digest)
    assert money_snapshot(contract,direct_accounts,pid)==before

@pytest.mark.parametrize("verdict",["REJECTED","RETRYABLE"])
def test_rejection_refunds_and_retry_keeps_actual_escrow(contract,direct_vm,direct_accounts,verdict):
    pid=purchase(contract,direct_vm,direct_accounts)
    decision={**VALID,"coverage":{"U0":"BOTH","U1":"NEITHER"}} if verdict=="REJECTED" else {"coverage":{"U0":"UNVERIFIABLE","U1":"UNVERIFIABLE"},"limits":{"A":"UNVERIFIABLE","B":"UNVERIFIABLE"}}
    mock(direct_vm,decision);contract.review_partition(pid)
    assert credit(contract,direct_accounts[0])=="0"
    if verdict=="REJECTED":
        assert credit(contract,direct_accounts[1])==credit(contract,direct_accounts[2])=="1"
        assert account(contract)["escrow_gen"]=="0"
    else:
        assert account(contract)["escrow_gen"]=="2" and account(contract)["credit_gen"]=="0"
        clock(direct_vm,PROPOSAL_EXPIRY);contract.expire_proposal(pid)
        assert credit(contract,direct_accounts[1])==credit(contract,direct_accounts[2])=="1"

@pytest.mark.parametrize("method",["expire_proposal","close_root"])
@pytest.mark.parametrize("delta",[-1,0,1])
@pytest.mark.parametrize("partial",[False,True])
def test_paid_recovery_clock_caller_duplicate_and_no_orphans(contract,direct_vm,direct_accounts,method,delta,partial):
    pid=purchase(contract,direct_vm,direct_accounts,one=partial)
    clock(direct_vm,(PROPOSAL_EXPIRY if method=="expire_proposal" else ROOT_EXPIRY)+delta)
    arg=pid if method=="expire_proposal" else "root-one"
    before=money_snapshot(contract,direct_accounts,pid);direct_vm.sender=direct_accounts[3]
    with pytest.raises(Exception,match="holder"):getattr(contract,method)(arg)
    assert money_snapshot(contract,direct_accounts,pid)==before
    direct_vm.sender=direct_accounts[0]
    if delta<0:
        with pytest.raises(Exception,match="premature"):getattr(contract,method)(arg)
        assert money_snapshot(contract,direct_accounts,pid)==before
    else:
        getattr(contract,method)(arg)
        assert account(contract)["escrow_gen"]=="0" and credit(contract,direct_accounts[1])=="1"
        assert credit(contract,direct_accounts[2])==("0" if partial else "1")
        after=money_snapshot(contract,direct_accounts,pid)
        with pytest.raises(Exception):getattr(contract,method)(arg)
        assert money_snapshot(contract,direct_accounts,pid)==after

def test_invalid_settlement_output_has_no_credit_or_accounting_mutation(contract,direct_vm,direct_accounts):
    pid=purchase(contract,direct_vm,direct_accounts)
    mock(direct_vm,{**VALID,"coverage":{"U0":"A","U1":"B","EXTRA":"A"},"payout_gen":"999","recipient":"attacker"})
    before=money_snapshot(contract,direct_accounts,pid)
    with pytest.raises(Exception,match="meaning"):contract.review_partition(pid)
    assert money_snapshot(contract,direct_accounts,pid)==before

def test_terminal_success_close_does_not_refund_or_pay_twice(contract,direct_vm,direct_accounts):
    pid=purchase(contract,direct_vm,direct_accounts);mock(direct_vm);contract.review_partition(pid)
    before=money_snapshot(contract,direct_accounts,pid)
    with pytest.raises(Exception):contract.review_partition(pid)
    assert money_snapshot(contract,direct_accounts,pid)==before
    clock(direct_vm,ROOT_EXPIRY);contract.close_root("root-one")
    assert credit(contract,direct_accounts[0])=="2"
    assert credit(contract,direct_accounts[1])==credit(contract,direct_accounts[2])=="0"
    assert account(contract)["received_gen"]=="2"

def test_withdraw_real_evm_boundary_fixed_recipient_value_debit_and_no_double(contract,direct_vm,direct_accounts):
    pid=purchase(contract,direct_vm,direct_accounts);mock(direct_vm);contract.review_partition(pid)
    emitted=[]
    def hook(vm,request):
        if "EthSend" in request:
            emitted.append(request["EthSend"])
            return {}
        return None
    direct_vm._gl_call_hook=hook
    direct_vm.sender=direct_accounts[3];before=money_snapshot(contract,direct_accounts,pid)
    with pytest.raises(Exception,match="credit"):contract.withdraw()
    assert money_snapshot(contract,direct_accounts,pid)==before and not emitted
    direct_vm.sender=direct_accounts[0]
    direct_vm.value=GEN
    with pytest.raises(Exception,match="nonpayable"):contract.withdraw()
    direct_vm.value=0
    assert money_snapshot(contract,direct_accounts,pid)==before
    clock(direct_vm,ROOT_EXPIRY);contract.close_root("root-one")
    contract.withdraw()
    assert len(emitted)==1 and emitted[0]["value"]==2*GEN and emitted[0]["calldata"]==b""
    assert emitted[0]["address"].as_hex.lower()==addr(direct_accounts[0]).lower()
    assert credit(contract,direct_accounts[0])=="0"
    assert account(contract)=={"received_gen":"2","withdrawn_gen":"2","escrow_gen":"0","credit_gen":"0","liability_gen":"0"}
    with pytest.raises(Exception,match="credit"):contract.withdraw()
    assert len(emitted)==1

def test_refund_withdrawal_cannot_redirect_to_seller(contract,direct_vm,direct_accounts):
    pid=purchase(contract,direct_vm,direct_accounts,one=True);clock(direct_vm,ROOT_EXPIRY)
    contract.close_root("root-one")
    direct_vm.sender=direct_accounts[0]
    with pytest.raises(Exception,match="credit"):contract.withdraw()
    emitted=[]
    direct_vm._gl_call_hook=lambda vm,r: (emitted.append(r["EthSend"]) or {}) if "EthSend" in r else None
    direct_vm.sender=direct_accounts[1];contract.withdraw()
    assert emitted[0]["value"]==GEN and emitted[0]["address"].as_hex.lower()==addr(direct_accounts[1]).lower()
    assert account(contract)["liability_gen"]=="0"

@pytest.mark.parametrize("method",["propose_partition","review_partition","consume","expire_proposal","close_root","withdraw"])
def test_nonpayable_writes_reject_1gen_before_any_mutation(contract,direct_vm,direct_accounts,method):
    pid=purchase(contract,direct_vm,direct_accounts);mock(direct_vm)
    args={"propose_partition":["root-one",addr(direct_accounts[1]),"read",addr(direct_accounts[2]),"print",PROPOSAL_EXPIRY],"review_partition":[pid],"consume":["root-one:U0"],"expire_proposal":[pid],"close_root":["root-one"],"withdraw":[]}[method]
    before=money_snapshot(contract,direct_accounts,pid);direct_vm.value=GEN
    with pytest.raises(Exception,match="nonpayable"):getattr(contract,method)(*args)
    direct_vm.value=0
    assert money_snapshot(contract,direct_accounts,pid)==before

def test_retry_then_valid_sale_credits_exactly_once_and_preserves_attempts(contract,direct_vm,direct_accounts):
    pid=purchase(contract,direct_vm,direct_accounts)
    mock(direct_vm,{"coverage":{"U0":"UNVERIFIABLE","U1":"UNVERIFIABLE"},"limits":{"A":"UNVERIFIABLE","B":"UNVERIFIABLE"}})
    contract.review_partition(pid)
    assert account(contract)["escrow_gen"]=="2" and account(contract)["credit_gen"]=="0"
    direct_vm.clear_mocks();mock(direct_vm)
    contract.review_partition(pid)
    assert credit(contract,direct_accounts[0])=="2" and account(contract)["escrow_gen"]=="0"
    assert json.loads(contract.get_attempt(pid+":T1"))["outcome"]=="RETRYABLE"
    assert json.loads(contract.get_attempt(pid+":T2"))["outcome"]=="PARTITIONED"

@pytest.mark.parametrize("method",["expire_proposal","close_root"])
@pytest.mark.parametrize("delta",[-1,0,1])
@pytest.mark.parametrize("buyer",[1,2])
def test_paid_buyer_recovers_without_holder_at_exact_boundary(contract,direct_vm,direct_accounts,method,delta,buyer):
    pid=purchase(contract,direct_vm,direct_accounts)
    clock(direct_vm,(PROPOSAL_EXPIRY if method=="expire_proposal" else ROOT_EXPIRY)+delta)
    direct_vm.sender=direct_accounts[buyer]
    arg=pid if method=="expire_proposal" else "root-one"
    before=money_snapshot(contract,direct_accounts,pid)
    if delta<0:
        with pytest.raises(Exception,match="premature"):getattr(contract,method)(arg)
        assert money_snapshot(contract,direct_accounts,pid)==before
    else:
        getattr(contract,method)(arg)
        assert credit(contract,direct_accounts[1])==credit(contract,direct_accounts[2])=="1"
        assert account(contract)["escrow_gen"]=="0"
        after=money_snapshot(contract,direct_accounts,pid)
        with pytest.raises(Exception):getattr(contract,method)(arg)
        assert money_snapshot(contract,direct_accounts,pid)==after

@pytest.mark.parametrize("method",["expire_proposal","close_root"])
def test_unpaid_recipient_cannot_recover_others_deposit(contract,direct_vm,direct_accounts,method):
    pid=purchase(contract,direct_vm,direct_accounts,one=True)
    clock(direct_vm,ROOT_EXPIRY);direct_vm.sender=direct_accounts[2]
    before=money_snapshot(contract,direct_accounts,pid)
    arg=pid if method=="expire_proposal" else "root-one"
    with pytest.raises(Exception,match="holder|paid recipient"):getattr(contract,method)(arg)
    assert money_snapshot(contract,direct_accounts,pid)==before
    direct_vm.sender=direct_accounts[1];getattr(contract,method)(arg)
    assert credit(contract,direct_accounts[1])=="1" and credit(contract,direct_accounts[2])=="0"
