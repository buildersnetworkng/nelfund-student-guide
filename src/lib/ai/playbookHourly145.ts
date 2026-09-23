const PORTAL = 'https://portal.nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Angle-specific pending replies. Same intent, different wording. No invented dates. */
export function playbookHourly145(intent: string, t: string): string | null {
  if (intent !== 'pending-application') return null
  const q = t || ''

  if (/mates?\s*(don|have)|dem\s*don\s*pay\s*(my\s*)?(mates?|class|others)|class\s*(don|have)\s*(collect|receive)|everybody\s*don\s*collect/i.test(q)) {
    return `**Mates collecting first does not mean your file was declined.**\n\n1. Open ${PORTAL} and copy the exact status word on your own dashboard. This chat cannot see batches.\n2. School charges go to the institution. Classmates can get an alert while your line is still waiting.\n3. Do not open a second account because others collected.\n4. I will not invent a batch list. Same word for a long time: campus NELFUND desk, then ${ESUPPORT}.`
  }

  if (/dashboard\s*(still\s*)?(0|zero|empty)|total\s*loans?\s*(is\s*|still\s*)?(0|zero)|approved\s*(but|and)\s*(no|never|not)\s*(money|alert)/i.test(q)) {
    return `**Approved or a zero dashboard is still a wait on the same file.**\n\n1. Sign in and copy the exact sentence from ${PORTAL}. I cannot see your bank from here.\n2. Institutional charges go to the school first. A zero personal balance can sit beside a school line that already moved.\n3. Upkeep only if you ticked it in the same session.\n4. I will not invent a pay date. Long same-word wait: campus desk, then ${ESUPPORT}.`
  }

  if (/\bbatch\b|which\s*batch|next\s*batch/i.test(q)) {
    return `**Batch talk is not an official pay date in this chat.**\n\n1. Use the status word on ${PORTAL}, not a WhatsApp batch number.\n2. I will not invent batch 1, 2 or 3 lists.\n3. If the portal word has not changed for a long time, ask the campus NELFUND desk, then ${ESUPPORT}.`
  }

  if (/school\s*(don|has)\s*(collect|receive)|una\s*don\s*pay\s*(my\s*)?school|fees?\s*(don|has)\s*(enter|go)\s*school/i.test(q)) {
    return `**School charges and your upkeep are separate lines.**\n\n1. Institutional charges go to the school. That can finish while you still have no personal SMS.\n2. Confirm both lines on ${PORTAL}.\n3. Upkeep only if you ticked it in the same session.\n4. I will not invent when your own alert will land. Long wait: campus desk, then ${ESUPPORT}.`
  }

  if (/money\s*never|never\s*enter|no\s*alert|kobo\s*never/i.test(q)) {
    return `**Money never enter is still the same pending file.** Do not create another account.\n\n1. Copy the exact status word on ${PORTAL}.\n2. No personal alert can happen even after the school is paid.\n3. I will not invent a credit date. Long same word: campus desk, then ${ESUPPORT}.`
  }

  if (/how\s*far|wetin\s*(dey\s*)?(happen|hold)|any\s*(news|update)/i.test(q)) {
    return `**How far my own starts on the portal, not in this chat.**\n\n1. Sign in at ${PORTAL} and copy the exact status word.\n2. Do not open a second account to check faster.\n3. Same word for weeks can happen while the school record or a payment batch moves.\n4. Long wait: campus NELFUND desk, then ${ESUPPORT}.`
  }

  if (/pending|processing|under\s*review|i\s*apply\s*(finish|since)|submitted/i.test(q)) {
    return `**Pending / still processing is a status word, not a pay date.**\n\n1. Copy the exact sentence from ${PORTAL}.\n2. Ask the campus desk if your record is uploaded for this session.\n3. No SMS does not mean declined.\n4. I will not invent how many days it takes. Long wait: ${ESUPPORT}.`
  }

  return null
}
