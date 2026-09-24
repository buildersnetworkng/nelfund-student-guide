const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const LOGIN = 'https://portal.nelf.gov.ng/auth/login'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hourly 162: change-of-school, name mismatch, window, interest, scam paraphrases. No invented amounts. */
export function playbookHourly162(intent: string, userText: string): string | null {
  const t = userText || ''

  if (/change\s*(of\s*)?(school|institution|course)|I\s*(don|have)\s*transfer|new\s*school\s*after\s*apply/i.test(t)) {
    return (
      '**Change of school / course**\n\n' +
      'The portal follows the institution record your school uploaded. After a transfer, the new public school must appear on the official list and upload your new record.\n' +
      `Confirm on ${PORTAL}. Campus desk first, then ${ESUPPORT} if the old school still shows.`
    )
  }

  if (/name\s*(no|not|never)\s*(match|the\s*same)|name\s*mismatch|different\s*name\s*(for|on)\s*(bvn|nin|jamb|bank)/i.test(t)) {
    return (
      '**Name mismatch (JAMB / NIN / BVN / bank)**\n\n' +
      'Names must match across JAMB, NIN, BVN and the bank account in **your** name. Fix the source registry first, then retry the portal.\n' +
      `Login: ${LOGIN}. Still blocked: ${ESUPPORT} with a screenshot. Do not open a second account.`
    )
  }

  if (/still\s*(open|dey\s*open)|dem\s*don\s*close|application\s*(open|close|window)|can\s*i\s*still\s*apply|deadline\s*(for\s*)?(nelfund|loan)/i.test(t)) {
    return (
      '**Application open / closed**\n\n' +
      'Windows change. Confirm live status only on the official portal — I will not invent a closing date.\n' +
      `${PORTAL} · ${SITE} · login ${LOGIN}`
    )
  }

  if (/interest[- ]?free|zero\s*interest|does\s*(am|it|nelfund)\s*(get|carry|has|have)\s*interest|wetin\s*be\s*interest/i.test(t)) {
    return (
      '**Interest**\n\n' +
      'Official description: NELFUND student loans are **interest-free**. That is not the same as a scholarship or a grant — you still repay under official rules.\n' +
      `Confirm on ${SITE}. I will not invent extra rates.`
    )
  }

  if (/na\s*(scholarship|grant|free\s*money)|loan\s*(or|vs)\s*scholarship|dem\s*go\s*collect\s*am\s*back/i.test(t)) {
    return (
      '**Loan, not scholarship**\n\n' +
      'NELFUND is an **interest-free loan**, not a grant or free money. Official FAQ: repayment is due **2 years after NYSC**.\n' +
      `Confirm on ${SITE}.`
    )
  }

  if (/whatsapp\s*(man|agent|number)|pay\s*(agent|someone)\s*(make|to)\s*apply|otp\s*(for|to)\s*(agent|am)|send\s*(nin|bvn)\s*(give|to)\s*(agent|am)/i.test(t)) {
    return (
      '**Stay safe — scam**\n\n' +
      'Never pay an agent. Never share OTP, password, NIN or BVN on WhatsApp.\n' +
      `Official only: ${SITE} · ${PORTAL} · ${LOGIN} · tickets ${ESUPPORT}`
    )
  }

  if (/invalid\s*jamb|jamb\s*(no|number)\s*(no|not)\s*(dey|work|valid)|utme\s*(no|not)\s*valid/i.test(t)) {
    return (
      '**JAMB number issue**\n\n' +
      'Use the JAMB number that matches your admission. If NIN is not linked to JAMB, the portal may ask for NIN.\n' +
      `Retry ${PORTAL}. Still “invalid JAMB”: campus desk + ${ESUPPORT}. I cannot change JAMB CAPS from this chat.`
    )
  }

  if (/how\s*(i|to|do\s*i)?\s*(logn|logiin|log\s*in|login|sign\s*in)|logn\s+into/i.test(t)) {
    return (
      '**How to log in / sign in**\n\n' +
      `1. Open ${LOGIN}\n` +
      '2. Enter your NELFUND account email and password.\n' +
      '3. Read the exact error if login fails.\n' +
      `4. New account / signup: ${PORTAL}\n` +
      `5. Portal hangs: refresh once, try another network, then ${ESUPPORT}.`
    )
  }

  if (intent === 'official-sources') {
    return `**Official sources only**\n\n- Site: ${SITE}\n- Portal: ${PORTAL}\n- Login: ${LOGIN}\n- Tickets: ${ESUPPORT}`
  }

  return null
}
