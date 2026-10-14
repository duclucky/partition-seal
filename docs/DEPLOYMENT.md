# Verified V3 escrow deployment

NETWORK = Studionet; chain ID61999, owner-selected for this run. Separate from Studio Dev.
CONTRACT_ADDRESS = 0xF6027BFEd18Fc5e50c1E6f56f015bbB5826F7EAD.

- [Contract](https://explorer-studio.genlayer.com/address/0xF6027BFEd18Fc5e50c1E6f56f015bbB5826F7EAD)
- [Deploy transaction](https://explorer-studio.genlayer.com/tx/0xf66bcc8f3a7d0ae1fdf894bc620df148700bcab28751082830ac393e8ddd5e50)
- Source commit88663f2ef7674444aeb6ab9dde06fab84b30c65a.
- Source SHA256333ce07cb91bbf8e8d90fcd6b71689762678ad51f3e5bae88f89140c1aa096a3.
- Pinned v0.2.16 runner/API and genlayer-js1.1.8; one class,16methods, assent payable.

node scripts/studionet.mjs: FINALIZED; Result: SUCCESS; MAJORITY_AGREE.
Schema/canonical policy and exact deployed source were independently verified.
A failed polling attempt was reconciled by saved signed/hash/nonce before retry;
no duplicate deployment or funding was sent.

node scripts/payments.mjs all: five complete real money cases. Each deposit1GEN,
seller exit2GEN, refunds1GEN each. A paid buyer signs expired recovery and pending
root close, protecting money even when the original holder does not act.

node scripts/verify_payments.mjs: verifiedtrue, caseCount5, parentCount32,
childCount7, received8GEN, withdrawn8GEN, native balance0GEN, liability0GEN;
all three wallet credits0GEN. Each exit binds child finality/from/to/value/parent,
exact native contract decrease and exact recipient increase. Native children have
no GenVM execution-result field; this is an expected external-message boundary.

Deployment/evidence: deployment.json, payments.json, verification.json, consensus.json
inside evidence/studionet. Historical V1 noncustodial and V2 restricted-recovery
records are separately archived. V2 balance/liability were0GEN before V3 replacement.
