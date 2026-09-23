import type { IntentId } from './types'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Angle-specific pending answers so paraphrases do not share one dump. */
export function playbookHourly134(intent: IntentId, userText: string): string | null {
  const t = userText || ''
  if (intent !== 'pending-application') return null

  if (/status\s*(na|is|shows?|dey\s*show)\s*verified|verified\s*(but|and)\s*(no|never|not)|verified\s*(no|never)\s*disburse/i.test(t)) {
    return `Verified on the portal means the file passed the first checks. It is not the same as Disbursed.\n\n1. Final approval and payment still wait for your school to confirm and upload your data.\n2. When that finishes, the word can change to Disbursed after the school fees are processed.\n3. Open ${PORTAL} and copy the exact word. I cannot see your file from this chat.\n4. I will not invent a pay date. Ask the campus NELFUND desk if the upload is done, then ${ESUPPORT}.`
  }

  if (/school\s*(never|no|not|don\s*never)\s*(upload|confirm)\s*(my\s*)?(data|record|file)|institution\s*(never|no)\s*upload/i.test(t)) {
    return `If the school has not uploaded your data, the file stays waiting even after you submitted.\n\n1. Take admission letter and JAMB number to ICT / Registry / campus NELFUND desk.\n2. Ask them to confirm the session upload, then retry ${PORTAL}.\n3. Institutional charges only move after that school step.\n4. Still the same word after they confirm: ${ESUPPORT}.`
  }

  if (/how\s*far\s*my\s*own|my\s*own\s*how\s*far/i.test(t)) {
    return `How far my own starts on the portal. I cannot open your file from this chat.\n\n1. Sign in at ${SITE} then check ${PORTAL}. Copy the exact status word.\n2. Do not create a second account to check faster.\n3. School paid is not the same as money in your bank.\n4. Same word for a long time: campus desk, then ${ESUPPORT}.`
  }

  if (/my\s*application\s*(is|dey)\s*pending|application\s*still\s*(dey|is)\s*pending/i.test(t)) {
    return `Pending means the file is still waiting. It is not a rejection and not a pay date.\n\n1. Open ${PORTAL} and copy the exact sentence, not a WhatsApp rumour.\n2. School charges go to the institution first. No SMS does not mean declined.\n3. I will not invent when Pending ends.\n4. Same word for weeks: campus NELFUND desk, then ${ESUPPORT}.`
  }

  if (/status\s*still\s*processing|still\s*processing|e\s*still\s*dey\s*process/i.test(t)) {
    return `Status still processing is a wait word, not a new apply.\n\n1. Stay on the same login. Do not open another account to force processing.\n2. Copy the exact sentence from ${PORTAL}.\n3. Ask the campus desk if your record is uploaded.\n4. I will not invent how many days processing lasts. Long same-word wait: ${ESUPPORT}.`
  }

  if (/money\s*never\s*enter|e\s*never\s*show\s*for\s*(my\s*)?(account|bank)|waiting\s*for\s*disburse/i.test(t)) {
    return `Money never enter your account is still a wait on the same file.\n\n1. Institutional charges go to the school, so your bank can stay empty even after the school is paid.\n2. Upkeep only if you ticked it in the same session, and only into the bank on your profile.\n3. Copy the exact status word from ${PORTAL}. I will not invent a pay date.\n4. Long same-word wait: campus desk, then ${ESUPPORT}.`
  }

  if (/final\s*approval\s*(never|no|not)\s*(come|show)/i.test(t)) {
    return `Final approval waits on school confirmation after the first checks.\n\n1. If the portal already says Verified, the next official word is not automatic.\n2. Ask the campus NELFUND desk to upload or confirm your data for this session.\n3. Recheck ${PORTAL}. I will not invent when Disbursed appears.\n4. Still stuck after the school confirms: ${ESUPPORT}.`
  }

  return null
}
