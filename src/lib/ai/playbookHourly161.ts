const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const LOGIN = 'https://portal.nelf.gov.ng/auth/login'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hourly 161: name mismatch, NYSC repayment Pidgin, GSI, change-of-school, vocational, passport. No invented amounts. */
export function playbookHourly161(intent: string, userText: string): string | null {
  const t = userText || ''

  if (
    /name\s*(no|not|never)\s*(match|the\s*same|dey\s*the\s*same)|name\s*mismatch|different\s*name|my\s*name\s*(and|vs)\s*(bvn|nin|jamb)|bvn\s*name\s*(no|not)\s*match/i.test(
      t,
    )
  ) {
    return (
      '**Name mismatch (JAMB / NIN / BVN / bank)**\n\n' +
      'The portal needs the **same person** on JAMB, NIN, BVN and the bank account.\n' +
      '1. Compare the names on those records before you apply.\n' +
      '2. Fix spelling with the issuing body (JAMB / NIMC / your bank) — this chat cannot edit them.\n' +
      `3. Retry ${PORTAL}. Still blocked: campus NELFUND desk, then ${ESUPPORT} with a screenshot.\n` +
      'Do not open a second account just to dodge a name error.'
    )
  }

  if (
    /when\s*(i|una|dem)\s*(go|will)\s*pay\s*(back|am)|after\s*nysc|2\s*years?\s*after|repay\s*(start|begin)|wetin\s*time\s*(i|una)\s*go\s*pay\s*back|i\s*don\s*finish\s*nysc/i.test(
      t,
    ) ||
    intent === 'repayment'
  ) {
    return (
      '**When repayment starts**\n\n' +
      'Official FAQ: repayment is due **2 years after NYSC**.\n' +
      'NELFUND is still a **loan** (interest-free on official wording), not a scholarship.\n' +
      `Confirm live rules on ${SITE}. I will not invent a start date, percentage, or jail term.\n` +
      `Check your own status on ${LOGIN}.`
    )
  }

  if (/\bgsi\b|global\s*standing|wetin\s*be\s*gsi|dem\s*wan\s*debit\s*my\s*account/i.test(t) || intent === 'gsi') {
    return (
      '**GSI (Global Standing Instruction)**\n\n' +
      'GSI is the official repayment-recovery mandate you accept on the portal. It can allow recovery from your bank account under NELFUND rules after the grace period.\n' +
      `Read the exact text on ${PORTAL} before you tick it. Confirm wording on ${SITE}.\n` +
      'I will not invent cut rates or extra bank charges.'
    )
  }

  if (
    /change\s*(of\s*)?(school|institution|course)|I\s*(don|have)\s*transfer|new\s*school\s*(after|since)\s*I\s*apply|wrong\s*school\s*(I|una)\s*select/i.test(
      t,
    )
  ) {
    return (
      '**Change of school / course after apply**\n\n' +
      'The portal follows the record your **current** public institution uploaded.\n' +
      '1. Ask the new (and old) campus NELFUND desk to update the student verification record.\n' +
      `2. Sign in at ${LOGIN} and read the institution shown on your profile.\n` +
      `3. If it stays wrong: ${ESUPPORT} with a screenshot.\n` +
      'I cannot switch your school from this chat.'
    )
  }

  if (/vocational|skills?\s*school|innovation\s*enterprise|ieivs|monotechnic/i.test(t)) {
    return (
      '**Vocational / skills institutions**\n\n' +
      'Official coverage is for eligible students in **public** tertiary institutions listed on the portal (including some public vocational routes if the school is on the official list).\n' +
      `Confirm whether **your** school appears on ${PORTAL}. If it is missing, that is a school-upload / listing issue — campus desk, then ${ESUPPORT}.\n` +
      'I will not invent extra school categories.'
    )
  }

  if (/passport\s*(photo|photograph)|profile\s*picture|upload\s*photo/i.test(t)) {
    return (
      '**Passport photograph**\n\n' +
      `Use a recent, clear photo of **you** if the portal asks for one. Upload only on ${PORTAL}.\n` +
      'Do not send the file to an agent or WhatsApp number.\n' +
      `Upload fails: retry on another network, then ${ESUPPORT} with the exact error text.`
    )
  }

  if (/part[\s-]*time|sandwich|distance\s*learn|weekend\s*programme/i.test(t) && /eligib|apply|fit\s*apply|can\s*i/i.test(t)) {
    return (
      '**Part-time / sandwich / distance**\n\n' +
      'Mode of study must match what the official portal accepts for the record your school uploaded.\n' +
      `Confirm on ${PORTAL} — I will not invent extra study-mode categories.\n` +
      'Public-institution + uploaded record still come first.'
    )
  }

  if (/i\s*meant|loan\s*and\s*upkeep|apply\s*(for\s*)?(the\s*)?(loan|upkeep).{0,20}(and|&)\s*(loan|upkeep)/i.test(t)) {
    return (
      '**Apply for institutional charges and upkeep**\n\n' +
      `1. Open ${PORTAL} and sign in (${LOGIN}).\n` +
      '2. Request the student loan when the official window is open.\n' +
      '3. Tick **institutional charges** (goes to the school) and **upkeep** (optional, goes to you) in the **same** session.\n' +
      `4. Upload only what the form asks. Stuck: ${ESUPPORT}.\n` +
      'I will not invent fee or stipend figures.'
    )
  }

  return null
}
