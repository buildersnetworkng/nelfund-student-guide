const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const LOGIN = 'https://portal.nelf.gov.ng/auth/login'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hourly 165: documents/photo, pending pidgin, JAMB fail, school list, OTP, support, window, interest, loan vs scholarship. */
export function playbookHourly165(intent: string, userText: string): string | null {
  const t = userText || ''

  if (/otp|one[- ]time\s*(password|pin)|send\s*(me\s*)?(your\s*)?(otp|pin)|give\s*(me\s*)?(your\s*)?otp|whatsapp\s*(man|agent|guy)|pay\s*(am\s*)?\d|agent\s*(ask|wan|say)|scam/i.test(t)) {
    return (
      '**Stay safe — OTP / agents**\n\n' +
      '- Never share OTP, password, NIN or BVN with anyone who messages you.\n' +
      '- Never pay an agent to apply or to “speed up” NELFUND.\n' +
      `- Apply and log in only on ${PORTAL} (${LOGIN}). Official site: ${SITE}.\n` +
      `- Official tickets only: ${ESUPPORT}.`
    )
  }

  if (/school\s*(no|not|never)\s*(dey|show|list)|not\s*(on\s*)?(the\s*)?list|cannot\s*find\s*(my\s*)?school|my\s*school\s*(no|not)\s*dey/i.test(t)) {
    return (
      '**School not on the list**\n\n' +
      'Usually the school has not finished uploading your record, or the name you typed does not match the official list.\n\n' +
      '1. Try the exact official school name (and the common short form).\n' +
      '2. Confirm it is a **public** institution on this cycle.\n' +
      '3. Ask the campus NELFUND desk to upload student records.\n' +
      '4. Do not open a second account.\n' +
      `Retry ${PORTAL}. Still missing: ${ESUPPORT} with a screenshot.`
    )
  }

  if (/invalid\s*jamb|jamb\s*(no|not|never)\s*(work|dey|verify)|verify\s*with\s*jamb|utme\s*(no|not)|jamb\s*(fail|error|reject)/i.test(t) || (intent === 'jamb-verification' && /jamb|utme/i.test(t))) {
    return (
      '**JAMB verification**\n\n' +
      '1. Type the JAMB registration number that matches your admission letter.\n' +
      '2. If NIN is not linked to JAMB, the portal may ask you to enter NIN for validation.\n' +
      '3. Do not invent a different JAMB number.\n' +
      `4. Retry ${PORTAL}. Still “invalid JAMB”: campus desk + ${ESUPPORT} with a screenshot.\n` +
      'I cannot change JAMB CAPS from this chat.'
    )
  }

  if (/wetin\s*(i|una)\s*(go|suppose|need)\s*(carry|upload|bring)|passport\s*(photo|photograph)|which\s*document|documents?\s*(i\s*)?(need|dey\s*need)|upload\s*(photo|picture|admission)/i.test(t) || intent === 'documents-needed') {
    if (/document|passport|upload|wetin|photo|admission|nin|bvn/i.test(t) || intent === 'documents-needed') {
      return (
        '**Documents for the portal**\n\n' +
        'Have these ready as clear PDF or JPEG before you start (the form may not save mid-upload):\n' +
        '- Admission letter (compulsory for new students)\n' +
        '- NIN and BVN\n' +
        '- Bank account in **your** name\n' +
        '- Matriculation number when the school has issued it\n' +
        '- Student ID and school invoice if the form asks (often optional)\n' +
        '- Passport photograph if the profile asks\n\n' +
        `Upload only on ${PORTAL}. Never send files to an agent or WhatsApp number.`
      )
    }
  }

  if (/pending|how\s*far\s*(my\s*)?(loan|money|application)|money\s*never\s*(enter|show|drop)|never\s*enter\s*(my\s*)?(account|bank)|wetin\s*dey\s*hold|status\s*(still\s*)?pending/i.test(t)) {
    return (
      '**Pending / money never show**\n\n' +
      `1. Sign in at ${LOGIN} and read the exact status (Pending is not the same as declined).\n` +
      '2. Institutional charges go to the **school** after approval; upkeep (if you ticked it) goes to **you**.\n' +
      'Official FAQ: disbursement is within **30 days of approval** of a successful application.\n' +
      `3. Still unchanged after that window: campus desk, then ${ESUPPORT} with a screenshot.\n` +
      'I will not invent your personal pay date.'
    )
  }

  if (/how\s*(i\s*go|do\s*i|to)\s*(contact|reach|yarn)|esupport|help\s*desk|open\s*(a\s*)?ticket|official\s*(email|number|phone)/i.test(t) || intent === 'contact-support' || intent === 'contact-lookup') {
    if (/contact|esupport|ticket|email|phone|number|help\s*desk|yarn|reach/i.test(t) || intent === 'contact-support' || intent === 'contact-lookup') {
      return (
        '**Official support only**\n\n' +
        `- Website: ${SITE}\n` +
        `- Portal / apply: ${PORTAL}\n` +
        `- Login: ${LOGIN}\n` +
        `- Tickets: ${ESUPPORT}\n\n` +
        'I will not invent WhatsApp agents or private phone numbers. Use the campus NELFUND desk first if the problem is school records.'
      )
    }
  }

  if (/still\s*(open|dey\s*open)|dem\s*don\s*close|application\s*(open|close|window)|can\s*i\s*still\s*apply|deadline|when\s*(go|will)\s*(e\s*)?open/i.test(t)) {
    return (
      '**Is the application open?**\n\n' +
      'Windows change by cycle. Confirm live open/closed status only on the official pages — I will not invent a private closing date.\n' +
      `Open ${PORTAL} or ${SITE}. Login: ${LOGIN}.\n` +
      'If the window is open, complete profile then request the loan (tick upkeep in the same session if you want living support).'
    )
  }

  if (/loan\s*(or|vs|versus)\s*scholarship|na\s*(scholarship|grant|free\s*money)|scholarship\s*or\s*loan|wetin\s*be\s*(the\s*)?difference/i.test(t) || intent === 'loan-or-scholarship') {
    return (
      '**Loan, not scholarship**\n\n' +
      'NELFUND is an **interest-free loan**. It is not a grant, scholarship, or free money.\n' +
      `Official FAQ: repayment is due **2 years after NYSC**. Confirm on ${SITE}. I will not invent rates or jail terms.\n` +
      `Apply only on ${PORTAL}.`
    )
  }

  if (/interest[- ]?free|zero\s*interest|does\s*(am|it|e)\s*get\s*interest|interest\s*dey|any\s*interest/i.test(t)) {
    return (
      '**Interest**\n\n' +
      'Official wording describes the student loan as **interest-free** (no hidden charges in that description).\n' +
      `Confirm the current wording on ${SITE} and ${PORTAL}. I will not invent a percentage rate.`
    )
  }

  if (/part[\s-]*time|sandwich\s*(student|programme|program)/i.test(t)) {
    return (
      '**Part-time / sandwich**\n\n' +
      'Mode of study must match what the official portal accepts for your uploaded school record.\n' +
      `Confirm on ${PORTAL} — I will not invent extra categories. If the school is missing from the list, ask the campus desk to upload.`
    )
  }

  return null
}
