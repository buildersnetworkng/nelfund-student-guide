import type { ConversationTurn, IntentId, IntentResult } from './types'

const SCHOOL_HINTS = [
  'unilag',
  'lasu',
  'oou',
  'yabatech',
  'unilorin',
  'uniben',
  'oau',
  'unijos',
  'noun',
  'nou',
  'futo',
  'futa',
  'abu',
  'ui',
  'university of lagos',
  'lagos state',
  'olabisi',
]

export function lastUserIntent(history?: ConversationTurn[]): IntentId | null {
  if (!history?.length) return null
  for (let i = history.length - 1; i >= 0; i--) {
    const turn = history[i]
    if (turn.intent && turn.intent !== 'unknown') return turn.intent
  }
  return null
}

export function expandWithContext(question: string, history?: ConversationTurn[]): string {
  const raw = (question || '').trim()
  if (!history?.length) return raw
  if (raw.length >= 80) return raw
  if (raw.length < 48) {
    const priorUsers = history
      .filter((h) => h.role === 'user')
      .map((h) => h.text.trim())
      .filter(Boolean)
    if (!priorUsers.length) return raw
    const last = priorUsers[priorUsers.length - 1]
    if (!last || last === raw) return raw
    return `${last}\n${raw}`
  }
  return raw
}
