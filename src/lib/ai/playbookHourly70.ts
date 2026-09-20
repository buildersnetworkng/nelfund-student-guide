const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hour-70 playbook. Answers differ by angle. No invented dates. No long dashes. */
export function playbookHourly70(intent: string, userText: string): string | null {
  const t = userText || ''

  if (/how\s*far\s*(my|una|the)\s*(own|app|application|loan)|my\s*application\s*is\s*pending/i.test(t)) {
    return `**How far your own:** I cannot open your file from this chat.\n\n1. Sign in at ${PORTAL} and copy the exact status word (pending, submitted, under review).\n2. That word is the truth, not WhatsApp rumours.\n3. Same word for weeks: campus NELFUND desk, then ${ESUPPORT}.`
  }

  if (/money\s*never\s*enter|my\s*own\s*(never|no)\s*(drop|enter)|approved\s*but\s*(no|zero|never)\s*(money|alert)|e\s*never\s*reflect/i.test(t)) {
    return `**Money never enter:** no alert is common. I will not invent a pay day.\n\n1. School charges go to the school first, not always to your phone.\n2. Check the exact word on ${PORTAL}.\n3. Confirm the bank on your profile matches NIN / BVN.\n4. Still nothing for a long time: campus desk, then ${ESUPPORT}.`
  }

  if (/dem\s*pay\s*(others|people|mates)|others\s*(don|have)\s*(collect|receive)/i.test(t)) {
    return `**Others collected, you still wait:** batches are not one day for every student.\n\n1. Mates seeing money does not mean your file is rejected.\n2. Open ${PORTAL} and copy your own status word.\n3. Same word for weeks: campus NELFUND desk, then ${ESUPPORT}.`
  }

  if (/why\s*(my|una)\s*own\s*dey\s*(delay|sleep)|when\s*(will|go)\s*(my\s*)?(application|file)\s*(leave|comot|move)\s*pending|processing\s*since/i.test(t)) {
    return `**Why the delay:** this chat cannot speed the file or name a date.\n\n1. Copy the exact status on ${PORTAL}.\n2. Do not open a second account while you wait.\n3. Weeks on the same word: campus desk, then ${ESUPPORT}. Official site: ${SITE}.`
  }

  if (/status\s*(still|dey)\s*(processing|in\s*progress|submitted)|still\s*on\s*(submitted|processing|pending)|e\s*dey\s*say\s*(in\s*progress|processing|submitted)|waiting\s*(for\s*)?(disburse|verification|approval)|loan\s*approved\s*(waiting|awaiting)/i.test(t)) {
    return `**Still processing / submitted:** that word lives on ${PORTAL}.\n\n1. Write down the exact phrase you see.\n2. Submitted is not the same as declined.\n3. Approved waiting disbursement still needs the school or bank step. Confirm there, then ${ESUPPORT} if it stays frozen.`
  }

  if (intent === 'jamb-verification') {
    return `**Invalid JAMB / verification failed:** type the number exactly as on the admission letter. Name and date of birth must match NIN. Still failing: campus desk, then ${ESUPPORT}.`
  }

  if (intent === 'portal-login' && /email|registered\s*last\s*year|cannot\s*create/i.test(t)) {
    return `**Email already used / you registered last year.** Sign in at ${SITE}. Do not create a new account with another mail. Forgot password: reset on ${SITE}, then ${ESUPPORT} if it still blocks you.`
  }

  if (intent === 'school-not-found') {
    return `**School not showing:** search the full official name on ${PORTAL}. Ask ICT / Registry if the record is uploaded. Still missing: ${ESUPPORT}.`
  }

  return null
}
