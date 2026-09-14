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
