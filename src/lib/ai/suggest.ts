import type { IntentId } from './types'
import { suggest as suggestFromNext } from './suggestedNext'

/** Max 2 next-question chips per reply so students can tap through NELFUND. */
export function suggest(
  intent: IntentId | string | null | undefined,
  userText?: string | null,
): [string, string] {
  const chips = suggestFromNext(intent, userText)
  const a = chips[0] || 'How does this NELFUND thing work?'
  const b = chips[1] || 'How do I apply for NELFUND?'
  return [a, b]
}
