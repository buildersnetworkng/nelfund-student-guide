const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const LOGIN = 'https://portal.nelf.gov.ng/auth/login'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hourly 167: part-time/sandwich, private school, postgraduate, passport photo, fee dispute, Pidgin docs. */
export function playbookHourly167(intent: string, userText: string): string | null {
  const t = userText || ''

  if (/part[\s-]*time|sandwich\s*(student|programme|program|course)?|evening\s*(student|programme)/i.test(t)) {
    return (
      '**Part-time / sandwich / evening**\n\n' +
      'Official wording on eligibility is **full-time** students in **public** tertiary institutions that appear on the portal list.\n\n' +
      `I will not invent extra modes of study. Confirm whether your record is accepted on ${PORTAL}.\n` +
      'If the school list or programme is wrong, ask the campus NELFUND desk to refresh the upload.\n' +
      `Still blocked: ${ESUPPORT} with a screenshot.`
    )
  }

  if (/private\s*(uni|university|poly|polytechnic|school|institution)|na\s*private\s*school/i.test(t)) {
    return (
      '**Private institution**\n\n' +
      'Coverage in this guide follows official language: eligible students in **public** tertiary institutions on the current list.\n\n' +
      `Confirm any private-school exception only on ${SITE} and ${PORTAL}. I will not invent one.\n` +
      `If your public school is missing from the list instead, ask the campus desk, then ${ESUPPORT}.`
    )
  }

  if (/post[\s-]*grad|masters?\b|msc\b|phd\b|mphil|pgd\b|postgraduate/i.test(t)) {
    return (
      '**Postgraduate / Master\u2019s / PhD**\n\n' +
      'This chat will not invent a separate postgraduate window.\n' +
      `Check whether your programme and school appear on ${PORTAL} for this cycle.\n` +
      'You still need a school-uploaded record, NIN, BVN and a bank account in your name if the portal lets you continue.\n' +
      `Official site: ${SITE}. Ticket if the list is wrong: ${ESUPPORT}.`
    )
  }

  if (/passport\s*(photo|photograph)|profile\s*picture|upload\s*(my\s*)?(photo|picture)|picture\s*no\s*(gree|dey)/i.test(t)) {
    return (
      '**Passport / profile photo**\n\n' +
      `Upload only on ${PORTAL} (signed in at ${LOGIN}).\n` +
      '1. Use a clear recent passport-style photo of **you**.\n' +
      '2. Follow the portal size / format message if it rejects the file.\n' +
      '3. Do not send the photo to an agent on WhatsApp.\n' +
      `4. Still rejected: ${ESUPPORT} with the exact error text.`
    )
  }

  if (/dispute\s*(the\s*)?(fee|charge|amount)|wrong\s*(institutional|school)\s*(fee|charge|amount)|amount\s*(no|not)\s*(correct|tally)|fee\s*too\s*(high|much)/i.test(t)) {
    return (
      '**Wrong institutional charges on the form**\n\n' +
      'Institutional charges are school-specific. Raise a **dispute on the portal** before you submit if the figure is wrong.\n\n' +
      '1. Do not invent a new amount in this chat.\n' +
      `2. Sign in at ${LOGIN} and use the dispute / correct-charges path the form shows.\n` +
      '3. Tell the campus NELFUND desk so they can correct the school upload.\n' +
      `4. Still wrong after that: ${ESUPPORT} with a screenshot.\n` +
      `Confirm live figures only on ${PORTAL}.`
    )
  }

  if (
    /wetin\s*(i|una)\s*(go|suppose|need)\s*(carry|upload|bring)|which\s*document|wetin\s*i\s*need\s*for\s*(dis|this)\s*(loan|nelfund)/i.test(
      t,
    ) ||
    (intent === 'documents-needed' && /document|nin|bvn|admission|matric/i.test(t))
  ) {
    return (
      '**Documents to have ready**\n\n' +
      'Have these ready before you submit (exact list can vary by cycle \u2014 confirm on the portal):\n' +
      '- JAMB registration number (as on your slip)\n' +
      '- NIN\n' +
      '- BVN and a bank account **in your name**\n' +
      '- Admission letter / school record (your campus must upload you)\n' +
      '- Matriculation number when the school has issued it\n\n' +
      `Apply only at ${PORTAL}. Login: ${LOGIN}. Never send documents to a WhatsApp agent.\n` +
      `Stuck: campus desk, then ${ESUPPORT}.`
    )
  }

  if (/^\s*(unilag|university of lagos)\s*$/i.test(t) || /\bunilag\b/i.test(t)) {
    return (
      '**UNILAG (University of Lagos)**\n\n' +
      'If the portal shows Missing information, the campus NELFUND / ICT / Registry desk must upload your record.\n' +
      `Retry ${PORTAL} after they confirm. Still blocked: ${ESUPPORT} with a screenshot.\n` +
      'Do not open a second account.'
    )
  }

  if (/two\s*account|second\s*email|open\s*another\s*account|register\s*again|double\s*application/i.test(t)) {
    return (
      '**Second account / apply twice**\n\n' +
      'Do **not** open another email just to force a new application.\n' +
      `1. Sign in with the first email at ${LOGIN}.\n` +
      '2. Use Forgot password if you lost access.\n' +
      `3. One student, one portal profile. Ticket: ${ESUPPORT}.`
    )
  }

  return null
}
