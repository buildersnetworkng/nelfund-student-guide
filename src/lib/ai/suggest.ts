import type { IntentId } from './types'
import { suggest as suggestFromNext } from './suggestedNext'
import { suggestHourly173 } from './suggestHourly173'
import { suggestHourly174 } from './suggestHourly174'
import { suggestHourly175 } from './suggestHourly175'
import { suggestHourly176 } from './suggestHourly176'

/** Max 2 next-question chips per reply so students can tap through NELFUND. */
export function suggest(
  intent: IntentId | string | null | undefined,
  userText?: string | null,
): [string, string] {
  const extra176 = suggestHourly176(userText)
  if (extra176) return extra176
  const extra175 = suggestHourly175(userText)
  if (extra175) return extra175
  const extra174 = suggestHourly174(userText)
  if (extra174) return extra174
  const extra = suggestHourly173(userText)
  if (extra) return extra
  const chips = suggestFromNext(intent, userText)
  const a = chips[0] || 'How does this NELFUND thing work?'
  const b = chips[1] || 'How do I apply for NELFUND?'
  return [a, b]
}
