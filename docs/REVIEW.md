# Contract review and verification boundaries

Reviewed against the Intelligent Contracts bar after implementation.

- Meaning validator: independent source/prompt replay compares complete U0/U1
  allocation and A/B limit meaning. Rationale wording may differ. Explicit direct
  replay test rejects changed critical meaning with valid JSON shape.
- State: four typed str-keyed TreeMaps and decorated records; one class; immutable
  roots/proposals; monotonic attempts/use; no global last-result storage.
- Consequence: complete valid partition changes the two existing unit owners
  atomically. Original holder loses consumption authority; unit IDs and count
  remain constant. Rejection/recovery does not mint replacement units.
- Evidence: origin checked at issuance/proposal/assent, digest recomputed at
  assent and review, canonical objective is not supplied by child prose. W3C is
  context only, not proof of external ownership or performance.
- Safety/time: every public temporal write has a prior safety row and a local
  transaction-time guard, with stale-phase tests. Expiry/close are original-holder
  only and cannot run prematurely or twice. No custody/recovery money flow exists.
- Edge handling: malformed output/extra IDs/unknown enums reject before mutation;
  unavailable/wrong-version context records RETRYABLE without ownership change.
  Unsupported actual consensus is not presented as finalized product state.
- Reuse: documented exact methods/views for three proposed downstream builders;
  no app, generic registry, prior-project extraction or adoption claim.

Fresh local check: `npm run check`, exit0: **49 direct cases +7 Node receipt cases**,
no skipped tests; semantic lint recognizes PartitionSeal, 12 methods; ASCII/header
and NO-APP check passes. Direct-mode mocks are local proof only. Deployed source,
schema and Result: SUCCESS are independently recorded in DEPLOYMENT.md.

No public behavior change was applied during this review. Remaining required
acceptance evidence: primary/recovery canonical lifecycle, final public repo/CI,
unchanged full grading check, and final master/checklist audit.

Limits: two-unit, one-level partition; fixed recipients; max3 attempts; internal
permissions only. No actual external gateway, crypto title, law or GEN custody.
The source witness spike is diagnostic and excluded from the application count.
