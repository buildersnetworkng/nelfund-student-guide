const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hour-69 playbook. Answers differ by angle. No invented dates. No long dashes. */
export function playbookHourly69(intent: string, userText: string): string | null {
  const t = userText || ''

  if (/dashboard\s*(still\s*)?(show(ing)?|dey)\s*(0|zero|nil)/i.test(t)) {
    return `**Dashboard showing zero** is still a pending file from this chat. I cannot see your numbers.\n\n1. Open ${PORTAL} and copy the exact status word, not only the zeros.\n2. Zero on dashboard is not the same as declined.\n3. Same zeros for weeks: campus NELFUND desk, then ${ESUPPORT}.`
  }

  if (/mates?\s*(don|have)\s*(collect|receive)|school\s*don\s*collect|they\s*paid\s*my\s*school\s*but/i.test(t)) {
    return `**Mates collected / school paid, you never:** batches are not the same day for everyone.\n\n1. School charges go to the school first. Your mates seeing money does not prove your file is declined.\n2. Check the exact word on ${PORTAL}.\n3. Upkeep can land later than school charges, and only if you ticked it.\n4. Same word for a long time: campus desk, then ${ESUPPORT}.`
  }

  if (/has\s*nelfund\s*released|have\s*they\s*paid|when\s*go\s*my\s*(own|money)\s*enter|nothing\s*don\s*show\s*(for|on)\s*(my\s*)?(account|bank)|no\s*alert\s*since/i.test(t)) {
    return `**Money never enter / no alert:** I will not invent a pay date.\n\n1. Only ${PORTAL} shows whether your file moved.\n2. No SMS is common even after the school is paid.\n3. Confirm the bank on your profile is yours and matches NIN / BVN.\n4. Still nothing for weeks: campus NELFUND desk, then ${ESUPPORT}.`
  }

  if (intent === 'pending-application' && /under\s*review|approval\s*dey\s*sleep|status\s*no\s*change|e\s*still\s*dey\s*review|file\s*still\s*under/i.test(t)) {
    return `**Still under review:** that word lives on ${PORTAL}, not in this chat.\n\n1. Copy the exact status.\n2. Do not open a second account while you wait.\n3. Weeks on the same word: campus NELFUND desk, then ${ESUPPORT}.`
  }

  if (/as\s*of\s*today|dem\s*still\s*dey\s*accept|window\s*don\s*close\s*or\s*not|when\s*be\s*the\s*deadline|is\s*2026\s*(loan|upkeep)\s*open|loan\s*application\s*open\s*as\s*of/i.test(t)) {
    return `**Open or not as of today:** account creation can be open while loan and upkeep for 2026/2027 is not confirmed.\n\nCheck ${PORTAL} and ${SITE} only. I will not invent a deadline from social media.`
  }

  if (intent === 'portal-login' && /email\s*(already|used|exist)|registered\s*last\s*year|cannot\s*create\s*account|old\s*account|forgot\s*last\s*year/i.test(t)) {
    return `**That email already exists.** Sign in at ${SITE}. Do not create a new account with another mail.\n\nForgot last year password: reset on ${SITE}, then ${ESUPPORT} if it still blocks you.`
  }

  if (intent === 'jamb-verification') {
    return `**JAMB number rejected / verification failed:** type it exactly as on the admission letter. Name and date of birth must match NIN. Direct Entry still needs a real JAMB registration. Still failing: campus desk, then ${ESUPPORT}.`
  }

  if (intent === 'school-not-found') {
    return `**School missing on the portal:** search the full official name on ${PORTAL}. Ask ICT / Registry if the record is uploaded. Poly and COE names are often abbreviated wrong. Still missing: ${ESUPPORT}.`
  }

  if (
    /^(help|assist|guide)\s*(me)?|i\s*no\s*know\s*where\s*to\s*start|wetin\s*i\s*suppose\s*do\s*first|point\s*me\s*where\s*to\s*start|confused\s*about\s*nelfund/i.test(
      t,
    )
  ) {
    return `I cover **NELFUND** only.\n\nTell me which one:\n- how to apply\n- pending / money never enter\n- JAMB or email login\n- school not on the list\n- repayment\n\nOfficial: ${SITE} and ${PORTAL}.`
  }

  return null
}
