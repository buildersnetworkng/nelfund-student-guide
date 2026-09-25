/** Routes hourly playbooks 171-183 before the older 170 chain. */
import { playbookHourly171 } from './playbookHourly171'
import { playbookHourly172 } from './playbookHourly172'
import { playbookHourly173 } from './playbookHourly173'
import { playbookHourly174 } from './playbookHourly174'
import { playbookHourly175 } from './playbookHourly175'
import { playbookHourly176 } from './playbookHourly176'
import { playbookHourly177 } from './playbookHourly177'
import { playbookHourly178 } from './playbookHourly178'
import { playbookHourly179 } from './playbookHourly179'
import { playbookHourly180 } from './playbookHourly180'
import { playbookHourly181 } from './playbookHourly181'
import { playbookHourly182 } from './playbookHourly182'
import { playbookHourly183 } from './playbookHourly183'

export function playbookHourlyChain(intent: string, userText: string): string | null {
  const h183 = playbookHourly183(intent, userText)
  if (h183) return h183
  const h182 = playbookHourly182(intent, userText)
  if (h182) return h182
  const h181 = playbookHourly181(intent, userText)
  if (h181) return h181
  const h180 = playbookHourly180(intent, userText)
  if (h180) return h180
  const h179 = playbookHourly179(intent, userText)
  if (h179) return h179
  const h178 = playbookHourly178(intent, userText)
  if (h178) return h178
  const h177 = playbookHourly177(intent, userText)
  if (h177) return h177
  const h176 = playbookHourly176(intent, userText)
  if (h176) return h176
  const h175 = playbookHourly175(intent, userText)
  if (h175) return h175
  const h174 = playbookHourly174(intent, userText)
  if (h174) return h174
  const h173 = playbookHourly173(intent, userText)
  if (h173) return h173
  const h172 = playbookHourly172(intent, userText)
  if (h172) return h172
  const h171 = playbookHourly171(intent, userText)
  if (h171) return h171
  return null
}
