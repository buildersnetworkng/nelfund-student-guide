/**
 * NELFUND AI answer playbook
 */
import type { IntentId } from './types'
import { isOverviewAsk, fullNelfundOverview } from './overviewAsk'
import { explainTerm } from './termDefine'
import { playbookHourly156 } from './playbookHourly156'
import { playbookHourly157 } from './playbookHourly157'
import { playbookHourly158 } from './playbookHourly158'
import { playbookHourly159 } from './playbookHourly159'
import { playbookHourly160 } from './playbookHourly160'
import { playbookHourly161 } from './playbookHourly161'
import { playbookHourly162 } from './playbookHourly162'
import { playbookHourly163 } from './playbookHourly163'
import { playbookHourly164 } from './playbookHourly164'
import { playbookHourly165 } from './playbookHourly165'
import { playbookHourly166 } from './playbookHourly166'
import { playbookHourly167 } from './playbookHourly167'
import { playbookHourly168 } from './playbookHourly168'
import { playbookHourly169 } from './playbookHourly169'

export type PlaybookContext = {
  institutionName?: string | null
  problemSummary?: string | null
  exactError?: string | null
  turnIndex?: number
  lastAssistant?: string | null
  userText?: string | null
  priorIntent?: IntentId | null
}

const SITE = 'https://nelf.gov.ng/'
const PORTAL = 'https://portal.nelf.gov.ng/'
const LOGIN_URL = 'https://portal.nelf.gov.ng/auth/login'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

export function playbookAnswer(intent: IntentId, ctx: PlaybookContext): string | null {
  const userText = (ctx.userText || '').trim()

  if (userText && isOverviewAsk(userText)) {
    return fullNelfundOverview()
  }

  const term = userText ? explainTerm(userText, ctx.lastAssistant) : null
  if (term) return term.text

  const h169 = playbookHourly169(intent, userText)
  if (h169) return h169
  const h168 = playbookHourly168(intent, userText)
  if (h168) return h168
  const h167 = playbookHourly167(intent, userText)
  if (h167) return h167
  const h166 = playbookHourly166(intent, userText)
  if (h166) return h166
  const h165 = playbookHourly165(intent, userText)
  if (h165) return h165
  const h164 = playbookHourly164(intent, userText)
  if (h164) return h164
  const h163 = playbookHourly163(intent, userText)
  if (h163) return h163
  const h162 = playbookHourly162(intent, userText)
  if (h162) return h162
  const h161 = playbookHourly161(intent, userText)
  if (h161) return h161
  const h160 = playbookHourly160(intent, userText)
  if (h160) return h160
  const h159 = playbookHourly159(intent, userText)
  if (h159) return h159
  const h158 = playbookHourly158(intent, userText)
  if (h158) return h158
  const h157 = playbookHourly157(intent, userText)
  if (h157) return h157
  const h156 = playbookHourly156(intent, userText)
  if (h156) return h156
