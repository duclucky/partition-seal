# PartitionSeal

Contract-only primitive for conserving two exclusive protocol permission units
when an original holder subdivides their semantic scopes between two recipients.
Independent GenLayer validators judge complete coverage and non-widening; code
reassigns each existing unit exactly once and retires original authority.

Status: implementation in progress. Product deployment, lifecycle and CI evidence
are pending. [Specification](docs/README.md) defines the authority model, safety
rows, meaning validator, temporal guards and executable acceptance cases.

Owner-selected network for this run: **Studionet**, chain61999. It is separate
from Studio Dev. API v0.2.16 / concrete runner / genlayer-js1.1.8 form one pinned
unit. No user-facing app or Vercel project. No native GEN custody, deposits or fees
collected by the application. Rights are internal protocol permissions; no external
copyright, property, legal title, tool execution or adoption is claimed.

Build with Python3.12 and Node, install requirements-dev.txt into .venv, run npm ci
and npm run check. All deployment and source/identity evidence remains pending.
