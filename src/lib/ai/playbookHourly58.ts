const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'
const FAQ = 'https://nelf.gov.ng/faq'

/** Hour-58 playbook extras for leftover other: level, amount, hostel, apply button, no JAMB. */
export function playbookHourly58(intent: string, userText: string): string | null {
  const t = userText || ''

  if (intent === 'eligibility' && /(100|200|300|400|500)\s*(l|level)|year\s*(one|two|three|four|1|2)|fresh|final\s*year/i.test(t)) {
    return `**Your level does not replace the live form.** Full-time students in a participating public school can usually apply in any undergraduate year if the school has uploaded the record.\n\n1. Confirm your school and session on ${PORTAL}.\n2. Final-year students still use the same portal. Already graduated people are usually not starting a new loan.\n3. I will not invent a year cut-off. Check ${FAQ} and the live form.`
  }

  if (intent === 'how-to-apply' && /how\s*much|loan\s*amount|maximum|wetin\s*(dem|they)\s*(go\s*)?(give|pay)/i.test(t)) {
    return `**I will not invent a naira figure.** Institutional charges go to the school. Upkeep, if you ticked it and the window is open, goes to your bank later.\n\n1. See the live amounts only on ${PORTAL} and ${FAQ}.\n2. Do not trust WhatsApp "they will pay X".\n3. Account creation open is not the same as loan / upkeep confirmed.`
  }

  if (intent === 'eligibility' && /hostel|accommodation|lodge/i.test(t)) {
    return `**Hostel is not a separate NELFUND product.** The loan covers institutional charges the school uploads, plus upkeep if you selected it and the window is open.\n\n1. Ask your bursary whether hostel sits inside institutional charges.\n2. Confirm on ${PORTAL}. I will not invent a hostel allowance.`
  }

  if (intent === 'how-to-apply' && /button|submit|grey|gray|portal\s*(no|not)|request\s*for\s*student\s*loan/i.test(t)) {
    return `**A grey apply button usually means the loan window is not confirmed open yet, or your profile / school record is incomplete.**\n\n1. Finish profile (NIN, BVN, JAMB) on ${PORTAL}.\n2. Account creation can be open while Request for Student Loan stays closed. Confirm dates only on ${PORTAL} and ${SITE}.\n3. Try another browser or network. Still stuck: ${ESUPPORT}.`
  }

  if (intent === 'jamb-verification' && /(no|without|never\s*get|no\s*dey)\s*jamb|i\s*(no|not)\s*get\s*jamb/i.test(t)) {
    return `**The portal normally needs a real JAMB registration (including Direct Entry).** I will not invent a no-JAMB shortcut.\n\n1. Use the number on your admission letter, no extra space.\n2. If you truly have no JAMB record, campus NELFUND desk first, then ${ESUPPORT}.\n3. Do not create a second account to dodge the error.`
  }

  if (intent === 'eligibility' && /foreign|international|not\s*a\s*nigerian|no\s*be\s*nigerian/i.test(t)) {
    return `**NELFUND is for eligible Nigerian students in participating public institutions.** Foreign or international students are generally outside the scheme.\n\n1. Confirm nationality and school on ${PORTAL} and ${FAQ}.\n2. I will not invent an exception.`
  }

  if (intent === 'eligibility' && /graduate|finish\s*school/i.test(t)) {
    return `**If you have already finished the programme, you are usually not starting a new student loan.** Repayment rules apply after school / NYSC as the portal and FAQ state.\n\n1. Check ${PORTAL} and ${FAQ}.\n2. I will not invent a graduate top-up.`
  }

  if (intent === 'pending-application' && /session\s*registration/i.test(t)) {
    return `**Session registration on the dashboard is not the same as money entering.**\n\n1. Open ${PORTAL} and copy the exact status word.\n2. School charges go to the school. Upkeep, if ticked, can come later.\n3. I will not invent a pay date. Long wait: campus desk, then ${ESUPPORT}.`
  }

  return null
}
