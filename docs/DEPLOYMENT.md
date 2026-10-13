# Verified Studionet deployment

Network: **Studionet**, chain **61999**. Studio Dev is a separate network.
One application contract, PartitionSeal; 12 methods (7 write, 5 view).

- Contract: [0xF7fa8F9b9Cb0c9195675570e11fDD9dc321Bf8c5](https://explorer-studio.genlayer.com/address/0xF7fa8F9b9Cb0c9195675570e11fDD9dc321Bf8c5)
- Deploy transaction: [0x68fe0bb6...](https://explorer-studio.genlayer.com/tx/0x68fe0bb658db8b0a9c76ab50496e9ea35095cc71355aa258f0d88a7b465abbac)
- Source commit: `bca1a72f95e769c2bdef583f6e344d239fce91f9`.
- Source SHA256: `9c052ca545441560b7d63e9dafa8f5be61e1965ac3182a4fd20e0014004f864a`.
- API: v0.2.16; concrete runner and SDK1.1.8 recorded in deployment.json.

Command: `node scripts/studionet.mjs`.
Actual result: **Status: FINALIZED; Result: SUCCESS; MAJORITY_AGREE**.
Canonical policy read passed; all12 expected schema methods found; deployed source
hash equals the exact committed contract source. Both Explorer routes returned HTTP200.
This is deployment/schema proof, not full lifecycle proof by itself.
See [safe machine record](evidence/studionet/deployment.json).

Application holds/moves no GEN. Native transaction value was **0 GEN**; there is
no deposit/withdrawal/refund flow. Token-bearing demo requirements are N/A to this
non-custodial primitive; no fake balances, fees or dust deposits are introduced.

The primary lifecycle is tracked separately in lifecycle.json. Pending steps
remain pending until receipts AND canonical ownership/consumption reads complete.
