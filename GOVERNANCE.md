# Governance & Knowledge Integrity

## Independence Statement
This platform is independent. It is not an official channel of NELFUND or the Federal Ministry of Education. Its purpose is to reduce friction and misinformation for students while directing them to official sources.

## Knowledge Governance
- All factual claims live in structured JSON under `src/data/`.
- Each item includes: `verification_status`, `source_id`, `last_verified`, and optional related media/guides.
- Verification statuses:
  - `verified` — Confirmed against official NELFUND materials at last_verified date
  - `may_change` — Subject to policy or cycle updates
  - `guidance` — Best-practice operational advice
  - `unverified` — Provisional; treat with caution

## Change Control
- Knowledge updates should be reviewed for source accuracy before merge.
- AI system prompt and intent rules are version-controlled and subject to regression testing.
- Daily automated refresh job exists for live official pages; human review remains the gate for policy claims.

## Accountability
Maintainers are responsible for keeping disclaimers visible and for not presenting the platform as an official government service.
