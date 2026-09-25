const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const LOGIN = 'https://portal.nelf.gov.ng/auth/login'
const ESUPPORT = 'https://nelfund.esupport.ng/create'
const FAQ = 'https://nelf.gov.ng/faq'

/** Hourly 178: interest, pending, JAMB, scam, support, missing info, fees vs upkeep. */
export function playbookHourly178(intent: string, userText: string): string | null {
  const t = userText || ''

  if (
    /interest\s*(rate|free)?|any\s*interest|dem\s*dey\s*add\s*interest|is\s*(e|it)\s*interest|how\s*much\s*interest|percent(age)?\s*(interest|loan)|loan\s*(get|has)\s*interest/i.test(
      t,
    )
  ) {
    return (
      '**Interest**\n\n' +
      'Official description: NELFUND is an **interest-free student loan**.\n' +
      'I will not invent a percentage, penalty rate, or hidden charge.\n\n' +
      `Confirm live wording on ${FAQ} and ${SITE}. Apply only on ${PORTAL}.`
    )
  }

  if (
    /jamb.{0,20}(no|not|never|wrong|reject|fail|invalid|issue|problem|error)|no\s*jamb|i\s*no\s*get\s*jamb|jamb\s*(number|reg)/i.test(
      t,
    ) ||
    intent === 'jamb-verification'
  ) {
    return (
      '**JAMB on the form**\n\n' +
      'The portal usually asks for your **JAMB registration number** and admission details.\n' +
      '• Type the number exactly as on your JAMB slip / admission letter.\n' +
      '• If the school has not uploaded your record, JAMB alone will not unlock the form.\n' +
      '• Direct-entry / transfer cases still need whatever the portal and school list accept.\n\n' +
      `Retry on ${PORTAL}. Still blocked: campus NELFUND desk, then ${ESUPPORT}.`
    )
  }

  if (
    /\bpending\b.{0,24}(long|since|still|dey|too)|still\s*(dey\s*)?pending|my\s*(loan|application|status)\s*(still\s*)?(pending|no\s*move)|when\s*(go|will)\s*(dem|they)\s*(approve|pay)/i.test(
      t,
    ) ||
    intent === 'pending-application'
  ) {
    return (
      '**Pending application**\n\n' +
      'Pending means submitted and still processing — not an automatic decline.\n' +
      `1. Login ${LOGIN} → **☰ → Loans** and read the exact status.\n` +
      '2. Confirm your school uploaded data and fee figures.\n' +
      '3. I cannot jump the queue from this chat.\n\n' +
      `Official FAQ may mention processing after a successful application — confirm live on ${FAQ}.\n` +
      `Stuck with an error text: ${ESUPPORT} + screenshot.`
    )
  }

  if (
    /whatsapp|telegram|pay\s*(me|am|them|5k|10k|fee\s*to\s*agent)|agent\s*(say|ask|wan)|otp\s*(for|to)\s*(agent|am)|scam|fraud/i.test(
      t,
    ) ||
    intent === 'scam-safety'
  ) {
    return (
      '**Safety — official channels only**\n\n' +
      '• Apply and upload only on ' +
      PORTAL +
      '.\n' +
      '• Never pay an agent, POS, or WhatsApp/Telegram contact to “process” NELFUND.\n' +
      '• Never share OTP, password, or BVN with anyone who DMs you.\n' +
      `• Real help desk tickets: ${ESUPPORT}\n` +
      `Site: ${SITE}`
    )
  }

  if (
    /how\s*(i|to)\s*(go\s*)?contact|official\s*(email|phone|number)|support\s*(ticket|desk)|esupport|customer\s*care|helpline/i.test(
      t,
    ) ||
    intent === 'contact-support'
  ) {
    return (
      '**Official support**\n\n' +
      `1. Portal issues: login ${LOGIN} and capture the exact screen.\n` +
      `2. Open a ticket: ${ESUPPORT}\n` +
      `3. Read FAQ: ${FAQ}\n` +
      '4. Campus NELFUND / ICT / Registry desk for school-upload problems.\n\n' +
      'Do not use random phone numbers from social media.'
    )
  }

  if (
    /missing\s*information|incomplete\s*(record|data|info)|school\s*(never|no|not)\s*upload|data\s*(no|not)\s*(dey|show)/i.test(
      t,
    ) ||
    intent === 'missing-information'
  ) {
    return (
      '**Missing information**\n\n' +
      'That portal state usually means the **school has not finished uploading** your student record or fee data.\n' +
      'You cannot invent the fields from this chat.\n\n' +
      '1. Visit campus NELFUND / ICT / Registry desk with admission + JAMB + matric if issued.\n' +
      '2. Ask them to upload / correct the record, then refresh the portal.\n' +
      `3. Still blocked after they confirm upload: ${ESUPPORT} with screenshot.\n` +
      `Portal: ${PORTAL}`
    )
  }

  if (
    /fees?\s*(vs|versus|or|and)\s*upkeep|upkeep\s*(vs|versus|or|and)\s*(fees?|charges)|difference\s*(between\s*)?(upkeep|fees|charges)|wetin\s*be\s*(the\s*)?difference.{0,20}(upkeep|charge|fee)/i.test(
      t,
    )
  ) {
    return (
      '**Fees vs upkeep**\n\n' +
      '• **Institutional charges / school fees** → paid **to the school**.\n' +
      '• **Upkeep** (optional) → paid **to your bank account** if you selected it and it is approved.\n' +
      'Amounts are only those shown on the official form. I will not invent figures.\n\n' +
      `Apply: ${PORTAL}`
    )
  }

  return null
}
