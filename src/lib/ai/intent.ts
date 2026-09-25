import type { IntentResult, ConversationTurn } from './types'
import { classifyIntent as classifyIntentInner, isPurposeAsk } from './intentClassify'
import { earlyIntent173 } from './intentHourly173'

/** Purpose / what-is. Must beat live-status and catch-all "why" routes. */
export const PURPOSE_RE =
  /what\s*(is|are)\s*(the\s+)?(purpose|aim|point|goal|meaning|reason)\s*(of\s+)?(this\s+)?(nelfund|loan|scheme)|what\s*is\s*(this\s+)?nelfund|what\s+does\s+(nelfund|it|this)\s+do|explain\s+(this\s+)?nelfund|help\s+(me\s+)?understand\s+(this\s+)?(nelfund|loan|scheme)|i\s+wan(t)?\s+(to\s+)?understand\s+(this\s+)?(nelfund|loan)|make\s+i\s+understand\s+.{0,24}nelfund|understand\s+(this\s+)?(nelfund|loan|scheme)|overview\s+of\s+nelfund|origin\s+of\s+nelfund|wetin\s*(be|mean)\s*(this\s+)?(nelfund|loan|scheme)|wetin\s+nelfund\s+(be|mean|dey\s+do|for)|nelfund\s+dey\s+do\s+wetin|about\s+(this\s+)?nelfund|tell\s*me\s*(about|everything|why).{0,40}(nelfund|this\s+loan|dis\s+loan)|why\s+(was|is|were|did|do|dem|they|una|we|fg|government)\s+.{0,48}(nelfund|nelfund|it|dis|this|loan|scheme)?.{0,24}(created|create|establish|established|started|start|begin|form|formed|set\s*up|make|made|bring|brought)|why\s+(dem|they|una|fg|government)\s+(take\s+)?(create|make|start|form|bring|introduce|set\s*up)\s+(nelfund|am|it|this\s+loan|dis\s+loan|the\s+loan)|why\s+(they|dem)\s+(created|formed|started|introduced)\s+(nelfund|this\s+loan)|why\s+nelfund\s+(was|is|dey|come|exist|existed)|why\s+(was|is)\s+nelfund|why\s+nelfund\b|purpose\s+(of\s+)?(nelfund|the\s+(student\s+)?loan)|reason\s+(for|dem|they|una)\s+.{0,24}(nelfund|this\s+loan|dis\s+loan)|mission\s+of\s+nelfund|nelfund\s+(purpose|mission|aim|objective|mean|meaning)|who\s+(created|established|started|signed|built|founded|form(ed)?|make|made|bring|brought)\s+nelfund|wetin\s+(make|cause|make\s+una)\s+(dem|them|una|government|fg)?\s*(create|start|bring)|how\s+come\s+.{0,28}(nelfund|dis\s+loan|this\s+loan)|na\s+why\s+.{0,24}(nelfund|dem\s+form|this\s+loan)|wetin\s+be\s+the\s+(purpose|reason)|why\s+dem\s+create\s+nelfund|why\s+una\s+create\s+nelfund|why\s+they\s+create\s+nelfund|why\s+fg\s+create\s+nelfund|why\s+government\s+create\s+nelfund|nelfund\s+dey\s+do|why\s+dem\s+bring\s+nelfund|why\s+they\s+form\s+nelfund|purpose\s+of\s+this\s+(student\s+)?loan|why\s+introduce\s+nelfund|wetin\s+be\s+the\s+aim|nelfund\s+dey\s+mean\s+wetin|explain\s+why\s+nelfund|why\s+they\s+form\s+this\s+loan|explain\s+this\s+student\s+loan|na\s+wetin\s+be\s+(dis|this)\s+(loan|scheme)|wetin\s+make\s+una\s+start|what\s+is\s+the\s+student\s+loan|why\s+they\s+introduce\s+nelfund|what\s+is\s+nelfund\s+meant\s+(for|to)|wetin\s+be\s+the\s+point\s+of\s+nelfund|why\s+nigeria\s+start\s+student\s+loan|wetin\s+una\s+create\s+nelfund\s+for|nelfund\s+stand\s+for\s+wetin|purpose\s+dem\s+create/i

export function liveOpenRe(): RegExp {
  return /is\s+(nelfund\s+)?(loan\s*)?(upkeep\s*)?(application\s*)?(still\s+|currently\s+)?(open|closed|dey\s+open)|is\s+(nelfund|it|portal|application|loan)\s+(still\s+)?(open|dey\s+open|closed)|loan\s+application\s+(still\s+|currently\s+)?(open|closed)|deadline|as\s+of\s+today|still\s+accept|can\s+i\s+still\s+apply|dem\s+still\s+dey\s+(collect|accept|open)|una\s+still\s+dey\s+(collect|open|accept)|nelfund\s+dey\s+(still\s+)?open|portal\s+(still\s+)?(dey\s+)?open|application\s+dey\s+open|closing\s+date|opening\s+date|open\s*status|loan\s*window|nelfund\s+(still\s+)?(open|closed)|application\s+(still\s+)?open|dem\s+don\s+close\s+(nelfund|am|portal)|una\s+don\s+close|when\s*(will|go)\s*(nelfund|the\s+portal|the\s+loan)\s*(open|start|begin|reopen)|nelfund\s+open\s+(now|today)|loan\s+(still\s+)?dey\s+(open|close)|as\s+of\s+now.{0,20}(open|close)|una\s+still\s+dey\s+(register|collect)|account\s*creation\s*(open|close)|dem\s*don\s*open\s*(loan|upkeep|nelfund)|upkeep\s*don\s*(open|start)|is\s+application\s+still\s+on|deadline\s*(abeg|pls|please)|loan\s*window\s*(still|stil)\s*(open|close)|fit\s*i\s*still\s*apply|una\s*don\s*open\s*(am|loan)|when\s*(dem|they)\s*(go|will)\s*(open|reopen)\s*(the\s*)?(loan|upkeep)|portal\s*still\s*dey\s*collect|una\s*still\s*dey\s*take\s*application|application\s*window\s*(open|close)|dem\s*still\s*dey\s*open|una\s*don\s*open\s*upkeep|is\s*the\s*loan\s*still\s*on|loan\s*application\s*open\s*as\s*of\s+today|dem\s*still\s*dey\s*accept|is\s*nelfund\s*still\s*taking\s*applications|have\s*they\s*closed\s*the\s*loan\s*window|loan\s*portal\s*still\s*open\s*now|una\s*still\s*dey\s*open\s*loan|dem\s*still\s*dey\s*take\s*new\s*student|is\s*the\s*portal\s*still\s*accepting|window\s*still\s*open\s*abeg|dem\s*don\s*close\s*application|is\s*it\s*still\s*open\s*to\s*apply|can\s*new\s*students\s*still\s*apply/i
}

/** Last user utterance only: never classify from concatenated history. */
export function lastUtterance(text: string): string {
  const q = (text || '').trim()
  if (!q) return ''
  const parts = q.split(/\n+/).map((s) => s.trim()).filter(Boolean)
  return parts[parts.length - 1] || q
}

export { isPurposeAsk }

export function classifyIntent(text: string, history?: ConversationTurn[]): IntentResult {
  const early = earlyIntent173(text)
  if (early) return early
  return classifyIntentInner(text, history)
}
