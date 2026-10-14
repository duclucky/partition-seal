# PartitionSeal V2 escrow review

One pinned ASCII PartitionSeal contract owns protocol rights and purchase escrow.
Independent source/prompt replay compares complete coverage and non-widening meaning;
rationale differences are ignored and a contrary valid-shape decision fails replay.
Payment/recipient/price/destinations are deterministic locked state, never model prose.

The owner approved the public behavior change before V2 implementation. PAYMENT-PLAN
records eight write safety cards, all terminal/partial/retry value destinations and
the complete payment-origin authority matrix before money methods were implemented.

Fresh check: npm run check exit0;90 direct cases,7 general receipt cases,8 native-value
receipt cases, zero skipped. Lint recognizes16 methods (8writes/8views); only assent
is payable in source and actual deployed schema. Existing negative/semantic/expiry
cases were retained and adapted to paid assent; snapshots include accounting.
Additional cases cover wrong amount, real value with forged origin/digest/replay,
partial/complete/retry/closed recovery, unchanged money on invalid settlement,
fixed EVM recipient/value message, nonpayable writes and no double allocation/use/withdraw.

Actual source-bound deployment V2: FINALIZED/SUCCESS. The1GEN partial-expiry smoke
proved the external child finality and exact contract decrease/recipient increase.
Other paid cases are IN PROGRESS until payments.json marks complete. Nothing is
credited as real proof from direct-mode mocks. The SDK log boundary projects safe
fields; receipts/configs/key material are never dumped. A transient HTML RPC polling
failure was reconciled by reading the saved hash, not replaying a write.

Actual sale review: NORMAL, leaderOnlyfalse, MAJORITY_AGREE/SUCCESS;3 validators
agree/SUCCESS and1 idle/ERROR. Exact error cause remains unknown. Preserve this
limit; do not claim all validators succeeded or force leader-only execution.

Limits: internal constitutive permissions, exactly2 units/two recipients/one level,
max3 attempts. No external tool action/property/legal title/adoption/app is claimed.
V1's no-custody evidence is archived and does not prove V2 payment safety. Invalid
leader/source/auth/clock branches are local-test proof unless a specific live case
is recorded. No public behavior changes beyond the approved escrow policy were made.
