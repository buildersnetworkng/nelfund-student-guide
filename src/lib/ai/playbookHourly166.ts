const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const LOGIN = 'https://portal.nelf.gov.ng/auth/login'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hourly 166: name mismatch, GSI, school change, vocational, NYSC done, email verify, course change, login pidgin. */
export function playbookHourly166(intent: string, userText: string): string | null {
  const t = userText || ''

  if (/name\s*(no|not|never)\s*(match|the\s*same|gree|tally)|name\s*mismatch|different\s*name|dob\s*(no|not)\s*match|date\s*of\s*birth\s*(no|not)/i.test(t)) {
    return (
      '**Name / date-of-birth mismatch**\n\n' +
      'The portal compares what you typed with JAMB / NIN / BVN / school records.\n\n' +
      '1. Use the **same full name** as on your NIN and admission letter.\n' +
      '2. Do not invent a “portal-only” spelling.\n' +
      `3. Bank and BVN must be in **your** name — update only on ${PORTAL}.\n` +
      `4. Still blocked after you match the documents: campus desk, then ${ESUPPORT} with a screenshot.\n` +
      'I cannot edit NIN or JAMB CAPS from this chat.'
    )
  }

  if (/\bgsi\b|global\s*standing|debit\s*my\s*account|dem\s*go\s*debit/i.test(t) || intent === 'gsi') {
    return (
      '**GSI (Global Standing Instruction)**\n\n' +
      'GSI is a repayment recovery method that can link to your bank account under official NELFUND rules.\n\n' +
      `Confirm exact mechanics on ${SITE}. I will not invent cut rates, start dates, or percentages.\n` +
      `Official FAQ: repayment is due **2 years after NYSC**. Portal: ${PORTAL}.`
    )
  }

  if (/change\s*(of\s*)?(school|institution)|I\s*(don|have)\s*transfer|new\s*school\s*after|I\s*change\s*school/i.test(t)) {
    return (
      '**Change of school**\n\n' +
      'The portal follows the institution record your **current school** uploaded for this cycle.\n\n' +
      '1. Ask the new campus NELFUND desk to upload you.\n' +
      '2. Search the exact official school name on the list.\n' +
      '3. Do not open a second student account.\n' +
      `Retry ${PORTAL}. Still missing: ${ESUPPORT} with a screenshot.`
    )
  }

  if (/vocational|skills?\s*school|monotechnic|innovation\s*enterprise|nvc\b/i.test(t)) {
    return (
      '**Vocational / skills / monotechnic**\n\n' +
      'Coverage is for eligible students in **public** tertiary institutions on the official list for this cycle.\n' +
      `Confirm whether your specific school appears on ${PORTAL}. I will not invent extra school types.\n` +
      'If the name is missing, ask the campus desk to upload records — then retry the list.'
    )
  }

  if (/already\s*(finish|finished|done)\s*nysc|don\s*finish\s*nysc|serving\s*nysc|i\s*(don|have)\s*(serve|served)/i.test(t)) {
    return (
      '**NYSC already done / serving**\n\n' +
      'NELFUND is a student loan for eligible students in public tertiary institutions during the applicable study period.\n' +
      `Official FAQ: repayment is due **2 years after NYSC**. Confirm your exact case on ${SITE} and ${PORTAL}.\n` +
      'I will not invent a private exception for people who have already passed out.'
    )
  }

  if (/verif(y|ication)\s*(mail|email)|email\s*(no|not|never)\s*(dey|come|arrive)|confirm\s*(my\s*)?email|no\s*verification\s*(mail|link)/i.test(t)) {
    return (
      '**Email verification did not arrive**\n\n' +
      `1. Check inbox **and spam** for the address you used on ${PORTAL}.\n` +
      '2. Wait a few minutes, then use Resend / verify if the page shows it.\n' +
      `3. If the email is already registered: sign in at ${LOGIN} or use Forgot password — do not create a second account.\n` +
      `4. Still nothing: ${ESUPPORT} with the exact email and a screenshot.`
    )
  }

  if (/change\s*(of\s*)?(course|department|faculty|programme|program)|I\s*(don|have)\s*change\s*(course|dept)/i.test(t)) {
    return (
      '**Change of course / department**\n\n' +
      'The portal uses the programme on the record your school uploaded.\n\n' +
      '1. Confirm the new course with the campus NELFUND / registry desk.\n' +
      '2. Ask them to refresh the upload if the old programme still shows.\n' +
      `3. Retry ${PORTAL}. Still wrong: ${ESUPPORT} with a screenshot.\n` +
      'I cannot edit school records from this chat.'
    )
  }

  if (
    /how\s*(i\s*take|i\s*go|una\s*take)\s*(log\s*in|login)|abeg\s*(help\s*)?(me\s*)?(log\s*in|login)|i\s*no\s*fit\s*(log\s*in|login)|login\s*no\s*gree/i.test(
      t,
    ) ||
    (intent === 'portal-login' && /log\s*in|login|sign\s*in/i.test(t))
  ) {
    return (
      '**How to log in**\n\n' +
      `1. Open ${LOGIN}\n` +
      '2. Enter the **same email** you used to create the account, plus your password.\n' +
      '3. Read the exact red error if it fails (wrong password vs email already used vs network).\n' +
      `4. New account only: ${PORTAL} — do not invent a second email if the first one already exists.\n` +
      `5. Still stuck: ${ESUPPORT} with a screenshot.`
    )
  }

  if (/how\s*(to|do\s*i|i\s*go|i\s*take)\s*apply.{0,40}(loan|upkeep)|i\s*meant.{0,20}(loan|upkeep)|loan\s*and\s*upkeep/i.test(t)) {
    return (
      '**Apply for the loan and upkeep**\n\n' +
      `1. Open ${PORTAL} and sign in (${LOGIN}).\n` +
      '2. Complete profile (JAMB, NIN, BVN, bank in your name).\n' +
      '3. When the official window is open, request the student loan.\n' +
      '4. Tick **upkeep** in the **same session** if you want optional living support (paid to you).\n' +
      '5. Institutional charges still go **to the school**.\n' +
      `I will not invent amounts. Confirm figures only on ${PORTAL}. Stuck: ${ESUPPORT}.`
    )
  }

  return null
}
