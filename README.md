# PartitionSeal V3

Reusable Intelligent Contract for conserving two exclusive internal permission
units when their original holder partitions semantic scope between two recipients.
Independent meaning consensus gates both conserved ownership and escrow payment.

Each named wallet assents immutable digest-bound terms and pays **1 GEN**. A valid
complete partition credits **2 GEN** to the holder. Rejection/expiry refunds actual
payers; a paid buyer can recover after deadlines without waiting for the holder.
Only each wallet's own credit can be withdrawn, through the finalized EVM boundary.

## Verified deployment and payment lifecycle

NETWORK = Studionet; chain ID61999, selected by the owner. Separate from Studio Dev.
CONTRACT_ADDRESS = **0xF6027BFEd18Fc5e50c1E6f56f015bbB5826F7EAD**.
[Explorer contract](https://explorer-studio.genlayer.com/address/0xF6027BFEd18Fc5e50c1E6f56f015bbB5826F7EAD) · [Deploy transaction](https://explorer-studio.genlayer.com/tx/0xf66bcc8f3a7d0ae1fdf894bc620df148700bcab28751082830ac393e8ddd5e50).
**Status: FINALIZED; Result: SUCCESS; MAJORITY_AGREE**.
Exact source commit `88663f2ef7674444aeb6ab9dde06fab84b30c65a` and source/schema/payable metadata verified.
Pinned legacy v0.2.16 runner/API plus SDK1.1.8 form one coherent unit.

| Real case | Value delivered | Canonical final state | Parent withdrawal proof |
| --- | --- | --- | --- |
| Partial assent / buyer expiry | 1 GEN | ACTIVE / REFUND_CREDIT | [withdraw1](https://explorer-studio.genlayer.com/tx/0x990c943c204cabfe461c88c8bc832ce30ebc6491b43293380080819c39b5fd91) |
| Valid partition / seller payout | 2 GEN | SPLIT / HOLDER_CREDIT | [withdraw0](https://explorer-studio.genlayer.com/tx/0xf67baa9ff9033c49985d8010a3fc3fe516ddda0c108fd8bd999fc365a1f6dce5) |
| Rejected scopes / two refunds | 1 GEN each | ACTIVE / REFUND_CREDIT | [withdraw1](https://explorer-studio.genlayer.com/tx/0x5bcf115a0a48e27f76161712d546a7c969c920291c29cae0b3a5e1185b05b9ec); [withdraw2](https://explorer-studio.genlayer.com/tx/0xf489f89a3b5111b88348050f79a00b394b8bacaa7b248540389c26d0f65bc3d8) |
| Both paid / buyer expiry | 1 GEN each | ACTIVE / REFUND_CREDIT | [withdraw1](https://explorer-studio.genlayer.com/tx/0x09a3837bb437b6d98499a2ba82764a847e29cf0c22cea2d37afe0f36576110e5); [withdraw2](https://explorer-studio.genlayer.com/tx/0xcf0010ffa0eefa6ede995ba92b167ec91abe5dff7ca8fbb3c5a7a092f63325db) |
| Pending root / buyer close | 1 GEN | CLOSED / REFUND_CREDIT | [withdraw1](https://explorer-studio.genlayer.com/tx/0xba74ecb8d79907df5ad5f3c29679c6b465338c35a89f80a7f36804b0245476c8) |

All five cases completed with **0 GEN** native balance and liability after collection.
Independent read verification checked **32** successful parent writes and **7**
finalized value children: **8 GEN received, 8 GEN withdrawn**, all wallet credits0GEN.
Every exit records exact contract decrease and recipient increase, not just parent
success or internal debit. The buyer signs expired recovery/close; no issuer is needed.
[Money evidence](docs/evidence/studionet/payments.json) ·
[Fresh verification](docs/evidence/studionet/verification.json).

## Real meaning example and reuse

Original units: private article reading and printing with attribution/no distribution.
A receives private viewing with source credit/no sharing; B a private paper copy
with source credit/no sharing. Actual review: U0=A/U1=B, both limits WITHIN;
PARTITIONED root SPLIT, same units reassigned and each consumed once. Duplicate
overlapping reading scopes were REJECTED; both payers recovered1GEN each.
Rationale wording may vary; a different allocation/limit decision fails equivalence.

[Specification](docs/README.md), [payment authority/safety/value matrix](docs/PAYMENT-PLAN.md),
[integration API](docs/INTEGRATION.md). Proposed consumers: LangGraph permission
broker, DAO department router, A2A entitlement gateway. No real adopter is claimed.

## Checks and limits

Python3.12 .venv, requirements-dev.txt, npm ci, npm run check: **104 direct cases +
17 Node receipt cases**, zero skipped. One ASCII contract,16 methods (8writes,8views),
only assent payable. No app/frontend/Vercel, no external property/copyright/law/tool
execution or adoption claim. Exactly two units/two recipients/one level/max3 attempts.

Normal multi-validator sale review finalized MAJORITY_AGREE/SUCCESS. Its record
contains two agree/SUCCESS validator receipts and one idle/ERROR receipt; the error's
exact cause is unknown. [Safe consensus record](docs/evidence/studionet/consensus.json).
Source outage/malformed/auth/duplicate/time negatives are local-test evidence, not
claimed live transactions. Native children have no GenVM execution-result field;
finality, exact sender/recipient/value/parent binding and balance deltas prove exits.

[V1 archive](docs/evidence/studionet/archive/partition-seal-v1.json) is noncustodial.
[V2 archive](docs/evidence/studionet/archive/partition-seal-v2.json) records its recovery
restriction and complete zero-balance/liability cleanup before V3; no further funds sent.
V1 evidence cannot prove payments; V2 evidence is not V3 proof.

[Public V3 CI PASS](https://github.com/duclucky/partition-seal/actions/runs/38499665001).
Unchanged grader:0BLOCKER,1 reviewed private-guard warning, dynamic checks PASS,
GATE OK. See REVIEW.md for the exact warning and actual payable metadata proof.
[Copy-ready Portal fields](docs/SUBMISSION.md); owner handles reCAPTCHA and Submit.
