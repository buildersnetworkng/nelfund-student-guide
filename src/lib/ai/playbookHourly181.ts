const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const LOGIN = 'https://portal.nelf.gov.ng/auth/login'
const ESUPPORT = 'https://nelfund.esupport.ng/create'
const FAQ = 'https://nelf.gov.ng/faq'

/** Hourly 181: JAMB CAPS, long pending, fee dispute, official site, docs, interest/gift, part-time/private. */
export function playbookHourly181(intent: string, userText: string): string | null {
  const t = userText || ''

  if (
    /jamb\s*caps|caps\s*(no|not|never)\s*(show|dey)|admission\s*(no|not|never)\s*(show|dey)\s*(for|on)\s*(jamb|caps)|jamb\s*(no|not)\s*verify/i.test(
      t,
    )
  ) {
    return (
      '**JAMB / CAPS and the portal**\n\n' +
      'The loan form reads the admission the school and JAMB already have.\n' +
      '1. Confirm your admission on **JAMB CAPS** first (Accept / print letter if that is your route).\n' +
      '2. Use the **exact JAMB registration number** on Profile (no spaces in the wrong place).\n' +
      '3. If CAPS is empty, the school has not completed that record — campus admissions / ICT desk, not a second NELFUND account.\n\n' +
      `Portal Profile: ${PORTAL}\nInvalid format banner: type the number as JAMB printed it.`
    )
  }

  if (
    /how\s*long.{0,24}(pending|approval|approve)|e\s*still\s*dey\s*pending|pending\s*(since|for)\s*(weeks?|months?|days?)|when\s*(go|will)\s*(dem|they)\s*approve/i.test(
      t,
    )
  ) {
    return (
      '**Pending is not declined**\n\n' +
      'On Home / ☰ → **Loans**, **Pending** means the file is still processing.\n' +
      'This chat does not have a personal approval clock. Time varies by school upload and cycle.\n' +
      '1. Confirm you submitted (not only saved a draft).\n' +
      '2. Check Institutional and Upkeep tabs separately.\n' +
      '3. If the school session line is still closed, ask the campus NELFUND desk.\n\n' +
      `Login: ${LOGIN}\nStill stuck with the same Pending for a long stretch: ${ESUPPORT} + screenshot.`
    )
  }

  if (
    /raise\s*a?\s*dispute|wrong\s*(fee|charge|amount)|fee\s*(no|not|never)\s*(correct|match)|institutional.{0,20}(wrong|too\s*high)/i.test(
      t,
    )
  ) {
    return (
      '**Wrong fee on the form**\n\n' +
      'Institutional charges are **school-specific**. If the amount on the form is wrong, use **Raise a dispute** on that step **before Submit**.\n' +
      'Submitting the wrong figure can lock a bad request.\n' +
      'After a dispute, wait for the school / portal update — do not open a second account.\n\n' +
      `Portal: ${PORTAL}\nCampus bursary / NELFUND desk if the school uploaded the wrong charge.`
    )
  }

  if (
    /which\s*(site|website|link)\s*(na|is)\s*(original|official|correct|real)|fake\s*(nelfund\s*)?(site|link|website)|original\s*(nelfund\s*)?(site|portal)/i.test(
      t,
    )
  ) {
    return (
      '**Official sites only**\n\n' +
      `Website: ${SITE}\n` +
      `Portal / apply / login: ${PORTAL}\n` +
      `Login page: ${LOGIN}\n` +
      `Support ticket: ${ESUPPORT}\n\n` +
      'Ignore WhatsApp / Telegram “portals”, shortened links, and anyone who asks you to pay or send OTP.'
    )
  }

  if (
    /passport\s*(photograph|photo)|which\s*passport|wetin\s*i\s*go\s*scan|nin\s*slip\s*(and|&)\s*(bvn|jamb)/i.test(
      t,
    )
  ) {
    return (
      '**What to have ready**\n\n' +
      'Typical Profile / upload items students need on the official portal:\n' +
      '• NIN and a clear NIN slip if asked\n' +
      '• JAMB registration number and admission letter where required\n' +
      '• BVN and the bank account that matches that BVN name\n' +
      '• Passport photograph if the form asks for one (plain background, face clear)\n' +
      '• Matric / student ID when the school has issued it\n\n' +
      `Upload only on ${PORTAL}. Do not send these files to an agent.`
    )
  }

  if (
    /una\s*go\s*add\s*interest|interest\s*(later|after)|dem\s*go\s*add\s*interest|hidden\s*interest|go\s*charge\s*interest|interest\s*(dey|free|rate)|zero\s*interest|does\s*(e|it|am)\s*get\s*interest|interest[- ]?free|any\s*interest/i.test(
      t,
    )
  ) {
    return (
      '**Interest**\n\n' +
      'Official description: NELFUND is an **interest-free student loan**.\n' +
      'Repayment is the amount disbursed (school charges + any upkeep you received), not a commercial interest product described here.\n' +
      'It is still a **loan**, not a scholarship. Read the live Terms / GSI text on the portal before you accept.\n\n' +
      `FAQ: ${FAQ}\nPortal: ${PORTAL}`
    )
  }

  if (
    /na\s*(gift|free\s*money|grant|scholarship)\??|dem\s*no\s*go\s*collect|i\s*no\s*go\s*pay\s*back|scholarship\s*abi\s*loan|loan\s*(or|vs)\s*(scholarship|grant)|is\s*(it|nelfund|am)\s*(a\s*)?(scholarship|grant)/i.test(
      t,
    ) ||
    intent === 'loan-or-scholarship'
  ) {
    return (
      '**Loan, not a gift**\n\n' +
      'NELFUND is an **interest-free loan**, not a scholarship and not free money.\n' +
      'Institutional charges go to the school. Upkeep (if selected) goes to your account.\n' +
      'You repay after the official grace (commonly described as after NYSC — confirm on the FAQ).\n\n' +
      `FAQ: ${FAQ}\nApply only on ${PORTAL}.`
    )
  }

  if (
    /part[-\s]*time|sandwich|distance\s*learning/i.test(t) &&
    /eligib|apply|can\s*i|fit\s*i/i.test(t)
  ) {
    return (
      '**Part-time / sandwich / distance**\n\n' +
      'Eligibility follows what **your public institution** has uploaded and what the **current official cycle** allows.\n' +
      'This chat cannot mark a part-time or sandwich programme as approved.\n' +
      'Check the portal list and your campus NELFUND desk. Private institutions are generally outside this scheme.\n\n' +
      `Portal: ${PORTAL}\nSupport: ${ESUPPORT}`
    )
  }

  if (/private\s*(uni|university|poly|school|institution)/i.test(t) && /eligib|apply|can\s*i|fit\s*i/i.test(t)) {
    return (
      '**Private school**\n\n' +
      'The student loan is for eligible students in **public** tertiary institutions listed on the official portal for the cycle.\n' +
      'If the school does not appear, do not use a look-alike website.\n\n' +
      `Check the list only on ${PORTAL}.`
    )
  }

  if (
    /mail\s*don\s*(dey|exist)|email\s*already|account\s*already\s*(dey|exist)|this\s*mail\s*(don|already)/i.test(
      t,
    )
  ) {
    return (
      '**Email already used**\n\n' +
      'That address already has a portal account.\n' +
      `1. Log in at ${LOGIN} with the same email.\n` +
      '2. Use **Forgot password** if you cannot remember it.\n' +
      '3. Do not register a second email — that splits your record.\n' +
      `4. Still blocked: ${ESUPPORT} with a screenshot.`
    )
  }

  return null
}
