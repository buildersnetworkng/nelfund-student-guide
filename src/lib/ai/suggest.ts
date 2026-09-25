import type { IntentId } from './types'
import { suggest as suggestFromNext } from './suggestedNext'
import { suggestHourly173 } from './suggestHourly173'
import { suggestHourly174 } from './suggestHourly174'
import { suggestHourly175 } from './suggestHourly175'
import { suggestHourly176 } from './suggestHourly176'
import { suggestHourly177 } from './suggestHourly177'
import { suggestHourly178 } from './suggestHourly178'
import { suggestHourly179 } from './suggestHourly179'
import { suggestHourly180 } from './suggestHourly180'

/** Max 2 next-question chips per reply so students can tap through NELFUND. */
export function suggest(
  intent: IntentId | string | null | undefined,
  userText?: string | null,
): [string, string] {
  const extra180 = suggestHourly180(userText)
  if (extra180) return extra180
  const extra179 = suggestHourly179(userText)
  if (extra179) return extra179
  const extra178 = suggestHourly178(userText)
  if (extra178) return extra178
  const extra177 = suggestHourly177(userText)
  if (extra177) return extra177
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
