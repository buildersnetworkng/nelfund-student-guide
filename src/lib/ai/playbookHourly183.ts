const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const LOGIN = 'https://portal.nelf.gov.ng/auth/login'
const ESUPPORT = 'https://nelfund.esupport.ng/create'
const FAQ = 'https://nelf.gov.ng/faq'

/** Hourly 183: email used, password, loan vs scholarship, interest, school list, missing info, part-time, apply+upkeep. */
export function playbookHourly183(intent: string, userText: string): string | null {
  const t = userText || ''

  if (/email\s*(already|don|has)\s*(been\s*)?(use[d]?|taken|exist)|dis\s*email\s*(don|already)\s*(dey|exist)|account\s*(already|don)\s*(dey|exist)/i.test(t)) {
    return (
      '**Email already used**\n\n' +
      `That address already has a portal account.\n` +
      `1. Sign in at ${LOGIN} with the same email.\n` +
      `2. Forgot the password? Use Forgot / Reset password on ${PORTAL} for that email.\n` +
      `3. Still blocked: ${ESUPPORT} with a screenshot.\n\n` +
      'Do not open a second account unless official support tells you to.'
    )
  }

  if (/forget\s*(my\s*)?(pass|password)|forgot\s*(my\s*)?(pass|password)|reset\s*(my\s*)?(pass|password)|password\s*(no|not|never)\s*(dey|work|correct)|i\s*no\s*remember\s*(my\s*)?password/i.test(t)) {
    return (
      '**Reset password**\n\n' +
      `1. Open ${LOGIN} → Forgot / Reset password.\n` +
      '2. Enter the email on the account.\n' +
      '3. Check inbox and spam, then set a new password and sign in.\n' +
      `4. No mail arrives: ${ESUPPORT}.\n\n` +
      'Never send the password to an agent or WhatsApp number.'
    )
  }

  if (/\b(na|is)\s*(dis|this|am)\s*(scholarship|grant|free\s*money)|loan\s*(or|vs|abi)\s*scholarship|scholarship\s*(or|vs|abi)\s*loan|dem\s*(go|will)\s*collect\s*(am\s*)?back|na\s*free\s*money/i.test(t)) {
    return (
      '**Loan, not scholarship**\n\n' +
      'NELFUND is an **interest-free loan**. It is not a grant, scholarship, or free money.\n' +
      `Official FAQ: repayment is due **2 years after NYSC**. Confirm live wording on ${FAQ} and ${SITE}.\n` +
      'I will not invent rates or a personal repayment calendar.'
    )
  }

  if (/interest\s*(rate|free|zero)|zero\s*interest|dem\s*(go|will)\s*add\s*interest|how\s*much\s*interest|e\s*get\s*interest/i.test(t)) {
    return (
      '**Interest**\n\n' +
      'The official portal describes the student loan as **interest-free** (no hidden charges).\n' +
      `Confirm the live wording on ${SITE} and ${PORTAL}. I will not invent a percentage.`
    )
  }

  if (/school\s*(no|not|never)\s*(dey|show|appear)\s*(for|on)?\s*(the\s*)?list|my\s*school\s*(no|not)\s*(dey|on)\s*(the\s*)?list|una\s*no\s*put\s*my\s*school/i.test(t)) {
    return (
      '**School not on the list**\n\n' +
      'Usually the typed name does not match the official list, or the school has not opened this session.\n\n' +
      '1. Search a shorter official name (not the nickname).\n' +
      '2. Confirm it is a **public** tertiary institution on this cycle.\n' +
      '3. Ask the campus NELFUND / ICT desk to upload / open the session.\n' +
      `4. Retry ${PORTAL}. Still missing: ${ESUPPORT} with a screenshot.`
    )
  }

  if (/missing\s*(info|information|details)|profile\s*(no|not)\s*complete|e\s*say\s*missing|portal\s*say\s*missing/i.test(t)) {
    return (
      '**Missing information**\n\n' +
      'The portal still needs a field from you or from the school file.\n\n' +
      '1. Finish Profile: NIN, JAMB, BVN, bank in **your** name.\n' +
      '2. If school / matric is the gap, campus NELFUND desk first.\n' +
      `3. Retry ${PORTAL}. Same error: ${ESUPPORT} with a screenshot.\n` +
      `Login: ${LOGIN}`
    )
  }

  if (/part[\s-]*time|sandwich|post\s*graduate|postgraduate|masters?\b|phd\b|i\s*dey\s*part\s*time/i.test(t)) {
    return (
      '**Mode of study**\n\n' +
      'Official coverage is for eligible students in **public** tertiary institutions. Part-time, sandwich, and postgraduate lines must match what the live portal accepts for your school record.\n' +
      `I will not invent extra categories. Confirm on ${PORTAL} and ${FAQ}.`
    )
  }

  if (/how\s*(to|i\s*go|do\s*i)\s*apply\s*(then\s*)?(i\s*meant\s*)?(for\s*)?(the\s*)?(loan|upkeep)|apply.{0,24}(loan|upkeep).{0,16}(and|&|plus).{0,16}(loan|upkeep)/i.test(t)) {
    return (
      '**Apply for institutional charges and upkeep**\n\n' +
      `1. Open ${PORTAL} and sign in (${LOGIN}).\n` +
      '2. Finish Profile (JAMB, NIN, BVN, bank in your name).\n' +
      '3. On **Request for Student Loan** choose institutional charges and, if offered this cycle, tick **upkeep** in the same session.\n' +
      '4. Confirm the live figures on the form. Accept Terms and the GSI mandate, then Submit.\n\n' +
      'Fees go to the school. Upkeep (if selected and approved) goes to your BVN account.'
    )
  }

  if (intent === 'password-reset') {
    return (
      '**Forgot password**\n\n' +
      `Use Forgot / Reset password on ${LOGIN} with the account email. Check spam. Ticket: ${ESUPPORT}.`
    )
  }

  if (intent === 'email-already-used') {
    return (
      '**Email already used**\n\n' +
      `Sign in at ${LOGIN} or reset that same email on ${PORTAL}. Do not open a second account. Ticket: ${ESUPPORT}.`
    )
  }

  return null
}
