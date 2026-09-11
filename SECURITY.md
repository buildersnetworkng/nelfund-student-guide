# Security Policy

## Scope
This document describes the security posture of the NELFUND Student Support Platform, an independent civic-technology application.

## Principles
1. **Minimise sensitive data:** The system never requests or stores passwords, OTPs, full NIN, full BVN, or bank account credentials.
2. **Official sources only:** Outbound fetches are restricted to an allow-list of official NELFUND domains.
3. **No policy invention:** The AI agent is instructed and architected to refuse inventing eligibility outcomes, deadlines, amounts, or official contacts.
4. **Transparent trust labels:** Every knowledge item carries a verification status and source attribution.
5. **Privacy-first analytics:** Optional analytics use server-side storage and avoid PII by design.
6. **Secrets only in environment variables:** Redis, admin, cron, and model keys must never be committed to the repository.

## Backend controls (production)
| Control | Implementation |
|--------|----------------|
| Admin analytics | `x-admin-key` compared with timing-safe equality; key min length 24 |
| Knowledge refresh | Requires cron auth and/or admin key; rate limited |
| Eval runner | Requires `EVAL_SECRET` in production |
| CORS | Allow-list of app origins |
| Rate limits | Per-IP fixed windows on chat, track, stats, refresh, status, eval |
| Body size limits | Chat / track reject oversized payloads |
| Security headers | HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy |
| Redis | URL and token from env only; no hardcoded fallbacks |

## Hard Safety Rules (AI)
- Refuse any request for passwords, OTP, PIN, or full identity numbers.
- Never claim official endorsement.
- Prefer short, actionable replies that end with a clear next step on the official portal.
- When evidence is thin, state uncertainty explicitly.

## Environment variables (required for strong security)
- `ANALYTICS_ADMIN_KEY` (long random string, rotate if exposed)
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`
- `CRON_SECRET` (Vercel cron Authorization)
- `EVAL_SECRET` (blocks open eval in production)
- `XAI_API_KEY` or `OPENAI_API_KEY` or `LLM_API_KEY`+`LLM_BASE_URL`
- Optional: `ALLOWED_ORIGINS` comma-separated extra CORS origins

## Reporting
Security issues should be reported privately to the repository maintainers. Do not open public issues containing exploit details.

## Operational note
If any secret was ever committed or shared in chat, rotate it in the provider dashboard and in Vercel project settings immediately.
