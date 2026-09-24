/**
 * Crash-safe NELFUND turn entry.
 * Official URLs: website nelf.gov.ng | signup portal.nelf.gov.ng | login portal.nelf.gov.ng/auth/login
 * Live window (portal notice 2026-09): 2026/2027 open 23 Sep 2026 – 31 Dec 2026.
 */
import {
  processUserTurn as processUserTurnCore,
  type AgentTurnResult,
  type ConversationSlots,
  type ChatMessage,
} from './conversation'
import type { ConversationTurn, IntentId, AgentCapability } from './types'

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

const SITE = 'https://nelf.gov.ng/'
const PORTAL = 'https://portal.nelf.gov.ng/'
const LOGIN_URL = 'https://portal.nelf.gov.ng/auth/login'
const ESUPPORT = 'https://nelfund.esupport.ng/create'
