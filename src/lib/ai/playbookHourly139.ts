import type { IntentId } from './types'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Distinct pending answers by angle so paraphrases do not share one dump. */
export function playbookHourly139(intent: IntentId, userText: string): string | null {
  const t = userText || ''
  if (intent !== 'pending-application') return null

  if (/how\s*far\s*my\s*own|how\s*far\s*na\s*this\s*my\s*application|wetin\s*dey\s*happen\s*to\s*my\s*own/i.test(t)) {
    return `How far your own starts on the portal, not from this chat.\n\n1. Sign in at ${SITE} then open ${PORTAL} and copy the exact status word.\n2. I cannot see your file from here.\n3. School charges go to the school first.\n4. Same word for a long time: campus NELFUND desk, then ${ESUPPORT}.`
  }

  if (/money\s*never\s*enter|kobo\s*never|una\s*never\s*credit|upkeep\s*never\s*enter|my\s*nelfund\s*never\s*pay/i.test(t)) {
    return `Money not in your bank is not the same as a declined file.\n\n1. Institutional charges go to the school, not your pocket.\n2. Upkeep only if you ticked it in that same session, into the bank on your profile.\n3. Recheck the exact word on ${PORTAL}.\n4. I will not invent a pay date. Still quiet after weeks: campus desk, then ${ESUPPORT}.`
  }

  if (/status\s*still\s*processing|tin\s*still\s*dey\s*pending|still\s*see\s*pending|e\s*never\s*leave\s*pending|application\s*hang\s*(for|on)\s*pending/i.test(t)) {
    return `Pending or processing means the same file is still waiting. It is not a new apply.\n\n1. Stay on the same login at ${PORTAL}. Copy the exact word.\n2. Ask the campus desk if this session record is uploaded.\n3. Do not open a second account because the word did not change.\n4. I will not invent when it flips. Long same-word wait: ${ESUPPORT}.`
  }

  if (/my\s*application\s*is\s*pending|i\s*don\s*apply\s*but\s*nothing|nothing\s*don\s*happen\s*to\s*my\s*(loan|file|own)|my\s*own\s*never\s*move|loan\s*dey\s*sleep|dem\s*forget\s*my\s*file/i.test(t)) {
    return `A pending application is still one file. Time passing is not a reset.\n\n1. Open ${PORTAL} and write down the exact status sentence.\n2. School charges can sit with the institution while your dashboard still says pending.\n3. Do not create another account to chase it.\n4. Same sentence for weeks: campus NELFUND desk, then ${ESUPPORT}.`
  }

  if (/dashboard\s*still\s*(zero|0)|school\s*fees\s*don\s*pay\s*but\s*i\s*never\s*see/i.test(t)) {
    return `Dashboard 0 or school already paid does not put cash in your account.\n\n1. Institutional charges go to the school.\n2. Your personal credit only if upkeep was ticked in that session.\n3. Confirm the exact word on ${PORTAL}.\n4. I will not invent figures. Still 0 after that check: campus desk, then ${ESUPPORT}.`
  }

  return null
}
