const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const LOGIN = 'https://portal.nelf.gov.ng/auth/login'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hourly 169: name mismatch, GSI, change of school, vocational/part-time, parent, photo, verify email. */
export function playbookHourly169(intent: string, userText: string): string | null {
  const t = userText || ''

  if (
    /name\s*(no|not|never)\s*(match|the\s*same)|name\s*mismatch|different\s*name|spelling\s*(no|not)\s*(match|correct)|nin\s*(and|&)\s*bvn.{0,20}(name|match)/i.test(
      t,
    )
  ) {
    return (
      '**Name mismatch**\n\n' +
      'The portal checks that JAMB, NIN, BVN, and bank names look like the same person.\n\n' +
      '1. Compare the exact spelling on JAMB, NIN slip, BVN, and your bank account.\n' +
      '2. Fix the record that is wrong at that office (JAMB, NIMC, or your bank) — this chat cannot change it.\n' +
      `3. Retry ${PORTAL}. Still blocked: campus NELFUND desk, then ${ESUPPORT} with a screenshot.\n` +
      'Do not open a second account to dodge a name mismatch.'
    )
  }

  if (/\bgsi\b|global\s*standing|debit\s*my\s*account|standing\s*instruction/i.test(t) || intent === 'gsi') {
    return (
      '**GSI (Global Standing Instruction)**\n\n' +
      'On the official form you accept a repayment recovery mandate that can link to your bank account after the grace period.\n\n' +
      `Read the exact wording on ${PORTAL} before you tick it. Confirm mechanics on ${SITE}.\n` +
      'I will not invent cut rates, start dates, or extra charges.'
    )
  }

  if (
    /change\s*(of\s*)?(school|institution|course)|I\s*(don|have)\s*transfer|new\s*school\s*after|switch(ed)?\s*(school|course)/i.test(
      t,
    )
  ) {
    return (
      '**Change of school or course**\n\n' +
      'Your portal record must match the institution that uploaded you for this cycle.\n\n' +
      '1. Ask the **new** school NELFUND / ICT / Registry desk to upload your current record.\n' +
      '2. If the old school is still listed, ask both desks which record is active.\n' +
      `3. Retry ${PORTAL}. Do not create a second student account.\n` +
      `4. Still stuck: ${ESUPPORT} with a screenshot of the school list.`
    )
  }

  if (/vocational|skills?\s*school|monotechnic|part[\s-]*time|sandwich/i.test(t) && /eligib|can\s*i|who\s*can|apply|fit/i.test(t)) {
    return (
      '**Mode of study / institution type**\n\n' +
      'Official coverage is for eligible students in **public** tertiary institutions that appear on the portal list.\n\n' +
      'Part-time, sandwich, vocational, or monotechnic study must match what **your school record** and the official portal accept this cycle.\n' +
      `Confirm on ${PORTAL} — I will not invent extra categories.\n` +
      `School missing from the list: campus desk, then ${ESUPPORT}.`
    )
  }

  if (/for\s+(my\s+)?(child|son|daughter|ward)|parent\s+|guardian\s+/i.test(t)) {
    return (
      '**Parent / guardian help**\n\n' +
      'The student must apply in **their own** name with **their** JAMB, NIN, BVN, and bank account.\n\n' +
      `1. Open ${PORTAL} together and create or sign in to the student’s account (${LOGIN}).\n` +
      '2. Tick institutional charges (paid to the school) and optional upkeep (paid to the student).\n' +
      '3. Never pay an agent or share the student’s OTP.\n' +
      `Stuck: campus NELFUND desk, then ${ESUPPORT}.`
    )
  }

  if (/passport\s*(photo|photograph)|profile\s*picture|upload\s*photo/i.test(t)) {
    return (
      '**Photo / passport on the portal**\n\n' +
      'If the form asks for a passport photograph or profile picture, upload a clear recent face shot in the format the portal lists (often JPEG or PDF).\n\n' +
      `Upload only on ${PORTAL}. Do not send photos to WhatsApp agents.\n` +
      `Upload error: retry a smaller file, then ${ESUPPORT} with a screenshot.`
    )
  }

  if (/verif(y|ication)\s*(mail|email)|email\s*(no|not|never)\s*(dey|come)|confirm\s*email|link\s*(no|not)\s*(dey|come)/i.test(t)) {
    return (
      '**Email verification**\n\n' +
      `1. Check inbox and spam for the link from the official portal (${PORTAL}).\n` +
      '2. Wait a few minutes and request the mail again from the same page if the portal offers Resend.\n' +
      `3. Still nothing: Forgot / Reset at ${LOGIN} only if an account already exists.\n` +
      `4. Do not invent a second Gmail. Ticket: ${ESUPPORT}.`
    )
  }

  if (/already\s*(finish|finished|done)\s*nysc|serving\s*nysc|after\s*nysc/i.test(t) && /repay|loan|apply|eligib/i.test(t)) {
    return (
      '**NYSC and repayment**\n\n' +
      `Official FAQ: repayment is due **2 years after NYSC**. Confirm on ${SITE}.\n` +
      'If you are still a student in a public tertiary institution this cycle, apply only while the official window is open.\n' +
      `I will not invent your personal start date. Portal: ${PORTAL}.`
    )
  }

  return null
}
