const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Extra pending-status answers for leftover unknown phrasings. */
export function playbookPendingExtras(t: string): string | null {
  if (/\b(declin(ed|e)|reject(ed)?|unsuccessful|not\s*approv)/i.test(t)) {
    return `**Declined / unsuccessful is a status word, not a new application.**\n\n1. Open ${PORTAL} and copy the **exact** sentence (reason if shown).\n2. Do not open a second account. Sign in at ${SITE} if you already have one.\n3. Common next checks: JAMB number format, school record uploaded, public-institution eligibility.\n4. Ask the campus NELFUND desk if the school must re-upload. Then ticket ${ESUPPORT} with that exact sentence and a screenshot.\n\nI cannot reverse a decision from this chat.`
  }
  if (/(no|never|not|no\s*dey)\s*(see|show|find)\s*(my\s*)?(application|loan|file)|application\s*(disappear|missing|no\s*show)/i.test(t)) {
    return `**If the loan file is not showing**\n\n1. Sign **in** at ${SITE} with the same email you used to apply. Do not create a second account.\n2. Confirm you are on ${PORTAL} after login, not a random WhatsApp link.\n3. If the dashboard is empty, the school may not have uploaded your record yet. Ask the campus NELFUND desk.\n4. Still empty after that? Ticket ${ESUPPORT} with name, school, and the email on the account.`
  }
  if (/credit\s*alert|no\s*credit|alert\s*(no|never)\s*(enter|drop|come)/i.test(t)) {
    return `**No credit alert yet** is still a wait question.\n\n1. Institutional charges go to the **school**, so you may see no personal alert even after school fees move.\n2. Upkeep (only if you ticked it in the same session) goes to the bank account on your profile.\n3. Open ${PORTAL} and copy the exact status word. I will not invent a pay date.\n4. Long same-word wait: ticket ${ESUPPORT}.`
  }
  if (/already\s*paid\s*(my\s*)?(school\s*)?fee|i\s*(don|have)\s*pay\s*(school\s*)?fee|self[\s-]*pay|paid\s*from\s*pocket/i.test(t)) {
    return `**You already paid school fees yourself.** That is not the same as a pending application.\n\n1. Institutional charges, when NELFUND pays them, go to the **school**, not your pocket.\n2. Some schools handle a refund or balance internally after NELFUND remits. Ask the campus bursary / NELFUND desk. I will not invent a refund rule.\n3. Confirm on ${PORTAL} whether the institutional-charges line is Approved or still Pending.\n4. Keep receipts. Ticket ${ESUPPORT} only after the school desk has checked the remittance.`
  }
  if (/when\s*(will|go)\s*(they|dem|una|nelfund)?\s*(pay|send|disburse)|how\s*long\s*(does|go)\s*(approval|disburse|pay)|pay\s*date/i.test(t)) {
    return `**I will not invent a pay date.**\n\n1. Open ${PORTAL} and copy the exact status word.\n2. School fees go to the institution; upkeep (if you applied for it in the same session) goes to your bank.\n3. Same-word Pending for a long time: campus NELFUND desk, then ${ESUPPORT}.\n4. Live window questions (is it still open) are separate from payout wait.`
  }
  if (/e\s*no\s*(move|change)|status\s*(still|dey)\s*(the\s*same|same|pending)|nothing\s*(don|has)\s*happen|no\s*update|application\s*(still|dey)\s*(there|pending)/i.test(t)) {
    return `**Status not moving is still a wait, not a new apply.**\n\n1. Open ${PORTAL} and copy the exact status word. Same word for weeks is common while the school record or batch is processed.\n2. Institutional charges go to the school first. No personal alert does not mean the file is dead.\n3. Ask the campus NELFUND desk if your record is uploaded.\n4. I will not invent a batch or pay date. Long same-word wait: ticket ${ESUPPORT} with name, school, and that status word.`
  }
  if (/still\s*(waiting|dey\s*wait)|i\s*dey\s*wait|waiting\s*(for\s*)?(approval|payment|upkeep|money)|dem\s*never\s*(pay|approve)\s*me/i.test(t)) {
    return `**Still waiting is a status question, not a new apply.**\n\n1. Open ${PORTAL} and copy the exact status word (Pending, Under review, Approved, Declined).\n2. Institutional charges go to the **school first**. No personal alert does not mean the file is dead.\n3. Upkeep only if you ticked it in the same session, and it can arrive later.\n4. I will not invent a pay date. Long same-word wait: campus NELFUND desk, then ${ESUPPORT}.`
  }
  if (/approv(ed|al).{0,40}(no|never|not|nothing).{0,24}(money|alert|upkeep|pay|enter|drop)|successful.{0,24}(no|never).{0,16}(money|alert)/i.test(t)) {
    return `**Approved on the portal is not the same as money in your bank.**\n\n1. Open ${PORTAL} and note whether **institutional charges** show paid to the school.\n2. School fees go to the institution. Upkeep (only if you applied for it) can land later.\n3. Confirm the profile bank account is a real bank, not only a wallet.\n4. I will not invent a pay date. Same word for a long time: ticket ${ESUPPORT}.`
  }
  if (/how\s*far\s*(my\s*)?(loan|application|nelfund|am)|check\s*(my\s*)?(application|loan|status)|track\s*(my\s*)?(application|loan)/i.test(t)) {
    return `**How far / check my loan** starts on the portal, not in this chat.\n\n1. Sign in at ${SITE} then open ${PORTAL}. Copy the exact status word.\n2. Do not create a second account to “check faster”.\n3. School paid ≠ upkeep paid. Ask the campus desk if the school record is uploaded.\n4. I cannot see your file. Long same-word wait: ${ESUPPORT}.`
  }
  if (/\bbatch\b|una\s*don\s*pay\s*(my\s*)?school|school\s*(don|has)\s*(collect|receive)|dem\s*don\s*pay\s*(the\s*)?school|school\s*fees?\s*(don|has)\s*(enter|pay|paid)/i.test(t)) {
    return `**Batch / school already paid** is still your portal status, not a public list I can invent.\n\n1. Only ${PORTAL} shows *your* file. There is no official public "batch 3 paid" sheet I can quote here.\n2. If the school already received institutional charges, upkeep (only if you ticked it) can still be later.\n3. Copy the exact status word from the portal.\n4. Same word for a long time: campus desk, then ${ESUPPORT}. I will not invent a pay date.`
  }
  if (/^(how\s*far|how\s*far\s*na|how\s*far\s*now|abeg\s*how\s*far)[.!? ]*$/i.test(t) || /money\s*(never|no)\s*(enter|drop|show)|e\s*never\s*(enter|drop)|never\s*enter/i.test(t)) {
    return `**How far / money never enter** is a pending-status question.\n\n1. Open ${PORTAL} and copy the **exact** status word. I cannot see your file from this chat.\n2. School fees go to the **institution**. You can wait weeks with no personal alert even after the school is paid.\n3. Upkeep only lands in *your* bank if you ticked it in the same session, and it can come later than school fees.\n4. I will not invent a pay date or closing date. Same word for a long time: campus NELFUND desk, then ${ESUPPORT}.`
  }
  if (/pending\s*since|under\s*review\s*since|e\s*dey\s*pending|still\s*under\s*review|i\s*apply\s*(last|since)|disburse/i.test(t)) {
    return `**Long pending / under review is still a wait.**\n\n1. Copy the exact status sentence from ${PORTAL}.\n2. Ask the campus NELFUND desk whether your student record is uploaded for this session.\n3. Institutional charges and upkeep are separate lines. One can move while the other stays.\n4. No invented SLA. Ticket ${ESUPPORT} with name, school, and that exact sentence if the word has not changed for a long time.`
  }
  if (/dashboard\s*(empty|blank|no\s*dey|nothing)|i\s*no\s*see\s*(anything|loan)\s*(for|on)\s*(dashboard|portal)/i.test(t)) {
    return `**Empty dashboard is usually a record or login problem, not a new apply.**\n\n1. Sign in at ${SITE} with the **same** email. Do not create a second account.\n2. Confirm you land on ${PORTAL}, not a forwarded WhatsApp link.\n3. Ask the campus NELFUND desk if your student record is uploaded for this session.\n4. Still blank: ticket ${ESUPPORT} with name, school, and that email. I cannot see your file from this chat.`
  }
  if (/dem\s*never\s*(call|message|text|sms)|nobody\s*(don|has)\s*(call|contact)|no\s*(mail|sms|call)\s*from\s*nelfund|una\s*never\s*reach\s*me/i.test(t)) {
    return `**No call or SMS from NELFUND does not mean the file is dead.**\n\n1. Status lives on ${PORTAL}. Copy the exact word there. Do not wait for a phone call.\n2. School fees go to the institution first. You may get no personal alert.\n3. I will not invent a call or pay date.\n4. Long same-word wait: campus desk, then ${ESUPPORT}.`
  }
  if (/^(any\s*update|update\s*abeg|una\s*update|new\s*update|wetin\s*be\s*update)[.!? ]*$/i.test(t)) {
    return `**Any update?** I cannot see your file from this chat.\n\n1. Open ${PORTAL} and copy the exact status word.\n2. Same word for weeks is common while the school record or a batch is processed.\n3. I will not invent a batch list or pay date.\n4. Long same-word wait: campus NELFUND desk, then ${ESUPPORT}.`
  }
  if (/i\s*no\s*see\s*(my\s*)?(upkeep|stipend|allowance)|upkeep\s*(never|no)\s*(land|enter|drop)/i.test(t)) {
    return `**No upkeep yet is still a wait question.**\n\n1. Upkeep only if you ticked it in the **same** session as institutional charges.\n2. It can land later than school fees, and only into the bank account on your profile (not a wallet-only account).\n3. Copy the exact status word from ${PORTAL}. I will not invent a pay date.\n4. Long same-word wait: ${ESUPPORT}.`
  }
  if (/appeal|i\s*wan\s*appeal|contest\s*(the\s*)?(decision|decline)|review\s*(my\s*)?(decline|rejection)/i.test(t)) {
    return `**Appeal / review a decline** is not a second application.\n\n1. Copy the exact declined sentence from ${PORTAL}.\n2. Stay on the same login at ${SITE}. Do not create another account to “appeal faster”.\n3. Fixable checks: JAMB format, school record uploaded, public-institution eligibility.\n4. Ticket ${ESUPPORT} with that exact sentence and a screenshot. I cannot reverse a decision from this chat.`
  }
  if (/screenshot|i\s*(send|don\s*send)\s*(pic|picture|photo|image)|see\s*(the\s*)?(pic|photo|image)|look\s*(this|dis)\s*(pic|photo)/i.test(t)) {
    return `**A screenshot is useful only if I know the exact status word.**\n\n1. Type the sentence on ${PORTAL} (Pending, Under review, Approved, Declined, invalid JAMB, missing school).\n2. Do not send BVN, NIN, or full account numbers in chat.\n3. School fees go to the institution; upkeep (if ticked) can land later.\n4. Long same-word wait: campus desk, then ${ESUPPORT}.`
  }
  return null
}
