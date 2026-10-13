# Reuse without forking the judge

PartitionSeal defines an internal protocol authority boundary. Its declarations
do not prove external assets, legal title, copyright or executed tool calls.

1. Holder calls create_root(root_id,target,U0_scope,U1_scope,expiry). U0/U1 each
   exist exactly once and can each be consumed once by the original holder.
2. Before either use, holder calls propose_partition with distinct recipients,
   exact child scopes and deadline. Root use freezes pending outcome.
3. Each recipient reads get_proposal and calls assent(proposal_id,exact_digest).
   Digest binds exact root/child/actor/expiry/revision/contract/network fields.
4. Holder calls review_partition. Validators independently fetch W3C policy
   context and interpret complete U0/U1 coverage plus A/B non-widening.
5. Integrator waits FINALIZED and reads get_root, get_proposal, current get_attempt
   and get_authority for root:U0/root:U1. Never infer success from hash or finality alone.
6. Only current unit owner calls consume(unit_id). Finalized consumed=true is
   the internal one-time exercise record. An external gateway must enforce its
   own authenticated/idempotent side effect; this repository does not claim one.
7. RETRYABLE preserves frozen original ownership; diagnose source/schema before
   retry, read actual attempts dynamically, max3. Holder expires after deadline
   or closes after root expiry. A rejected split preserves original unused rights.

Proposed consumers: LangGraph tool-scope broker, DAOhaus department-right router,
A2A entitlement gateway. They use canonical reads and owner-signed consume,
not an offchain precomputed verdict. No external adopter is claimed.

The API deliberately limits subdivision to two fixed operation units and two
children. A valid result must cover each original unit exactly once with one
child per recipient, preserve duties/prohibitions and reject additional scope.
Repeated or overlapping assignment cannot duplicate a one-time unit.
