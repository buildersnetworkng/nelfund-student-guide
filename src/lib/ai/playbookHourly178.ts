const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const LOGIN = 'https://portal.nelf.gov.ng/auth/login'
const ESUPPORT = 'https://nelfund.esupport.ng/create'
const FAQ = 'https://nelf.gov.ng/faq'

/** Hourly 178: JAMB fail, pending wait, school list, OTP/scam, contact, window, interest. */
export function playbookHourly178(intent: string, userText: string): string | null {
  const t = userText || ''

  if (
    /jamb.{0,24}(fail|invalid|reject|error|no\s*gree)|invalid\s*(jamb|utme)\s*(number|reg)|utme.{0,16}(fail|invalid)|my\s*jamb\s*(no|not|never)\s*(dey|work|gree)/i.test(
      t,
    ) ||
    intent === 'jamb-verification'
  ) {
    return (
      '**JAMB / UTME number on the portal**\n\n' +
      '1. Type the **same JAMB registration number** on your admission letter (no extra spaces).\n' +
      '2. Confirm the school has uploaded your record.\n' +
      '3. Retry on Profile \u2192 educational information.\n' +
      '4. If it still says invalid: campus NELFUND / ICT desk, then a support ticket with a screenshot.\n\n' +
      `Login: ${LOGIN}\nSupport: ${ESUPPORT}`
    )
  }

  if (
    /school\s*(no|not|never)\s*(dey|show|list|appear)|not\s*(on\s*)?(the\s*)?list|cannot\s*find\s*(my\s*)?school|no\s*result\s*found|institution\s*(missing|not\s*listed)/i.test(
      t,
    ) ||
    intent === 'school-not-found'
  ) {
    return (
      '**School not on the list / No Result found**\n\n' +
      '1. Search a shorter official name (e.g. Olabisi Onabanjo, not the full legal title).\n' +
      '2. Confirm the school is a **public** institution on this cycle list.\n' +
      '3. Ask campus NELFUND / ICT whether your record was uploaded.\n' +
      '4. Do **not** open a second account.\n\n' +
      `Portal: ${PORTAL}\nTicket: ${ESUPPORT}`
    )
  }

  if (
    /pending|how\s*far\s*(my\s*)?(loan|money|application)|money\s*never\s*(enter|show|drop)|wetin\s*dey\s*hold|disburse|when\s*(go|will)\s*(money|upkeep)\s*(enter|drop)/i.test(
      t,
    ) ||
    intent === 'pending-application'
  ) {
    return (
      '**Pending application**\n\n' +
      'Pending under **Institutional** or **Upkeep** means processing \u2014 it is not a decline.\n' +
      '1. Log in \u2192 \u2630 \u2192 **Loans** and Home.\n' +
      '2. Confirm BVN and bank still match your name.\n' +
      '3. If Home says the institution has not opened a session, see campus NELFUND desk.\n' +
      '4. Official disbursement timing is only confirmed on the portal after approval.\n\n' +
      `Login: ${LOGIN} \u00b7 Ticket: ${ESUPPORT}`
    )
  }

  if (
    /otp|one[- ]time|whatsapp\s*(man|agent|guy)|pay\s*(am\s*)?\d|never\s*share|scam|agent\s*(ask|wan|want)/i.test(t) ||
    intent === 'scam-safety'
  ) {
    return (
      '**Safety \u2014 OTP and agents**\n\n' +
      '\u2022 **Never share OTP, password, or NIN/BVN** with anyone on WhatsApp, SMS, or \u201cagent\u201d chat.\n' +
      '\u2022 **Never pay** a processing fee. Apply is only on the official portal.\n' +
      `\u2022 Official apply/login: ${PORTAL} and ${LOGIN}\n` +
      `\u2022 Official site: ${SITE}\n` +
      `\u2022 Support ticket (no payment): ${ESUPPORT}`
    )
  }

  if (
    /how\s*(i\s*go|do\s*i|to)\s*(yarn|reach|contact|call)|official\s*(email|phone|number|support)|esupport|help\s*desk|raise\s*a?\s*ticket/i.test(
      t,
    ) ||
    intent === 'contact-support' ||
    intent === 'contact-lookup'
  ) {
    return (
      '**Official contact**\n\n' +
      `Use the support form (attach a portal screenshot): ${ESUPPORT}\n` +
      `Also confirm notices on ${SITE} and ${FAQ}.\n` +
      'Campus NELFUND / ICT desk handles school-upload and session-open issues.\n' +
      'This guide cannot see or change your application.'
    )
  }

  if (
    /still\s*(dey\s*)?open|dem\s*don\s*close|application\s*(open|close|window)|can\s*i\s*still\s*apply|nelfund\s*(still\s*)?(open|closed)|deadline/i.test(
      t,
    ) ||
    intent === 'deadline'
  ) {
    return (
      '**Application window**\n\n' +
      'Check live status only on the official portal \u2014 windows change by cycle.\n' +
      'Guidance shown on this site for 2026/2027: **23 Sep 2026 \u2013 31 Dec 2026** (confirm on the portal).\n' +
      'Re-enter BVN and bank when the form asks.\n' +
      `Portal: ${PORTAL} \u00b7 Login: ${LOGIN}`
    )
  }

  if (
    /interest[- ]?free|zero\s*interest|does\s*(e|am|it)\s*get\s*interest|interest\s*dey|wetin\s*be\s*interest/i.test(t)
  ) {
    return (
      '**Interest**\n\n' +
      'Official description: NELFUND is an **interest-free student loan** (not a commercial bank loan).\n' +
      'It is still a **loan** you repay later \u2014 not a scholarship.\n' +
      `Confirm live wording on ${FAQ} and ${SITE}. I will not invent extra rates.`
    )
  }

  if (
    /loan\s*(or|vs|versus)\s*(scholarship|grant)|na\s*(scholarship|grant|free\s*money)|is\s*(e|it)\s*(scholarship|grant)/i.test(
      t,
    ) ||
    intent === 'loan-or-scholarship'
  ) {
    return (
      '**Loan, not scholarship**\n\n' +
      'NELFUND is an interest-free **loan**. Institutional charges go to the school; upkeep (if selected) goes to your account.\n' +
      `Repayment rules: ${FAQ}. Apply only on ${PORTAL}.`
    )
  }

  if (
    /name\s*(no|not|never)\s*(match|the\s*same)|name\s*mismatch|bvn.{0,20}(name|match)|wrong\s*bank|change\s*(my\s*)?(account|bank)/i.test(
      t,
    ) ||
    intent === 'bank-information'
  ) {
    return (
      '**Bank / BVN / name mismatch**\n\n' +
      'Upkeep can stall if the account name does not match BVN and portal profile.\n' +
      '1. Log in \u2192 Profile / bank details.\n' +
      '2. Use an account in **your** name.\n' +
      '3. Re-enter BVN and bank for this cycle if the form asks.\n' +
      `4. Still stuck: ${ESUPPORT} with a screenshot.\n` +
      `Login: ${LOGIN}`
    )
  }

  return null
}
