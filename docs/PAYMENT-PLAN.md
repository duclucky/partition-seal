# Escrow revision V3: approved payment behavior and execution plan

Owner approved adding escrow and real 1-2 GEN tests on Studionet61999.
V1 noncustodial tests/evidence remain historical; they prove no payment flow.
Status: PASS_ADMISSION and PASS_EXECUTION for V3. All five paid cases and independent32-parent/7-child verification complete;8GEN received/withdrawn,0GEN liabilities/native balance.
No app, second application contract, runner migration or changed semantic rubric.
V2 monetary smoke/sale/rejection worked, but review found holder-only recovery
could strand a buyer's deposit if the holder disappears. V2 is superseded after
all funds/credits are recovered. V3 permits original holder OR any named recipient
whose paid assent is recorded to recover a pending proposal after its deadline,
or close a pending root after its expiry. An unpaid recipient/outsider cannot.
This is necessary to enforce the approved refund/no-orphan policy; money always
returns to actual payers, never to the actor who happened to call recovery.

## Locked money and state policy

Each named recipient pays exactly **1 GEN** via payable `assent`. Root issuer is
the seller of INTERNAL protocol rights only. Two assents lock **2 GEN**.
Price, revision, canonical source, actors, root/proposal IDs and timestamps are
included in the immutable/recomputed proposal digest. No model chooses amounts
or recipients. Sender and actual `gl.message.value` authenticate origin/payment.

- PARTITIONED: same conserved units assigned once; 2 GEN escrow becomes holder
  credit once. No reversal after successful sale/consumption/root expiry.
- REJECTED: each paid recipient receives their 1 GEN credit; root ownership stays.
- RETRYABLE: escrow remains locked, no seller or recipient credit; at most3 attempts.
- expire_proposal: original holder or paid recipient, now>=deadline, pending state; credits each
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

## Write-method safety matrix (before each revision's implementation)

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

## Evidence authority delta

The four complete V1 authority rows remain applicable to internal scope issuance,
immutable proposal, signed bilateral origin/digest and authoritative W3C context.
Payment has this additional complete consequential path:

| Consequential claim/fact | Evidence/artifact | Data controller | Authoritative source/issuer | Deterministic verification | Canonical objective/entity/actor binding | Freshness/anti-replay | Semantic role after verification | Non-penalizing failure state | Consequence blocked | Required negative test |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1GEN paid for this exact proposal by this recipient | Actual signed transaction origin/value, immutable paid flag and escrow | Named wallet signs; runtime records value | GenVM transaction context and canonical proposal state | Sender named A/B; actual value exactly1GEN; digest recomputed; unused paid flag; complete escrow flags before review | Network61999/contract/revision/root/proposal/target/recipients/source/price/deadlines in locked digest | Unique immutable proposal, one payment each, now<both bounds; version-bound | Only scope judgment after deterministic eligibility; model cannot authenticate payment or supply payouts | Revert unchanged invalid auth/value/binding; RETRYABLE source/model ambiguity | No authority, seller credit, refund to outsider or transfer | Correct-digest wrong-origin/amount; replay/stale/version/target/malicious amount fields cannot alter escrow/credits/settlement |

## Fourteen admission gates for the payment delta

1. Replacement PASS: issuer backend could sell overlapping authority or pay itself;
   independent meaningful judgment gates both conserved units and seller credit.
2. Judgment PASS: unchanged full semantic coverage/non-widening necessity.
3. Evidence availability PASS: same bounded canonical fields and dated W3C source;
   V1 real fetch/review proves runtime access, V2 execution still pending.
4. Evidence authenticity PASS: constitutive rights and signed actual-value context;
   complete matrix above; no claimant receipt or hash-only payment claim.
5. Equivalence PASS: same exact semantic tuple, rationale ignored; no money from LLM.
6. Consequence PASS: conserved assignment plus deterministic seller credit or refund.
7. Adversarial PASS: seller wants sale; buyers oppose widened/overlapping scopes
   and forfeited deposits. All payments have deterministic authorized destinations.
8. State model PASS: isolated proposals, fixed actors/price, one-time flags,
   complete pending/partial/retry/expiry/close/withdraw recovery, direct clock guards.
9. Reuse PASS: same three permission broker/router/gateway consumers plus credits API.
10. Contract count PASS: one contract owns authority and escrow; _Recipient is
    an external interface, never another gl.Contract or pass-through guard.
11. Differentiation PASS: existing conserving exclusive subdivision/root retirement
    remains the differentiator; adding payment is not claimed as a new unrelated idea.
12. Claim-to-code PASS: assent/value->payment/accounting views/tests; review->seller/
    buyer credits; expire/close->refund; withdraw->native/recipient/receipt proof.
13. Full lifecycle PASS_ADMISSION: plans below completely specify all fund branches
    and zero-liability endings. PENDING_EXECUTION until actual value proof.
14. Scope honesty PASS: V1 success no longer satisfies requested paid lifecycle;
    V2 source/API/direct tests and real GEN exits must be independently verified.

## Ordered execution and acceptance

1. TDD missing purchase/settlement test RED; all money/recovery negative tests
   written before implementing bodies. Adapt preserved V1 state/meaning cases to
   exact paid assent and add accounting snapshots; never remove a negative case.
2. Implement V2 with same pinned legacy API, one class, ASCII source; lint and
   direct/metadata/parser tests, npm run check; verify expected interface before value.
3. Archive V1 source-bound receipts and zero native liability, commit V2 source,
   deploy new immutable revision, verify exact code/schema/payable metadata.
4. Bounded real1GEN purchase/refund/withdraw smoke proves EOA EthSend on target
   before a full two-party sale. Existing approved wallets only. RecipientA now
   has0GEN: fund2GEN once from pre-funded holder, persist hash before wait and
   verify receipt/balance before retry. No faucet or new wallet.
5. Real successful partition: A1+B1GEN -> holder2GEN credit -> holder withdraw;
   then same conserved units consumed. Real REJECTED: A/B1 each -> refund each1
   -> both withdraw. Real partial expired proposal1GEN -> exact refund/withdraw;
   expired-root pending funds -> close refund/withdraw. RETRYABLE/malformed/auth/
   duplicate/clock negatives require local proof; add real retry if stable runtime
   evidence permits, never fake expected class or inject Studio mocks.
6. Each transfer: parent FINALIZED/SUCCESS, exact child sender/recipient/value
   and finality, no explicit child error, exact contract decrease, recipient increase,
   credits/liabilities zero after collection. Snapshot balances before each write.
7. Update all claims/evidence/counts, audit every push/history/secrets, passing
   public CI, unchanged grader NO BLOCKER, reread master and update checklist.

Acceptance is PENDING until steps2-7 are executed. No GEN may be sent to V1 or to
an unverified V2 without its closed/refund/withdraw path and bounded smoke proof.
