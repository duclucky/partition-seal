# PartitionSeal

Contract-only primitive for conserving two exclusive protocol permission units
when an original holder subdivides their semantic scopes between two recipients.
Independent GenLayer validators judge complete coverage and non-widening; code
reassigns each existing unit exactly once and retires original authority.

Status: owner-approved V2 adds paid escrow. Local lint/direct tests pass;
**V2 real payment evidence, new deployment and CI are pending**. V1 evidence
proves the earlier noncustodial lifecycle only and is being archived.
[Specification](docs/README.md) defines the authority model, safety
rows, meaning validator, temporal guards and executable acceptance cases.

Owner-selected network for this run: **Studionet**, chain61999. It is separate
from Studio Dev. API v0.2.16 / concrete runner / genlayer-js1.1.8 form one pinned
unit. No user-facing app or Vercel project. Each paid assent escrows1GEN;
valid semantic partition credits2GEN to the original holder, rejection/expiry
credits each actual payer for refund, with own-credit withdrawal.
Rights are internal protocol permissions; no external
copyright, property, legal title, tool execution or adoption is claimed.

Build with Python3.12 and Node, install requirements-dev.txt into .venv, run npm ci
and npm run check. Local direct check passes90 cases; receipt checks are separately
run by the same command. One ASCII contract,16 methods (8 writes,8 views).

[Payment design and safety matrices](docs/PAYMENT-PLAN.md) govern V2.

The remaining deployment/example sections below describe **historical V1** until
the new immutable V2 deployment and paid lifecycle are verified. They must not be
used as evidence of V2 deposits, payouts, refunds or withdrawals.

## Deployment

NETWORK = **Studionet**, chain **61999**.
CONTRACT_ADDRESS = **0xF7fa8F9b9Cb0c9195675570e11fDD9dc321Bf8c5**.
[Explorer contract](https://explorer-studio.genlayer.com/address/0xF7fa8F9b9Cb0c9195675570e11fDD9dc321Bf8c5).
[Deploy transaction](https://explorer-studio.genlayer.com/tx/0x68fe0bb658db8b0a9c76ab50496e9ea35095cc71355aa258f0d88a7b465abbac).
**Status: FINALIZED; Result: SUCCESS**. Exact deployed source matches commit
bca1a72f95e769c2bdef583f6e344d239fce91f9; schema and canonical policy verified.
[Deployment proof](docs/evidence/studionet/deployment.json).

## Real worked example

Root grants U0 private article reading and U1 private printing, both requiring
attribution and forbidding distribution. Holder proposes A private viewing with
source credit/no sharing, and B a private paper copy with source credit/no sharing.
Both named recipients assent the exact digest. Independent validators refetch
fixed W3C context and compare **meaning**: U0 belongs exclusively to A, U1 to B,
and both child scopes are WITHIN original permissions. Rationale wording may vary.
Changing either coverage or limit conclusion cannot pass validator equivalence.

Actual outcome: **PARTITIONED**; root **SPLIT**; both conserved unit IDs reassigned
to their fixed recipients and then consumed once. Original holder cannot exercise
them afterward. No external tool execution is implied. Native contract balance
is **0 GEN**; no application deposit or payout exists.
[Lifecycle proof](docs/evidence/studionet/lifecycle.json).

A second real case left both recipients unassented, expired the proposal to restore
unused original rights, then closed the expired root; final authority inactive.
[Recovery proof](docs/evidence/studionet/recovery.json).
Review finalized MAJORITY_AGREE with three AGREE validators and one ERROR validator;
the failed validator's exact cause is unknown. The failure is retained in the
[safe consensus record](docs/evidence/studionet/consensus.json).

## Reuse and limits

[Integration API](docs/INTEGRATION.md): proposed LangGraph permission broker,
DAOhaus department router, and A2A entitlement gateway consume finalized canonical
views and holder-signed one-time exercise. No adopter or real external gateway is
claimed. Two units/two children, one level, at most three attempts. Authoritative
transactions create internal permissions; they do not prove external property,
copyright, service delivery or law. No frontend or native asset custody.

[Copy-ready submission fields](docs/SUBMISSION.md). The owner submits on the Portal.
