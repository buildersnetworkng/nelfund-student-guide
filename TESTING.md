# Testing & Quality Assurance

This platform is engineered for rigorous evaluation, including by Federal Government technical teams.

## Automated Suites

| Command | Purpose |
|---------|---------|
| `npm run build` | Production TypeScript + Vite build must succeed with zero errors |
| `npm run lint` | ESLint (progressive; use lint:strict for zero warnings) |
| `npm run test:ai` | Full AI regression (intent, capability, multi-turn, safety, institution detection) |
| `npm run test:ai:offline` | Offline evaluation without calling live LLM providers |

## AI Evaluation Coverage Targets

The regression suite is designed to simulate high-volume real-world usage and adversarial conditions:

1. **Intent classification** — English, Nigerian Pidgin, short/ambiguous, multi-turn context
2. **Capability routing** — email-draft, contact-lookup, troubleshooting, verified-knowledge, current-information
3. **Safety** — requests for OTP/password/NIN/BVN, scam-agent language, policy invention attempts
4. **Institution detection** — common aliases and full names
5. **Failure recovery** — empty replies, tool failures, low-evidence cases
6. **Non-regression** — previously fixed student language patterns must remain green

## Manual / Government Evaluation Checklist

- [ ] Home page disclaimers are prominent
- [ ] AI responses never invent eligibility or deadlines
- [ ] Official portal links are always preferred
- [ ] Screenshot OCR path does not leak sensitive data
- [ ] Admin analytics require authentication key
- [ ] Build and lint pass in clean CI environment
- [ ] Knowledge items display trust labels correctly
- [ ] Mobile navigation and accessibility basics function

## Continuous Improvement
Failed cases are added to the regression suite. The goal is measurable, repeatable quality suitable for institutional adoption decisions.
