const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const LOGIN = 'https://portal.nelf.gov.ng/auth/login'
const ESUPPORT = 'https://nelfund.esupport.ng/create'
const FAQ = 'https://nelf.gov.ng/faq'

/** Hourly 179: documents, school not listed, loan vs scholarship, BVN/bank, NYSC, open window, Pidgin. */
export function playbookHourly179(intent: string, userText: string): string | null {
  const t = userText || ''

  if (
    /loan\s*(or|vs|versus|and)\s*(scholarship|grant|gift)|scholarship\s*(or|vs|versus)\s*loan|na\s*(loan|scholarship)|is\s*(e|it|nelfund)\s*(a\s*)?(loan|scholarship|grant)|free\s*money|dem\s*go\s*collect\s*(am|back)/i.test(
      t,
    ) ||
    intent === 'loan-or-scholarship'
  ) {
    return (
      '**Loan, not a scholarship**\n\n' +
      'NELFUND is an **interest-free student loan**. It is not a grant or gift.\n' +
      'You repay after the official study / NYSC period described on the FAQ — I will not invent a rate or start date.\n\n' +
      `Read live wording: ${FAQ}\nApply only on ${PORTAL}`
    )
  }

  if (
    /wetin\s*(i|dem)\s*(go\s*)?(carry|need|upload)|which\s*document|documents?\s*(do\s*i|i\s*need|needed|required)|wetin\s*dem\s*need|admission\s*letter|nin\s*(and|&)\s*(bvn|jamb)/i.test(
      t,
    ) ||
    intent === 'documents-needed'
  ) {
    return (
      '**Documents students usually prepare**\n\n' +
      'Have these ready (clear photos / PDFs) before you start:\n' +
      '• **NIN** slip\n' +
      '• **JAMB** registration number / slip\n' +
      '• **Admission letter** (portal often requires it)\n' +
      '• **BVN** + the bank account that matches that BVN\n' +
      '• Matric number **if your school has issued it**\n\n' +
      'If a field is missing, the school must upload the record — you cannot invent it here.\n' +
      `Portal: ${PORTAL}`
    )
  }

  if (
    /school\s*(no|not|never)\s*(dey|show|list|found)|not\s*on\s*(the\s*)?list|no\s*result\s*found|institution\s*(no|not)\s*(dey|show)|my\s*school\s*no\s*dey/i.test(
      t,
    ) ||
    intent === 'school-not-found'
  ) {
    return (
      '**School not on the list**\n\n' +
      '1. Type a **shorter official name** (example: Olabisi Onabanjo, not the full motto).\n' +
      '2. Confirm your school is a **public** institution participating this cycle — private schools are usually not on the list.\n' +
      '3. If **No Result found** remains, visit campus NELFUND / ICT / Registry. Do not open a second account.\n\n' +
      `Retry on ${PORTAL}. Still blocked: ${ESUPPORT} with screenshot.`
    )
  }

  if (
    /change\s*(my\s*)?(bank|bvn)|bvn\s*(no|not|never)\s*(match|correct|dey)|wrong\s*bank|account\s*(number\s*)?(wrong|reject)|bank\s*(reject|fail)/i.test(
      t,
    )
  ) {
    return (
      '**BVN / bank details**\n\n' +
      'The account on the form must belong to **you** and match your **BVN**.\n' +
      '1. Login and reopen Profile / bank step.\n' +
      '2. Re-enter BVN and account exactly as your bank issued them.\n' +
      '3. Do not use a parent or agent account.\n\n' +
      `Login: ${LOGIN}\nIf the portal still rejects the bank: campus desk, then ${ESUPPORT}.`
    )
  }

  if (
    /\bnysc\b|i\s*(don|have)\s*finish(ed)?\s*(school|uni)|already\s*graduat|serving\s*(nysc|now)/i.test(
      t,
    )
  ) {
    return (
      '**After study / NYSC**\n\n' +
      'NELFUND is for eligible students at participating public institutions during an open application window.\n' +
      'If you have already finished the programme or you are serving NYSC, check the live FAQ for repayment timing — I will not invent a start date.\n\n' +
      `FAQ: ${FAQ}\nPortal: ${PORTAL}`
    )
  }

  if (
    /una\s*still\s*dey\s*(open|collect|take)|fit\s*i\s*still\s*apply|application\s*(still\s*)?(dey\s*)?open|dem\s*still\s*dey\s*(accept|open)|window\s*(still\s*)?open/i.test(
      t,
    ) ||
    intent === 'current-information'
  ) {
    if (
      /open|close|window|still\s*(dey|apply)|deadline|collect|accept/i.test(t)
    ) {
      return (
        '**Is the application open?**\n\n' +
        'Open / close dates **change by cycle**. I will not invent a deadline here.\n' +
        `1. Check the banner on ${PORTAL} and ${SITE}.\n` +
        `2. Login ${LOGIN} — if you can start or continue a form, the window is live for that account.\n` +
        '3. If Home says the institution has not opened a session, that is a **school** block, not always a national close.\n\n' +
        `FAQ: ${FAQ}`
      )
    }
  }

  return null
}
