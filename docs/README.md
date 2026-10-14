# PartitionSeal V3 escrow specification

Active price1GEN per named recipient; complete settlement/refund/withdraw safety policy in [PAYMENT-PLAN.md](PAYMENT-PLAN.md). V3 real paid execution PASS_EXECUTION: five cases,32 parent writes,7 value children,8GEN received/withdrawn and0GEN liability/native balance; evidence/studionet/verification.json. V1 evidence is historical in evidence/studionet/archive/partition-seal-v1.json.

## Identity and product hook

IDEA-042, partition-seal, Intelligent Contracts, V3 VERIFIED PAID EXECUTION. Owner requested **Studionet
61999** for this deliverable. New independent contract-only repo.
V3 exact source/schema and all five paid cases verified. Current public CI/grader are being checked.

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
| Full lifecycle | PASS_ADMISSION; PASS_EXECUTION | Paid sale/refund/close/withdraw requires exact native/recipient deltas and finalized child proofs |
| Scope honesty | PASS_ADMISSION | No external property, legal title, copyright, execution, external delivery or adoption claim |

## Actors / scope and non-goals

Original holder authors and owns two internal units, proposes and reviews subdivision,
and can request timed recovery. Paid recipients independently recover after expiry if the holder disappears. Recipient A/B must be distinct from each other and holder;
each assents exact stored proposal, then only current owner can consume a unit.
Integrator reads FINALIZED canonical state; pending/simulated outcomes are advisory.

Exactly two operation units, one-level split, bounded attempts. No external issuer
receipt, tool execution, copyright, law, physical identity, wallet simulation or
cross-chain rights. Payable assent locks1GEN each; holder/refund credits and own-wallet withdrawals. No app/frontend/Vercel.

## Product/frontend blueprint and frontend lifecycle matrix

N/A in every subsection: human UI jobs, IA, visibility, controls, responsive behavior,
frontend tests and browser lifecycle are outside the locked Intelligent Contracts track.
Scripts and canonical views prove integration. No browser workflow claim.

## State model: IDs, storage, state machine, authorization

Root ID: 1-48 ASCII alphanumeric/underscore/hyphen. Immutable unit IDs root:U0/root:U1.
Proposal root:P<n>; attempt proposal:T<n>. Fully typed decorated dataclasses in
TreeMap[str,Root/Unit/Proposal/Attempt] plus TreeMap[str,bigint] wallet credits;
bigint counters/time/escrow/accounting totals. No JSON canonical storage.
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
| create_root | Authenticated creator | Fresh valid ID | Existing/invalid/empty | now+60<=expiry<=now+86400 | Duplicate rejects | Exactly0GEN; two units | root/authority/accounting | value attached/invalid bound/duplicate no mutation |
| propose_partition | Original holder | ACTIVE unused root | Used/FROZEN/SPLIT/CLOSED | now<root expiry; now+30<=deadline<expiry | Monotonic immutable proposal | 0GEN; zero initial escrow | root/proposal/payment | wrong role/state/time/recipient/nonzero value |
| assent payable | Exact named A/B | FROZEN/READY own flag false | Wrong actor/digest/replayed/terminal | now<proposal deadline AND root expiry | One paid assent each | Exactly1GEN -> escrow and received total | proposal/payment/accounting | 0/wrong value, valid digest wrong origin, replay/version/expiry; liability unchanged on rejection |
| review_partition | Original holder | READY/RETRYABLE both paid, attempts<3 | Missing payment/terminal/used/wrong role | now<both deadlines | Append attempts; terminal rejects | 0GEN; PARTITIONED holdercredit2, REJECTED paidbuyercredit1each, RETRYABLE none | attempt/root/authority/payment/credit/accounting | semantic invariant invalid before money, wrong role/state/time, no double allocation |
| consume | Exact current unit owner | ACTIVE/SPLIT unused | Frozen/used/closed/wrong owner | now<root expiry | Once | 0GEN, sale money unchanged | authority/accounting | nonzero value/role/state/time/duplicate |
| expire_proposal | Original holder or exact paid recipient | FROZEN/READY/RETRYABLE | Terminal/unknown/unpaid party/outsider | now>=proposal deadline | Pending allocation once; duplicate rejects | Paidflags refund to their own credits; zero escrow | root/proposal/payment/credit/accounting | premature/unauthorized/finalized/duplicate; paid buyer recovers without holder; partial deposit not orphaned |
| close_root | Original holder; paid recipient only for pending FROZEN root | Expired ACTIVE/FROZEN/SPLIT | Unknown/CLOSED/unpaid party/outsider | now>=root expiry | Closure once | Pending funds refund; sold/refunded payment unchanged | root/proposal/payment/credit/accounting | premature/duplicate/closed/wrong role; buyer recovery of pending/partial/retry; no double credit |
| withdraw | Positive credit owner only | Positive own wallet credit | Zero own credit/attached value | N/A: due credits never time-forfeit, no dependency on root phase | Debit once; duplicate zero rejects | Credit->withdrawn then same EOA finalized EthSend | credit/accounting + native/recipient balance/child receipt | stranger/duplicate/nonzero value, closed root still payable, exact message binding/debit/invariant |


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
| 1GEN paid for this exact proposal by this recipient | Actual signed transaction origin/value, immutable paid flag and escrow | Named wallet signs; runtime records value | GenVM transaction context and canonical proposal state | Sender named A/B; actual value exactly1GEN; digest recomputed; unused paid flag; complete escrow flags before review | Network61999/contract/revision/root/proposal/target/recipients/source/price/deadlines in locked digest | Unique immutable proposal, one payment each, now<both bounds; version-bound | Only scope judgment after deterministic eligibility; model cannot authenticate payment or supply payouts | Revert unchanged invalid auth/value/binding; RETRYABLE source/model ambiguity | No authority, seller credit, refund to outsider or transfer | Correct-digest wrong-origin/amount; replay/stale/version/target/malicious amount fields cannot alter escrow/credits/settlement |

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

Each named recipient pays exactly **1 GEN** via payable `assent`. Root issuer is
the seller of INTERNAL protocol rights only. Two assents lock **2 GEN**.
Price, revision, canonical source, actors, root/proposal IDs and timestamps are
included in the immutable/recomputed proposal digest. No model chooses amounts
or recipients. Sender and actual `gl.message.value` authenticate origin/payment.

- PARTITIONED: same conserved units assigned once; 2 GEN escrow becomes holder
  credit once. No reversal after successful sale/consumption/root expiry.
- REJECTED: each paid recipient receives their 1 GEN credit; root ownership stays.
- RETRYABLE: escrow remains locked, no seller or recipient credit; at most3 attempts.
- expire_proposal: original holder or exact paid recipient, now>=deadline, pending state; credits each
  paid recipient, including single-assent proposals. Root ACTIVE if still live,
  otherwise CLOSED. Exactly-once settlement; late/repeated calls never duplicate credit.
- close_root: holder or pending paid recipient, now>=root expiry; pending proposal refunds all paid amounts,
  then closes. Already PARTITIONED/REJECTED/EXPIRED money is never settled again.
- withdraw: caller may withdraw only their complete positive credit to that same
  authenticated address. Debit before finalized-only EVM-interface emission.
  Credit is collectible even after root closure: no clock-based forfeiture.

Typed bigint received/withdrawn/escrow/credit totals and str-keyed credit map.
Invariant: received = withdrawn + escrow + credit; each term nonnegative.
Proposal escrow equals 1 GEN times authenticated paid flags while LOCKED, zero
after one-time allocation. Native balance equality is verified after transfer
finality; a parent success/internal debit alone never proves external payment.
Nonpayable writes explicitly reject nonzero value and retain SDK metadata.

## Value-destination matrix

| Value item | Payer/source | Locked state | Release destination | Refund destination | Forfeit destination | Terminal states covered | Duplicate/late/retry behavior | Canonical proof view |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A purchase1GEN | Named A signed payable assent | Proposal LOCKED | Original holder credit only after PARTITIONED | A credit on REJECTED/expired/pending-root-close | None | PARTITIONED/REJECTED/EXPIRED/CLOSED | Duplicate/late reject; RETRYABLE locks until valid review/expiry/close | get_payment/get_credit/get_accounting |
| B purchase1GEN | Named B signed payable assent | Proposal LOCKED | Same holder credit only after PARTITIONED | B credit on REJECTED/expired/pending-root-close | None | Same plus B never-assented0 liability | No collection from absent B; no double-credit | Same views |
| Seller credit2GEN | Both validated payments | Credit ledger | Same original holder EOA | N/A: complete valid protocol sale, no clawback | None | PARTITIONED/SPLIT/CLOSED | Later close cannot refund sold rights; withdraw once | get_credit/get_accounting/native balance/EOA balance/child receipt |
| Buyer refund1GEN | Exact paid amount | Credit ledger | Same paid A/B EOA via withdraw | Original authenticated payer only | None | REJECTED/EXPIRED/CLOSED | Remains collectible without expiry; no arbitrary destination | Same canonical credit/accounting and exact contract/recipient delta |
| Never-assented party | No value received | N/A zero | None | None | None | Partial assent/expiry/close | Cannot earn unbacked credit | get_payment paid flags/escrow |


## Reusable interface, consumer boundary and adoption

Writes: create_root, propose_partition, assent, review_partition, consume,
expire_proposal, close_root, withdraw. Views: get_root/get_proposal/get_attempt/get_authority/get_policy/get_payment/get_credit/get_accounting.
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
| Two isolated immutable units | create_root/units | root/authority | creation/isolation | payments.json sale and independent recovery roots |
| Exact bilateral paid origin assent | propose/assent/flags/value | proposal/payment/accounting | origin_digest_replay/wrong_value | payments.json sale deposits/flags/exact contract increases |
| Independent meaning consensus | review/Attempt | attempt | semantic_replay/invariants | payments.json sale/rejected actual dynamic attempt and SUCCESS |
| Conserved ownership/root retirement | review/SPLIT | root/authority | no_duplicate_authority | payments.json sale root/owners |
| One-time exact-owner exercise | consume/consumed | authority | frozen/wrong_owner/duplicate | payments.json sale both consumed |
| Timed recovery | expire/close | root/proposal/payment | stale_phase_boundary_recovery/paid_recovery | payments.json smoke/expiry/close |
| Exact holder sale credit | review/_release/credits | credit/payment/accounting | valid_partition/sale_once | payments.json sale beforeWithdraw credits2GEN |
| Payer-specific refunds | review/expire/close/_release | credit/payment/accounting | rejection/partial/retry/close | payments.json rejected/smoke/expiry/close |
| Authenticated own-wallet withdrawal | withdraw/EVM interface | credit/accounting + native balance | evm_boundary/no_double/outsider | payments.json all withdraw child receipts and exact contract/recipient deltas |

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
authorized wallets only; owner-approved2GEN funding to existing A, no faucet or
key generation. Exact-source deploy then
schema smoke, complete split/consumption and recovery lifecycle with canonical reads,
safe receipts and validator agreement. Scripts persist pending hash before wait and
resume from actual state; bind network/source commit/hash/version. Evidence only under
docs/evidence/studionet; generic diagnostic not counted as product contract.
Public allowlist/hygiene, meaningful Git history, repo/CI/Explorer verification,
unchanged grading bot NO BLOCKER, complete copy-ready <1000-char Portal fields and final
master reread. Owner submits. Paid partition/refund/expiry/close/withdraw proof
is complete in payments.json and independently re-read in verification.json. Invalid auth/output, source
outage and other negative boundary branches are local-test evidence only.
No production gateway execution claimed.

## Honest limits / kill criteria

No external property, law, copyright, actual gateway execution, app, adoption or
legal validity. Exactly two units, one-level split, fixed recipients, bounded3 attempts.
Reject/redesign if deterministic code replaces semantic necessity; actor artifacts
grant authority without origin binding; any unit duplicates/orphans; stale phase bypasses
clock; differing semantic decisions both validate; or novelty is a prior-project slice.
