import type { IntentId, EvidenceItem, IntentResult } from './types'

const OFFICIAL_SITE = 'https://nelf.gov.ng/'
const OFFICIAL_PORTAL = 'https://portal.nelf.gov.ng/'
const OFFICIAL_LOGIN = 'https://portal.nelf.gov.ng/auth/login'

function dedupeActions(actions: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const a of actions) {
    const k = a.trim().toLowerCase()
    if (!k || seen.has(k)) continue
    seen.add(k)
    out.push(a.trim())
  }
  return out
}

/** Build diagnostic answer text; nextActions always empty (no What-to-do-next UI). */
export function buildDiagnosticAnswer(
  intent: IntentId,
  intentMeta: IntentResult,
  evidence: EvidenceItem[],
  tips: string[],
  steps: string[],
  stillStuck: string | null,
  avoid: string[],
  clarifyingQuestions: string[],
  answer: string,
  whatThisMeans: string | null,
): { answer: string; whatThisMeans: string | null; nextActions: string[]; clarifyingQuestions: string[] } {
  void intent
  void intentMeta
  void evidence
  void tips
  void steps
  void stillStuck
  void avoid
  void OFFICIAL_SITE
  void OFFICIAL_PORTAL
  void OFFICIAL_LOGIN
  void dedupeActions
  return {
    answer: answer.trim(),
    whatThisMeans,
    nextActions: [],
    clarifyingQuestions: clarifyingQuestions.slice(0, 2),
  }
}
