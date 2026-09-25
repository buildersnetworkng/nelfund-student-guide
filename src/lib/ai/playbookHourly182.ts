const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const LOGIN = 'https://portal.nelf.gov.ng/auth/login'
const ESUPPORT = 'https://nelfund.esupport.ng/create'
const FAQ = 'https://nelf.gov.ng/faq'

/** Hourly 182: docs checklist, NYSC/repay, college/poly, WhatsApp NIN, ticket vs campus, apply+upkeep Pidgin, GSI now. */
export function playbookHourly182(intent: string, userText: string): string | null {
  const t = userText || ''

  if (
    /wetin\s*(i|dem)\s*(go\s*)?(need|carry|gather)\s*(before|to)\s*(i\s*)?(apply|start)|documents?\s*(checklist|list)|what\s*(papers|docs)\s*(do\s*i|i\s*need)/i.test(
      t,
    )
  ) {
    return (
      '**Documents to gather before you start**\n\n' +
      'Have these ready so a timeout does not force you to restart uploads:\n' +
      '\u2022 JAMB registration number (fresh) or matric number (returning)\n' +
      '\u2022 NIN and BVN in your own name\n' +
      '\u2022 Bank account that matches that BVN\n' +
      '\u2022 Admission letter (clear JPEG/PDF)\n' +
      '\u2022 Optional: student ID, fee invoice, passport photograph\n\n' +
      `Upload only on ${PORTAL}. Do not send these files on WhatsApp.`
    )
  }

  if (
    /i\s*(no|never|don.?t)\s*(do|finish|don)\s*nysc|before\s*nysc|repay.{0,20}nysc|when\s*(i\s*)?(go|will)\s*pay\s*back/i.test(
      t,
    )
  ) {
    return (
      '**Repayment timing**\n\n' +
      'Official FAQ describes repayment after the study + NYSC grace window (commonly **2 years after NYSC** \u2014 confirm the live FAQ wording).\n' +
      'If you have not done NYSC yet, you are not in the repayment window now.\n' +
      'GSI is a mandate the portal asks you to accept at submit. It is not a same-day debit for students still in school.\n\n' +
      `FAQ: ${FAQ}\nPortal: ${PORTAL}`
    )
  }

  if (
    /college\s*of\s*education|coe\b|polytechnic\s*(student|i\s*dey)|i\s*dey\s*(poly|coe|college)/i.test(
      t,
    )
  ) {
    return (
      '**Polytechnic / college of education**\n\n' +
      'Public polytechnics and colleges of education that are on this cycle\u2019s list can be eligible the same way as public universities.\n' +
      'Private campuses are outside the current student-loan scope.\n' +
      'Your school must appear when you search and must have opened the session line.\n\n' +
      `Try a shorter official name on ${PORTAL}. Campus NELFUND / ICT desk if it should be listed.`
    )
  }

  if (
    /(send|give|share).{0,18}(nin|bvn|account).{0,18}(whatsapp|agent|them)|whatsapp.{0,18}(nin|bvn)|make\s*i\s*send\s*(my\s*)?(nin|bvn)/i.test(
      t,
    )
  ) {
    return (
      '**Do not send NIN or BVN on WhatsApp**\n\n' +
      'Nobody processing NELFUND needs those numbers in chat. Type them only inside the official portal.\n' +
      'Never share OTP, password, or PIN either.\n\n' +
      `Apply / login: ${PORTAL}\nLogin: ${LOGIN}\nIf someone already collected them: change portal password, alert your bank if BVN/account was shared, then ${ESUPPORT}.`
    )
  }

  if (
    /ticket\s*(or|vs|abi)\s*(school|campus)|campus\s*desk\s*(or|abi)\s*(esupport|ticket)|who\s*(i\s*)?go\s*ask\s*first/i.test(
      t,
    )
  ) {
    return (
      '**Campus desk vs official ticket**\n\n' +
      '\u2022 School data (session not opened, school missing, matric / name on the school file) \u2192 campus NELFUND / ICT / admissions desk first.\n' +
      `\u2022 Portal account, login, upload error after the school line is open \u2192 screenshot + ${ESUPPORT}.\n` +
      `Login: ${LOGIN} \u00b7 Site: ${SITE}`
    )
  }

  if (
    /how\s*(i\s*go|to|do\s*i)\s*apply\s*(for\s*)?(loan\s*)?(and|&|plus)\s*upkeep|upkeep\s*(and|&|plus)\s*(school\s*fees|institutional)|select\s*both\s*(loan|upkeep)/i.test(
      t,
    )
  ) {
    return (
      '**Institutional charges + upkeep**\n\n' +
      'On **Request for Student Loan** you choose:\n' +
      '\u2022 Institutional charges only (fees paid to the school), or\n' +
      '\u2022 Institutional charges plus upkeep (stipend to your BVN account if that option is offered this cycle).\n\n' +
      'Confirm the live stipend figure on the form. Accept Terms and the GSI mandate before Submit.\n' +
      `Start: ${PORTAL}`
    )
  }

  if (
    /gsi.{0,24}(now|today|debit|remove\s*money)|will\s*(dem|they)\s*(debit|remove\s*money)\s*now|mandate\s*(mean|be)\s*wetin/i.test(
      t,
    )
  ) {
    return (
      '**GSI mandate**\n\n' +
      'GSI is the repayment instruction you accept when you submit. It is how recovery can happen later if the loan is not repaid after the grace window.\n' +
      'It is not a same-day school-fee debit. Tuition goes to the institution when that part is approved.\n\n' +
      `Read the mandate text on the form at ${PORTAL}. FAQ: ${FAQ}`
    )
  }

  if (intent === 'documents-needed' && /document|upload|letter|nin|bvn|jamb/i.test(t)) {
    return (
      '**What the form asks for**\n\n' +
      'Typical fields: JAMB or matric number, NIN, BVN, bank that matches BVN, admission letter upload.\n' +
      `Use ${PORTAL} only. Clear JPEG/PDF. Campus desk if the school record is the blocker.`
    )
  }

  return null
}
