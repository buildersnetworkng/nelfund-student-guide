const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'
const FAQ = 'https://nelf.gov.ng/faq'

/** Hour-57 playbook extras for leftover other: NIN/BVN, matric, poly, repay, unofficial apps. */
export function playbookHourly57(intent: string, userText: string): string | null {
  const t = userText || ''

  if (intent === 'missing-information' && /nin|bvn/i.test(t)) {
    return `**NIN or BVN wahala is a records mismatch, not a hidden fee.**\n\n1. Type NIN and BVN exactly as they appear on NIMC / your bank.\n2. Name and date of birth must match JAMB and school records.\n3. Do not pay anyone to fix NIN or BVN.\n4. Retry ${PORTAL}. Still failing after you confirm the numbers: ${ESUPPORT}.`
  }

  if (intent === 'missing-information' && /matric|not\s*on\s*(the\s*)?list|institution\s*verif|record/i.test(t)) {
    return `**No matric, or name not on the school list, is a school-upload problem.**\n\n1. Ask ICT / Registry / campus NELFUND desk to confirm your record is on the NELFUND list this cycle.\n2. Retry ${PORTAL} after they confirm.\n3. I will not invent a matric workaround.\n4. Still missing after school confirms: ${ESUPPORT}.`
  }

  if (intent === 'eligibility' && /\b(nd|hnd|nce|poly|polytechnic|college)\b/i.test(t)) {
    return `**ND, HND, NCE, and public polytechnic or college of education students can usually apply if they are full-time in a participating public school.**\n\n1. Confirm your school appears on ${PORTAL}.\n2. Part-time, sandwich, and private schools are commonly not eligible. Check the live form and ${FAQ}.\n3. I will not invent extra school types.`
  }

  if (intent === 'repayment' && /interest|how\s*(many|long)|repay|free/i.test(t)) {
    return `**NELFUND is an interest-free student loan. Repayment starts after NYSC or as the live portal / FAQ states for your cycle.**\n\n1. Read ${FAQ} and your dashboard on ${PORTAL}.\n2. I will not invent a percentage, jail rumour, or exact month.\n3. Ignore WhatsApp repayment agents.`
  }

  if (intent === 'official-sources' && /whats?app|telegram|instagram|group/i.test(t)) {
    return `**There is no official NELFUND WhatsApp or Telegram group that can approve your loan.**\n\n1. Use ${SITE} and ${PORTAL} only.\n2. Support ticket: ${ESUPPORT}.\n3. Do not send OTP, NIN, or BVN to any group admin.`
  }

  if (intent === 'pending-application' && /alert|my\s*own\s*never|money\s*no\s*dey|payout/i.test(t)) {
    return `**No alert does not mean declined. I cannot see your file from this chat.**\n\n1. Open ${PORTAL} and copy the exact status word.\n2. School charges go to the school. Upkeep, if you ticked it, goes to your bank later.\n3. I will not invent when money will enter.\n4. Same word for a long time: campus NELFUND desk, then ${ESUPPORT}.`
  }

  if (intent === 'how-to-apply' && /register|create\s*account|sign\s*up/i.test(t)) {
    return `**Account creation is how you start. That is not the same as loan / upkeep being open.**\n\n1. New students: create an account on ${PORTAL} with NIN, BVN, and JAMB.\n2. If you registered last year, log in. Do not create a second account.\n3. Confirm live loan / upkeep dates only on ${PORTAL} and ${SITE}.`
  }

  return null
}
