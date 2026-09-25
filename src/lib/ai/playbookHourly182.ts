const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const LOGIN = 'https://portal.nelf.gov.ng/auth/login'
const ESUPPORT = 'https://nelfund.esupport.ng/create'
const FAQ = 'https://nelf.gov.ng/faq'

/** Hourly 182: password/email, repay/GSI, fees vs upkeep paid, bank change, apply loan+upkeep. */
export function playbookHourly182(intent: string, userText: string): string | null {
  const t = userText || ''

  if (
    /how\s*to\s*apply\s*then\s*i\s*meant|meant\s*(for\s*)?(the\s*)?(loan|upkeep)|apply.{0,40}(loan|upkeep).{0,24}(and|&).{0,24}(loan|upkeep)|loan\s+and\s+upkeep|upkeep\s+and\s+(the\s+)?loan/i.test(
      t,
    )
  ) {
    return (
      '**Apply for the loan and upkeep**\n\n' +
      `1. Log in only at ${LOGIN}.\n` +
      '2. Finish Profile (NIN, JAMB number, BVN, bank in your name).\n' +
      '3. When the official window is open, request the student loan.\n' +
      '4. Choose **institutional charges** (school fees paid **to the school**) and **upkeep** (optional living support paid **to your account**) if you want both.\n' +
      '5. If the fee figure is wrong, **Raise a dispute** before Submit.\n' +
      '6. After submit: \u2630 \u2192 **Loans**. Pending is processing, not declined.\n\n' +
      `I will not invent amounts. Portal: ${PORTAL}\nFAQ: ${FAQ}`
    )
  }

  if (
    /forgot\s*(my\s*)?(login\s*)?email|i\s*(no|not|never)\s*(remember|sabi|know)\s*(the\s*)?(email|mail)|which\s*email\s*(i\s*)?(use|used)|i\s*lose\s*(the\s*)?email/i.test(
      t,
    )
  ) {
    return (
      '**Forgot the email used to register**\n\n' +
      'The portal account is tied to one email.\n' +
      '1. Try the inbox you used for JAMB / school mail first.\n' +
      `2. On ${LOGIN}, use **Forgot password** with that same address — if an account exists, reset mail can arrive there.\n` +
      '3. Do not open a second email to force a new application.\n' +
      `4. Still locked out: ${ESUPPORT} with NIN / JAMB number and a screenshot.\n` +
      `Portal: ${PORTAL}`
    )
  }

  if (
    /reset\s*(my\s*)?password|forgot\s*(my\s*)?password|change\s*(my\s*)?password|password\s*(no|not)\s*(dey|work|correct)|i\s*no\s*sabi\s*(my\s*)?password/i.test(
      t,
    ) ||
    (intent === 'portal-login' && /password/i.test(t))
  ) {
    return (
      '**Reset password**\n\n' +
      `1. Open ${LOGIN} only.\n` +
      '2. Use **Forgot / Reset password** with the same email you registered.\n' +
      '3. Check inbox and spam for the official reset mail.\n' +
      '4. After reset, log in on that same page — not a WhatsApp link.\n' +
      `5. Still failing: ${ESUPPORT} + screenshot. Do not create a second account.\n` +
      `Portal: ${PORTAL}`
    )
  }

  if (/what\s*(is|be)\s*(the\s*)?gsi|gsi\s*mandate|wetin\s*(be|mean)\s*gsi|they\s*go\s*debit\s*(me|my\s*account)\s*now/i.test(t)) {
    return (
      '**GSI mandate**\n\n' +
      'GSI is a repayment instruction you accept on the official portal so repayment can later be collected from the linked account when repayment is due.\n' +
      'It is **not** a fee you pay an agent today. Read the live **Terms & GSI Mandate** text on the portal before you tick Accept.\n' +
      'This chat does not invent debit dates or amounts.\n\n' +
      `Portal: ${PORTAL}\nFAQ: ${FAQ}`
    )
  }

  if (
    /after\s*nysc|when\s*(do|go|will)\s*i\s*(start\s*)?repay|repay(ment)?\s*(start|begin|begin)|how\s*(i\s*)?(go|to)\s*pay\s*(back|am)|when\s*(dem|they)\s*(go|will)\s*collect/i.test(
      t,
    ) ||
    intent === 'repayment'
  ) {
    return (
      '**Repayment**\n\n' +
      'NELFUND is an **interest-free loan**, not a scholarship.\n' +
      'Official materials commonly describe repayment after the grace period (often after NYSC for eligible graduates). Confirm the live rule on the FAQ and the Terms you accepted.\n' +
      'This chat will not invent a monthly schedule or a percentage.\n\n' +
      `FAQ: ${FAQ}\nPortal: ${PORTAL}`
    )
  }

  if (
    /school\s*fees?\s*(don|has|have)\s*(enter|pay|paid)|upkeep\s*(never|no|not)\s*(enter|show|drop)|institutional\s*(don|has)\s*(pay|paid)|fees?\s*don\s*enter\s*but\s*upkeep|money\s*enter\s*school\s*but/i.test(
      t,
    )
  ) {
    return (
      '**Institutional vs upkeep after apply**\n\n' +
      'They are two lines, not one lump.\n' +
      '\u2022 **Institutional charges** go to the school.\n' +
      '\u2022 **Upkeep** (if you selected it) is meant for your own account when that line is processed.\n' +
      'One can show paid / approved while the other is still **Pending**.\n' +
      '1. Log in \u2192 \u2630 \u2192 **Loans** and open both tabs.\n' +
      '2. Confirm the bank on Profile matches your BVN name.\n' +
      `3. Long wait on one line only: campus desk, then ${ESUPPORT} + screenshot.\n` +
      `Login: ${LOGIN}`
    )
  }

  if (/change\s*(my\s*)?(bank|account)|wrong\s*account\s*number|update\s*(my\s*)?bvn|bank\s*(no|not)\s*correct/i.test(t)) {
    return (
      '**Bank / BVN on the portal**\n\n' +
      'The account used for upkeep must match the **BVN name** on Profile.\n' +
      `1. Log in at ${LOGIN} and open Profile.\n` +
      '2. Correct only what the portal still allows (often before disbursement).\n' +
      '3. If the field is locked, do not open a second account — use campus NELFUND desk, then official support.\n' +
      `4. Ticket: ${ESUPPORT} with a screenshot.\n` +
      `Never send BVN or OTP to a WhatsApp agent. Site: ${SITE}`
    )
  }

  if (
    /email\s*(already|has\s*already|is\s*already)\s*(in\s*use|used|taken)|this\s*mail\s*(don|already)\s*(dey|exist|used)/i.test(
      t,
    )
  ) {
    return (
      '**Email already used**\n\n' +
      `That address already has a portal account. Log in at ${LOGIN}. Use **Forgot password** if needed. Do not register a second email.\n` +
      `Still blocked: ${ESUPPORT} + screenshot.`
    )
  }

  return null
}
