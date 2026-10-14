# PartitionSeal V3

A reusable Intelligent Contract that conserves two exclusive internal protocol
permission units when their holder partitions semantic scope between two recipients.
Independent meaningful consensus gates both conserved unit assignment and payment.

Each named recipient escrows1GEN in a digest-bound payable assent. Valid complete
partition credits2GEN to the holder; rejection or expiry refunds each actual payer.
A paid recipient can recover after the deadline without the holder. Own-wallet
withdrawal emits a finalized EVM message; exact native balance proof is required.

Status: V3 source passes104 direct +15 receipt cases, one ASCII contract,16 methods
(8writes/8views). V3 deployment and complete real paid lifecycle are PENDING.
The earlier V2 completed smoke/sale/rejection payments, but holder-only recovery
could strand money under actor abandonment. All V2 funds/credits were recovered
before replacement; native balance/liability0GEN, archive retained. V1 was noncustodial.

Owner-selected network: Studionet61999. Pinned v0.2.16 runner/API and SDK1.1.8.
No app/frontend/Vercel, no external property, copyright, law, execution or adoption claim.

[Specification](docs/README.md), [payment safety/value plan](docs/PAYMENT-PLAN.md),
[integration API](docs/INTEGRATION.md). Install requirements-dev.txt into Python3.12
.venv, npm ci, then npm run check. Local mocks never substitute for real money proof.

[Historical V1](docs/evidence/studionet/archive/partition-seal-v1.json),
[recovered V2](docs/evidence/studionet/archive/partition-seal-v2.json).
Copy-ready submission fields will be updated only after current execution/CI/grader pass.
