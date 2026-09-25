const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const LOGIN = 'https://portal.nelf.gov.ng/auth/login'
const ESUPPORT = 'https://nelfund.esupport.ng/create'
const FAQ = 'https://nelf.gov.ng/faq'

/** Hourly 177: ND/HND/NCE eligibility, documents Pidgin, GSI/repay, loan vs grant. */
export function playbookHourly177(intent: string, userText: string): string | null {
  const t = userText || ''

  if (
    /\b(nd|hnd|nce|n\.?d\.?|h\.?n\.?d\.?)\b|college\s*of\s*education|poly(technic)?|vocational|skills?\s*centre|monotechnic/i.test(
      t,
    ) &&
    /eligib|fit\s*(i|i\s*)?apply|can\s*i\s*apply|who\s*can|dey\s*cover|cover\s*(us|me|poly)/i.test(t)
  ) {
    return (
      '**Eligibility — polytechnic / COE / ND / HND / NCE**\n\n' +
      'Official coverage is for eligible students in **public** tertiary institutions (universities, polytechnics, colleges of education and similar public institutions on the portal list).\n\n' +
      '• You still need admission + school record uploaded.\n' +
      '• Private institutions are not treated as the default public-school path — confirm only on the portal.\n' +
      '• Mode of study (full-time vs others) must match what the portal accepts for your record.\n\n' +
      `Confirm your school name on ${PORTAL}. I will not invent extra categories.\n` +
      `Login: ${LOGIN}`
    )
  }

  if (
    /wetin\s*(i|una)\s*(go|suppose|need)\s*(upload|carry|bring)|which\s*(file|document|paper)\s*(to\s*)?upload|documents?\s*(i\s*)?(need|required)|wetin\s*i\s*go\s*carry/i.test(
      t,
    ) ||
    intent === 'documents-needed'
  ) {
    return (
      '**Documents the portal typically asks for**\n\n' +
      '• JAMB registration number and **admission letter** (often compulsory)\n' +
      '• NIN and BVN\n' +
      '• Bank account in **your** name\n' +
      '• Matriculation number when the school has issued it\n' +
      '• School ID / institution invoice if the form shows those fields (often optional)\n\n' +
      `Upload only on ${PORTAL}. Never send files to a WhatsApp agent.\n` +
      `Login: ${LOGIN} · Support: ${ESUPPORT}`
    )
  }

  if (
    /\bgsi\b|global\s*standing|how\s*(dem|they)\s*(go|will)\s*(collect|take)\s*(the\s*)?money|salary\s*(deduct|cut)|pay\s*back\s*how|repay\s*(how|when)|after\s*nysc.{0,16}(pay|repay)/i.test(
      t,
    ) ||
    intent === 'gsi' ||
    intent === 'repayment'
  ) {
    return (
      '**Repayment / GSI**\n\n' +
      'This is a **loan**, not a grant. Official FAQ: repayment is due **2 years after NYSC**.\n' +
      'GSI (Global Standing Instruction) is the official repayment arrangement described on the portal terms.\n\n' +
      `Confirm live wording on ${FAQ} and ${SITE}. I will not invent percentages, start dates, or jail terms.\n` +
      `Portal: ${PORTAL}`
    )
  }

  if (
    /na\s*(scholarship|grant|free\s*money)|loan\s*(or|vs)\s*(scholarship|grant)|is\s*(e|it)\s*(scholarship|grant)|free\s*money|no\s*need\s*to\s*pay\s*back/i.test(
      t,
    ) ||
    intent === 'loan-or-scholarship'
  ) {
    return (
      '**Loan, not scholarship**\n\n' +
      'NELFUND is an **interest-free student loan**. It is not a scholarship, grant, or free money.\n' +
      'Institutional charges go to the school; optional upkeep goes to you if selected.\n' +
      `You repay later under official rules — see ${FAQ}. Apply only on ${PORTAL}.`
    )
  }

  if (
    /forgot\s*(my\s*)?(password|pass)|reset\s*(my\s*)?password|password\s*(no|not|never)\s*(dey|work|gree)|i\s*forget\s*(my\s*)?password/i.test(
      t,
    ) ||
    intent === 'password-reset'
  ) {
    return (
      '**Forgot password**\n\n' +
      `1. Open ${LOGIN} → Forgot / Reset password.\n` +
      '2. Use the **same email** you registered with.\n' +
      '3. Check inbox and spam for the reset mail.\n' +
      '4. Set a new password and sign in.\n' +
      '5. Do not create a second account unless official support says so.\n' +
      `No mail: ${ESUPPORT} with a screenshot.`
    )
  }

  if (intent === 'eligibility') {
    return (
      '**Eligibility (short)**\n\n' +
      '• Nigerian citizen\n' +
      '• Full-time student in a **public** tertiary institution on the portal list\n' +
      '• Valid admission; school must upload your record\n' +
      '• JAMB, NIN, BVN, bank in your name ready\n\n' +
      `Confirm live on ${PORTAL}. I will not invent extra categories.`
    )
  }

  return null
}
