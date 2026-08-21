# NELFUND Student Support Platform

**Independent, evidence-based digital guidance system for the Nigerian Education Loan Fund (NELFUND)**

> Official positioning: This platform is an independent civic-technology tool designed to reduce student support burden, improve application completion rates, and channel verified information to Nigerian tertiary students. It is **not** produced, operated, or endorsed by NELFUND, the Federal Ministry of Education, or any tertiary institution. All critical decisions must be confirmed on the official portals: [nelf.gov.ng](https://nelf.gov.ng) and [portal.nelf.gov.ng](https://portal.nelf.gov.ng).

---

## Purpose & Government Value Proposition

NELFUND has disbursed hundreds of billions of naira and supported over a million students. High volumes of repetitive support queries (missing school records, JAMB/NIN mismatches, pending status, upkeep questions, scam attempts) create friction for students and operational load for institutions and the Fund.

This platform delivers:

| Capability | Benefit |
|------------|---------|
| Verified knowledge base with explicit trust labels | Reduces misinformation and reliance on social media |
| Institution-aware architecture | Scales from pilot institutions to nationwide coverage |
| Conversational AI support agent | Handles natural language (including Nigerian Pidgin), screenshot OCR, multi-turn troubleshooting |
| Safety & scam prevention | Hard rules against phishing, agent payments, sensitive data requests |
| Analytics & evaluation harness | Measurable quality, continuous regression testing |
| Audit-friendly design | Clear source attribution, last-verified dates, no invented policy |

**Suitable for:** Federal Ministry of Education / NELFUND evaluation as a complementary student-support channel, knowledge-management layer, or white-label reference implementation.

---

## Core Features

- Nationwide NELFUND policy knowledge (eligibility, components, repayment, GSI, application flow)
- Institution-specific tips and contacts (extensible)
- Trust labels on every fact: `verified` · `may_change` · `guidance` · `unverified`
- Step-by-step application guidance, readiness checklist, fees & upkeep explainers
- Troubleshooting library for common portal failures
- Video library (educational, clearly labelled)
- Official sources directory
- AI support agent (`/ask`) with:
  - Intent classification (English + Pidgin patterns)
  - Tool use (official page fetch, status guidance)
  - Screenshot OCR (Tesseract.js)
  - Email-draft and contact-lookup capabilities
  - Strict non-hallucination boundaries
- Privacy-conscious analytics and admin dashboard
- Daily knowledge-refresh cron

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vite · React 18 · TypeScript · Tailwind CSS · React Router |
| AI Runtime | Vercel Serverless · OpenAI-compatible / xAI / OpenAI providers |
| Knowledge | Structured JSON with verification metadata |
| OCR | Tesseract.js |
| Hosting | Vercel (SPA rewrites + serverless functions + cron) |
| Analytics | Optional Upstash Redis (server-side only) |

---

## Security, Privacy & Compliance Posture

- No collection of passwords, OTPs, full NIN/BVN, or bank credentials
- System prompt and client logic enforce hard refusal of sensitive data
- Official-only outbound fetches (allow-listed hosts)
- Clear, persistent disclaimers on every page and AI response path
- Analytics designed to be privacy-safe (no PII by default)
- Source attribution and `last_verified` timestamps on knowledge items
- Suitable baseline for further government security review (rate limiting, WAF, audit logging can be layered)

See `SECURITY.md` and `GOVERNANCE.md` for details.

---

## Quality Assurance & Testing

The platform is designed for rigorous independent testing (including by Federal Government evaluators).

```bash
npm install
npm run build          # Production build (must succeed with zero errors)
npm run lint           # ESLint
npm run test:ai        # Intent, capability, multi-turn, safety regression suite
npm run test:ai:offline # Offline evaluation without live LLM
```

- Expanded regression suite covering English, Pidgin, adversarial, multi-turn, and safety cases
- Architecture tests for agent contracts and failure recovery
- Continuous evaluation scripts ready for CI

Detailed methodology and coverage targets are documented in `TESTING.md`.

---

## Local Development

```bash
cp .env.example .env   # Configure optional LLM keys and analytics
npm install
npm run dev
```

Required for full AI functionality (any one provider):

- `XAI_API_KEY` (preferred for Grok models)
- or `OPENAI_API_KEY`
- or `LLM_API_KEY` + `LLM_BASE_URL` (OpenAI-compatible)

---

## Production Deployment

Deployed on Vercel. SPA routing and API routes are configured in `vercel.json`. Knowledge refresh runs daily via cron.

```bash
npm run build
# Push to main → automatic production deployment (Git-linked project)
```

---

## Project Structure (high level)

```
src/
  components/     # UI primitives, trust badges, institution selectors
  context/        # Institution context
  data/           # Verified knowledge JSON (single source of truth)
  lib/ai/         # Intent, conversation, playbooks, agent orchestration
  pages/          # Route-level views including /ask AI workspace
api/              # Vercel serverless (chat, knowledge, analytics, eval)
scripts/          # Evaluation harnesses
```

---

## Roadmap for Institutional Adoption

1. Expand institution coverage and contact verification
2. Deeper integration with official status signals (when APIs become available)
3. Enhanced audit logging and role-based admin
4. Multi-language support (English + Pidgin + major Nigerian languages)
5. Formal security assessment and penetration testing
6. Knowledge governance workflow (human review gates)

---

## Licence & Contact

Independent open project. Not an official NELFUND product.

For evaluation discussions regarding adoption or co-development under Federal Government oversight, contact the repository maintainers via GitHub.

**Always verify critical information on the official NELFUND portals.**
