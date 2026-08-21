# Security Policy

## Scope
This document describes the security posture of the NELFUND Student Support Platform — an independent civic-technology application.

## Principles
1. **Minimise sensitive data** — The system never requests or stores passwords, OTPs, full NIN, full BVN, or bank account credentials.
2. **Official sources only** — Outbound fetches are restricted to an allow-list of official NELFUND domains.
3. **No policy invention** — The AI agent is instructed and architected to refuse inventing eligibility outcomes, deadlines, amounts, or official contacts.
4. **Transparent trust labels** — Every knowledge item carries a verification status and source attribution.
5. **Privacy-first analytics** — Optional analytics use server-side storage and avoid PII by design.

## Hard Safety Rules (AI)
- Refuse any request for passwords, OTP, PIN, or full identity numbers.
- Never claim official endorsement.
- Prefer short, actionable replies that end with a clear next step on the official portal.
- When evidence is thin, state uncertainty explicitly.

## Reporting
Security issues should be reported privately to the repository maintainers. Do not open public issues containing exploit details.

## Future Hardening (for institutional adoption)
- Application-level rate limiting and WAF
- Structured audit logging of AI tool calls
- Role-based access for admin surfaces
- Formal penetration testing and code review under government oversight
