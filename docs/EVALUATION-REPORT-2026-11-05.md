# Offline evaluation report — 5 November 2026

Branch: `harden/nelfund-product-2026`  
Baseline: production-good commit `9ad0a1e6e602fad1847f4d5fba460d7cab7a685c`

## Commands executed

```bash
npm install --no-audit --no-fund
npm run test:ai:offline
```

## Results (actual)

| Metric | Value |
|--------|--------|
| Result | **ALL_PASS** |
| PASS lines | **92** (post review-fix) |
| FAIL lines | **0** |
| Architecture tests | **20/20** |

### Coverage exercised

- Login / portal links, Pidgin variants  
- Missing information, school upload, JAMB CAPS  
- Scam / OTP / unofficial payment safety  
- Eligibility (100–300 level, polytechnic)  
- Application open/status honesty  
- Pay School, reapplication, upkeep timing  
- OCR mixed-signal (JAMB vs loan UI)  
- Situation-aware: fee arithmetic, verified emails, amount follow-ups  
- Naira extraction isolation (years/IDs/phones)  
- Pay School email-only safety  

### Knowledge status (local code)

- `api/knowledge/status.ts` returns `status: confirm_on_portal`, `verified: false`  
- Static pack dates are metadata only  

### Limitations

- No production deploy; no merge to `main`  
- Physical Android device not used  
- Official homepage/FAQ HTML did not contain a clear machine-verifiable national window declaration  
