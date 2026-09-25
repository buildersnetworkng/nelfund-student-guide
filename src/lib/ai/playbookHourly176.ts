const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const LOGIN = 'https://portal.nelf.gov.ng/auth/login'
const ESUPPORT = 'https://nelfund.esupport.ng/create'
const FAQ = 'https://nelf.gov.ng/faq'

/** Hourly 176: JAMB invalid Pidgin, school not listed, pending wait, contact, OTP, interest. */
export function playbookHourly176(intent: string, userText: string): string | null {
  const t = userText || ''

  if (
    /jamb.{0,20}(invalid|no\s*dey|never\s*work|fail|wrong)|invalid\s*(jamb|utme)\s*(reg|number)|my\s*jamb\s*(no|not|never)\s*(dey|correct|work)/i.test(
      t,
    )
  ) {
    return (
      '**JAMB number not accepted**\n\n' +
      'Type the **same JAMB registration number** as on your admission letter. No extra spaces.\n\n' +
      '1. Profile → educational / JAMB field → save.\n' +
      '2. If it still says invalid, your school record may not match — campus NELFUND / ICT desk.\n' +
      `3. Still blocked: screenshot + ${ESUPPORT}.\n` +
      `Login: ${LOGIN}`
    )
  }

  if (
    /school\s*(no|not|never)\s*(dey|show|list|appear)|not\s*(on\s*)?(the\s*)?list|cannot\s*find\s*(my\s*)?school|no\s*result\s*found|select\s*institution.{0,20}(empty|no\s*result)/i.test(
      t,
    )
  ) {
    return (
      '**School not on the list / No Result found**\n\n' +
      'The portal only lists institutions that are on this cycle’s list and whose name matches what you type.\n\n' +
      '1. Try a shorter official name (e.g. Olabisi Onabanjo, not the full legal string).\n' +
      '2. Confirm it is a **public** institution participating this cycle.\n' +
      '3. Campus NELFUND / ICT desk if the school should be there.\n' +
      '4. Do not open a second account.\n' +
      `Support with screenshot: ${ESUPPORT}\nLogin: ${LOGIN}`
    )
  }

  if (
    /how\s*(i\s*go|do\s*i|to)\s*(yarn|reach|contact|call)|official\s*(email|phone|number|support)|esupport|help\s*desk|open\s*(a\s*)?ticket/i.test(
      t,
    )
  ) {
    return (
      '**Official support**\n\n' +
      `Send a support message (with a screenshot of the exact portal page) at ${ESUPPORT}.\n\n` +
      `• Portal / login: ${PORTAL} · ${LOGIN}\n` +
      `• Site / FAQ: ${SITE} · ${FAQ}\n` +
      'Campus NELFUND / ICT desk first if the block is school data (session not opened, school not listed, matric).\n' +
      'Do not send OTP or NIN to anyone on WhatsApp.'
    )
  }

  if (
    /(share|send|give).{0,16}(otp|pin|password)|otp.{0,16}(whatsapp|agent)|never\s*share\s*(otp|pin)|one[- ]time\s*(password|pin)/i.test(
      t,
    )
  ) {
    return (
      '**OTP / password — keep it private**\n\n' +
      'NELFUND staff will not ask you on WhatsApp for OTP, password, NIN, or BVN.\n\n' +
      `Apply and log in only on ${PORTAL}. Reset password only on that site.\n` +
      `If someone already asked: stop, change the password on ${LOGIN}, then ${ESUPPORT}.`
    )
  }

  if (
    /interest[- ]?free|zero\s*interest|does\s*(am|it|e)\s*get\s*interest|interest\s*dey|wetin\s*be\s*(the\s*)?interest/i.test(
      t,
    )
  ) {
    return (
      '**Interest**\n\n' +
      'Official FAQ: the NELFUND student loan is **interest-free**. It is still a **loan** (not a scholarship).\n\n' +
      `Repayment timing is described on ${FAQ} (commonly **2 years after NYSC** — confirm live wording).\n` +
      `I will not invent a rate. Site: ${SITE}`
    )
  }

  if (
    /pending.{0,24}(long|since|months|weeks)|how\s*far\s*(my\s*)?(loan|money|application)|money\s*never\s*(enter|show|drop)|wetin\s*dey\s*hold\s*(my\s*)?(loan|money)/i.test(
      t,
    )
  ) {
    return (
      '**Still pending**\n\n' +
      'Pending means submitted and **still processing**, not declined.\n\n' +
      `1. ${LOGIN} → **☰ → Loans** — read the exact line.\n' +
      '2. Institutional charges go to the **school** after approval; upkeep (if selected) to **your** account.\n' +
      '3. Official FAQ often mentions about **30 days after approval** for disbursement — that is not a personal promise.\n' +
      `4. Long wait with no change: campus desk, then ${ESUPPORT} + screenshot.\n` +
      `Portal: ${PORTAL}`
    )
  }

  if (
    /matric(ulation)?\s*(number|no\\.?)?.{0,24}(yet|no|not|never)|no\s*(get|have)\s*matric|i\s*do\s*not\s*have\s*matric/i.test(
      t,
    )
  ) {
    return (
      '**No matric number yet**\n\n' +
      'You can still open a portal account with JAMB / admission details.\n' +
      'When the school issues matric, ask campus NELFUND / ICT / Registry to **upload** the record, then add it on Profile.\n' +
      'Do not invent a matric number.\n' +
      `Login: ${LOGIN}\nSupport: ${ESUPPORT}`
    )
  }

  if (intent === 'contact-support' || intent === 'contact-lookup') {
    return (
      `**Official support**\n\nCreate a message with a screenshot at ${ESUPPORT}. Portal: ${PORTAL}. FAQ: ${FAQ}.`
    )
  }

  return null
}
