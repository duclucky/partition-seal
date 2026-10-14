# PartitionSeal specification: V2 payment amendment and historical V1

Active V2 escrow specification: [PAYMENT-PLAN.md](PAYMENT-PLAN.md), approved by
the owner before implementation. Its eight safety rows, value destinations and
14 admission delta checks supersede V1's noncustodial/payment N/A claims below.
V2 execution is PENDING until native payment/child receipt/balance proofs exist.
The V1 text below is historical scope/semantic design, not V2 monetary evidence.

## Identity and product hook

IDEA-042, partition-seal, Intelligent Contracts, VERIFIED. Owner requested **Studionet
61999** for this deliverable. New independent contract-only repo.
Product deployment and primary/recovery lifecycle verified; public CI passed at
https://github.com/duclucky/partition-seal/actions/runs/38449244452.

Subdivide two exclusive protocol permission units without duplicating scope,
dropping duties or allowing the original holder to exercise retired authority.

## Trust problem and fingerprint

Independent meaning consensus protects against a holder or recipient creating
overlapping or expanded scopes. Hashes authenticate bytes, not semantic coverage.

1. Trust problem: conserve exclusive authority under semantic subdivision.
2. Actors/adversary: original holder plus two recipients with competing scope interests.
3. Evidence class + authenticity mechanism: immutable transaction-created internal
   root/child declarations; digest-bound exact assent by named wallets; fixed W3C context.
4. Consensus question: each root unit's complete child coverage and each child's non-widening.
5. State machine: ACTIVE -> FROZEN -> READY -> SPLIT/ACTIVE/RETRYABLE; append-only attempts.
6. Direct consequence: retire original ownership and assign SAME two unit IDs exactly once.
7. Reuse surface: root/proposal/assent/review/consume/recovery and canonical authority views.

## Mandatory gate matrix

| Gate | Status | Independent reason |
| --- | --- | --- |
| Replacement | PASS_ADMISSION | A holder backend could issue biased duplicated scope; independent consensus removes that discretion |
| Judgment | PASS_ADMISSION | Paraphrased action/duty coverage is semantic, not deterministic text equality |
| Evidence availability | PASS_ADMISSION | Canonical bounded inputs and actual diagnostic W3C fetch200/181852 bytes |
| Evidence authenticity | PASS_ADMISSION | Role-checked transaction issuance/assent for INTERNAL rights; separate matrix below |
| Equivalence | PASS_ADMISSION | Complete U0/U1 coverage and A/B limit meanings, rationale wording ignored |
| Consequence | PASS_ADMISSION | Atomic ownership reassignment and enforced one-time exercise |
| Adversarial | PASS_ADMISSION | Holder/recipients prefer duplicated, lost-to-other or broader authority |
| State model | PASS_ADMISSION | Isolation, immutable IDs, freeze, no used-root split, conserved units, temporal guards |
| Reuse | PASS_ADMISSION | LangGraph broker, DAOhaus department router, A2A gateway integrate public API |
| Contract count | PASS_ADMISSION | One actual authority state owner, no mirroring guard |
| Differentiation | PASS_ADMISSION | Exhaustive/disjoint subdivision and root retirement differs from attenuation/cancellation/merge |
| Claim-to-code | PASS_ADMISSION | Complete mapping below with primary/recovery canonical network evidence |
| Full lifecycle | PASS_ADMISSION; PASS_EXECUTION | Finalized assent/review/ownership/both consumption and timed expiry/close, canonical reads in evidence/studionet |
| Scope honesty | PASS_ADMISSION | No external property, legal title, copyright, execution, money or adoption claim |

## Actors / scope and non-goals

Original holder authors and owns two internal units, proposes and reviews subdivision,
and owns timed recovery. Recipient A/B must be distinct from each other and holder;
each assents exact stored proposal, then only current owner can consume a unit.
Integrator reads FINALIZED canonical state; pending/simulated outcomes are advisory.

Exactly two operation units, one-level split, bounded attempts. No external issuer
receipt, tool execution, copyright, law, physical identity, wallet simulation or
cross-chain rights. No native GEN custody. No app/frontend/Vercel.

## Product/frontend blueprint and frontend lifecycle matrix

N/A in every subsection: human UI jobs, IA, visibility, controls, responsive behavior,
frontend tests and browser lifecycle are outside the locked Intelligent Contracts track.
Scripts and canonical views prove integration. No browser workflow claim.

## State model: IDs, storage, state machine, authorization

Root ID: 1-48 ASCII alphanumeric/underscore/hyphen. Immutable unit IDs root:U0/root:U1.
Proposal root:P<n>; attempt proposal:T<n>. Fully typed decorated dataclasses in
TreeMap[str,Root/Unit/Proposal/Attempt]; bigint counters/time. No JSON canonical storage.
Explicit constructor; collections are class annotations, never reassigned.

ACTIVE root: original holder owns both U0/U1; a used unit permanently prohibits
partition. Propose freezes BOTH units with immutable scopes/recipients/deadline.
Both exact digest assents -> READY. Review complete partition -> SPLIT, changing
ownership of SAME U0/U1 atomically. Original holder cannot consume afterward.
Rejected split -> ACTIVE, owners and consumption unchanged. Unverifiable -> RETRYABLE
with root FROZEN, at most3 attempts. Expiry releases freeze if root live; root expiry
closes remaining authority without resurrecting consumed units.
All failures reject before mutation; no overwrite or duplicate root, assent, use or settlement.

### Temporal rules

Canonical transaction datetime parsed as UTC epoch. Equality at deadline is late.
create requires now+60<=expiry<=now+86400. propose requires now<root expiry and
now+30<=proposal deadline<root expiry. assent/review enforce now<proposal deadline
AND root expiry within the entrypoint. consume enforces now<root expiry. Recovery
requires original holder and now>=its exact deadline. Phase does not replace clock.

## Write-method safety matrix

| Method | Caller | Allowed states | Forbidden states | Temporal/expiry gate | Idempotency | Value/accounting effect | Views affected | Negative tests |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| create_root | Authenticated creator | New valid ID | Existing/malformed ID, empty text/target | now+60<=expiry<=now+86400 | Duplicate rejects | No GEN; exactly two units | root/authority | duplicate, bad inputs and both expiry bounds; non-payable |
| propose_partition | Original holder | ACTIVE, both unused | FROZEN/SPLIT/CLOSED/any used unit | now<root expiry; now+30<=deadline<root expiry | Monotonic proposal ID, no edits | No GEN; freeze, no ownership change | root/proposal/authority | wrong caller/state, partial use, bad recipients, late/equality |
| assent | Exact A/B recipient | FROZEN/READY, own flag false | Wrong actor/digest, retryable/terminal, duplicate | now<proposal deadline and root expiry | Duplicate rejects | No GEN; does not grant authority | root/proposal | correct-digest outsider, wrong digest, replay, boundary-1/equal/+1 stale phase |
| review_partition | Original holder | READY/RETRYABLE, both assents, attempts<3 | Wrong role, missing assent, terminal, used root | now<proposal deadline and root expiry | Append attempt, terminal duplicate rejects | No GEN; only complete valid partition assigns same unit IDs | root/proposal/attempt/authority | wrong role/state/closed; malicious complete-shape meaning; extra/missing IDs/enums; no mutation on rejection |
| consume | Current unit owner | ACTIVE/SPLIT, unused unit | FROZEN/CLOSED, old owner after split, duplicate | now<root expiry | Duplicate rejects | No GEN; monotonic one-time unit use | root/authority | wrong owner, frozen, duplicate, closed, expiry-1/equal/+1 |
| expire_proposal | Original holder | FROZEN/READY/RETRYABLE | Wrong role, terminal, unknown | now>=proposal deadline | Duplicate rejects | No GEN; preserve owners/use, release freeze only | root/proposal/authority | premature/wrong role/duplicate/finalized, -1/equal/+1 stale phase |
| close_root | Original holder | Expired ACTIVE/FROZEN/SPLIT | Wrong caller, CLOSED, unknown | now>=root expiry | Duplicate rejects | No GEN; authority inactive, consumed units never resurrect | root/proposal/authority | premature/wrong caller/duplicate, pending interests, expiry boundaries |

## Evidence policy and authority matrix

Canonical objective is immutable root target, U0/U1 text and v1 rubric. Child prose
cannot override IDs, recipients, consequences or authority. Stored SHA256 binds exact
canonical fields, network/contract/root/proposal IDs, actors and expiry. Assent recomputes
the digest; transaction sender/role authenticates the INTERNAL declaration. Hash alone
is never proof of external fact. No user-supplied evidence URLs/bodies/signatures.
Fixed source https://www.w3.org/TR/2018/REC-odrl-model-20180215/ fetched within nondet,
status200/1000-300000 bytes/date/Permission markers checked independently. Context is
normative interpretation only. Root/proposal scopes<=1200 chars each, target<=160.
Missing/unavailable/conflicting/wrong-version context -> RETRYABLE with no ownership/use
change, followed by retry or timed recovery. Quoted artifacts are data, never instructions.

| Consequential claim/fact | Evidence/artifact | Data controller | Authoritative source/issuer | Deterministic verification | Canonical objective/entity/actor binding | Freshness/anti-replay | Semantic role after verification | Non-penalizing failure state | Consequence blocked | Required negative test |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Internal root units issued | Immutable U0/U1, target/owner | Creator wallet | Role-checked create transaction, protocol authority | Unique bounded root, fixed two units, valid time | Contract/network/root/unit/owner/target/v1 | Unique ID and transaction timestamp; monotonic one-time units | Original scope only | Revert unchanged | No root/child authority | Wrong entity/target/actor, duplicate and stale creation |
| Split authorized | Exact A/B text/recipient/deadline | Original holder | Owner-checked propose transaction | ACTIVE unused root, unique proposal, valid distinct addresses/time | Root/proposal/target/recipient/digest bindings | One active proposal; monotonic counter, expiry | Child meaning relative to root | Revert unchanged | No retirement/assignment | Outsider with valid digest; wrong parent; used-root; late proposal |
| Exact recipients assented | Digest and flags | A/B wallets | Signed transaction sender and role | Recomputed canonical digest equal, sender A/B, unused flag | Root/proposal/version/text/actor/expiry | One each, no editing/replay, deadline | Eligibility only, no model authentication | Revert unchanged | No READY review or reassignment | Correct-digest wrong caller; wrong digest/version; replay/stale/future-bound; prose redefining authority |
| Policy context available | Fixed dated W3C | W3C | Validator-side authoritative HTTPS fetch | Status/size/version/markers | Fixed source/v1 rubric; internal authority separately canonical | Dated version, each independent attempt | Context only, not ownership/performance proof | RETRYABLE | No parent retirement or child authority | Wrong-version/malformed/outage; arbitrary URL/artifact not accepted; injection no ID/owner widening |

## Consensus design

Leader captures canonical state first; no self/storage inside no-arg nondet block.
Legacy sandboxed gl.vm.run_nondet is used with v0.2.16; never the v0.3 unsandboxed API.
Validator independently fetches/prompt-replays, rejects non-gl.vm.Return, compares:
coverage exactly U0/U1 each A/B/BOTH/NEITHER/UNVERIFIABLE; limits exactly A/B each
WITHIN/WIDENING/UNVERIFIABLE. reason is bounded advisory prose, excluded from comparison.
Unknown noncritical metadata discarded; extra/missing critical IDs/enums revert before
any attempt/owner/use mutation. Normalize deterministically outside model output.

Any UNVERIFIABLE -> RETRYABLE; WIDENING or BOTH/NEITHER or both units allocated to
one child -> REJECTED; exactly one A/one B and both WITHIN -> PARTITIONED. Owner addresses,
IDs and consequence are derived from locked state. Invalid leader shape/coverage is
not a settlement. Native UNDETERMINED leaves no finalized fake attempt; diagnose before retry.

## Consequence, accounting and value destinations

PARTITIONED retires original holder, assigns conserved units to fixed recipients;
REJECTED restores original unused authority; RETRYABLE preserves frozen owners/use;
EXPIRED releases freeze if live; CLOSED disables all remaining rights.
Application value: **N/A**. No payable/deposit/bond/purse/credit/transfer/withdrawal method,
no stranded GEN liability or arbitrary fake reward. Protocol fees are outside contract
custody. Human-facing amounts use GEN. Every native-asset flow/remainder/transfer-proof
row is N/A because the primitive does not receive/move native assets.
Enforce exactly the same U0/U1 IDs, one owner each, consumed flags monotonic. Internal
authority consumption does not prove actual tool execution. Integrators wait finality.

## Reusable interface, consumer boundary and adoption

Writes: create_root, propose_partition, assent, review_partition, consume,
expire_proposal, close_root. Views: get_root/get_proposal/get_attempt/get_authority/get_policy.
LangGraph broker checks finalized authority and holder-signed consume; DAOhaus department
router calls propose/assent/review; A2A gateway reads exact current owner and usage.
No callback/consumer contract, adoption or external gateway enforcement claimed.
Substantial future milestone: more-than-two bounded subdivisions plus authenticated
real consumer enforcement, separate source/authority/runtime evidence required.

## Threat model and direct/lifecycle tests

Wrong origin and hash-valid wrong actor; wrong entity/target/version, invalid/replayed/
late digest; one-party assent; used root; extra/missing/duplicate critical IDs/enums;
shape-valid divergent meaning; web404/503/wrong-version/malformed source; injection;
different rationale accepted but different decision rejected; every outcome; entity
isolation; duplicate split/review/use; attempt cap; closed/frozen state; original-plus-child
duplication. All temporal writes use runtime clock at -1/equal/+1 with stale phase and
unchanged rejected state. Metadata checks non-payable methods; receipt tests cover raw
and normalized finalized SUCCESS/ERROR. Direct mode is local evidence, not network consensus.

## Claim-to-code matrix

| Claim | Contract method/state | View/read | Test | Network evidence |
| --- | --- | --- | --- | --- |
| Two isolated immutable units | create_root/units | root/authority | creation/isolation | lifecycle.json create/root and independent recovery.json root |
| Exact bilateral origin assent | propose/assent/flags | proposal | origin_digest_replay | lifecycle.json both assent receipts/proposal flags |
| Independent meaning consensus | review/Attempt | attempt | semantic_replay/invariants | consensus.json NORMAL, majority and canonical attempt |
| Conserved ownership/root retirement | review/SPLIT | root/authority | no_duplicate_authority | lifecycle.json SPLIT root/new owner reads |
| One-time exact-owner exercise | consume/consumed | authority | frozen/wrong_owner/duplicate | lifecycle.json both finalized consumed units |
| Timed recovery | expire/close | root/proposal | stale_phase_boundary_recovery | recovery.json restored root, expired proposal, closed root |

## Analogue/differentiation

GrantLattice retains ancestors and attenuates children, lacks exhaustive disjoint
retirement. ScopeExit cancels dependency closure/refunds, does not conserve/reassign units.
CycleWarrant rotates existing endowments instead of subdividing a root. CanonMerge
merges/forks fiction, not conserved operative authority. CoverWeave combines coalitions
and pays marginal shares, not scope conservation. ConcordBatch schedules competing
intents with fixed awards, no original authority retirement. Each differs in at least
four fingerprint dimensions. Shared canonical evidence does not imply shared mechanism.

## Deploy/evidence plan and Definition of Done

Python3.12 child .venv, exact pinned legacy runner/API/tools, GENVM_VERSION=v0.2.16.
Lint/semantic validation, all direct/tooling tests and npm run check. Existing three
authorized wallets only; no faucet/funding/key generation. Exact-source deploy then
schema smoke, complete split/consumption and recovery lifecycle with canonical reads,
safe receipts and validator agreement. Scripts persist pending hash before wait and
resume from actual state; bind network/source commit/hash/version. Evidence only under
docs/evidence/studionet; generic diagnostic not counted as product contract.
Public allowlist/hygiene, meaningful Git history, repo/CI/Explorer verification,
unchanged grading bot NO BLOCKER, complete copy-ready <1000-char Portal fields and final
master reread. Owner submits. Primary partition/both consumption and timed recovery/
close are verified. Other semantic classes and negative boundary branches are
local-test evidence only. No production gateway execution claimed.

## Honest limits / kill criteria

No external property, law, copyright, actual execution, custody, app, adoption or
legal validity. Exactly two units, one-level split, fixed recipients, bounded3 attempts.
Reject/redesign if deterministic code replaces semantic necessity; actor artifacts
grant authority without origin binding; any unit duplicates/orphans; stale phase bypasses
clock; differing semantic decisions both validate; or novelty is a prior-project slice.
