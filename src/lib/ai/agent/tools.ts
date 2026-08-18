/**
 * Structured tool runners — return evidence, not final answers.
 */

import { getInstitution } from '../../data'
import { buildEscalationPlan } from '../../escalation'
import { retrieveEvidence } from '../retrieve'
import { draftSupportEmail } from '../generate'
import { buildCurrentInformationAnswer } from '../current'
import { applicationStatus } from '../../data'
import type { IntentId } from '../types'
import type { ToolCall, ToolName, ToolResult } from './contracts'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

export const TOOL_DEFINITIONS: Array<{
  name: ToolName
  description: string
}> = [
  {
    name: 'search_verified_knowledge',
    description: 'Retrieve verified NELFUND evidence snippets for a query + optional intent.',
  },
  {
    name: 'get_current_status',
    description: 'Curated application-window snapshot with freshness metadata.',
  },
  {
    name: 'get_institution_guidance',
    description: 'Institution directory + curated contacts. Never invent emails.',
  },
  {
    name: 'get_nelfund_support',
    description: 'Official NELFUND support channels.',
  },
  {
    name: 'draft_support_email',
    description: 'Generate email subject/body with placeholders from structured inputs.',
  },
  {
    name: 'fetch_official_page',
    description: 'Fetch text from allowlisted official NELFUND hosts (server-side only).',
  },
]

export function runToolLocal(call: ToolCall): ToolResult {
  const { id, name, arguments: args } = call
  try {
    switch (name) {
      case 'search_verified_knowledge': {
        const query = args.query || ''
        const intent = (args.intent as IntentId) || 'unknown'
        const items = retrieveEvidence(query, intent, args.institutionId || null)
        return {
          callId: id,
          name,
          status: items.length ? 'ok' : 'not_found',
          data: {
            query,
            intent,
            items: items.map((e) => ({
              id: e.id,
              kind: e.kind,
              title: e.title,
              body: e.body.slice(0, 600),
              last_verified: e.last_verified,
              score: e.score,
              path: e.path,
            })),
          },
          evidenceIds: items.map((e) => e.id),
          warnings: items.length ? undefined : ['No strong knowledge match — clarify or use other tools.'],
        }
      }
      case 'get_current_status': {
        const cur = buildCurrentInformationAnswer()
        const raw = applicationStatus as {
          last_checked?: string
          status_label?: string
          cycle?: string
          note?: string
          freshness_policy_days?: number
        }
        return {
          callId: id,
          name,
          status: 'ok',
          data: {
            evidence_type: 'curated_snapshot',
            cycle: raw.cycle,
            status_label: raw.status_label,
            note: raw.note,
            last_checked: raw.last_checked || cur.lastChecked,
            official_portal: PORTAL,
            official_site: SITE,
            answer_preview: cur.answer.slice(0, 400),
            disclaimer: 'Not a live portal reading.',
          },
          warnings: ['Confirm openness on official portal; snapshot may be stale.'],
        }
      }
      case 'get_institution_guidance': {
        const q = args.institution || args.institutionId || ''
        const plan = buildEscalationPlan('missing-information', args.institutionId || null, {
          errorMessage: args.error || null,
        })
        const inst = args.institutionId ? getInstitution(args.institutionId) : null
        const contacts = (plan.institutionContacts || []).map((c) => ({
          label: c.label,
          email: c.email,
          url: c.url,
          office: c.office,
          priority: c.priority,
        }))
        const found = Boolean(inst || contacts.length)
        return {
          callId: id,
          name,
          status: found ? 'ok' : 'not_found',
          data: {
            query: q,
            institutionId: inst?.id || args.institutionId || null,
            institutionName: inst?.name || null,
            official_website: inst?.official_website || null,
            contacts,
            nelfund_support: ESUPPORT,
          },
          warnings: found
            ? contacts.every((c) => !c.email)
              ? ['No curated email — use official website only; do not invent.']
              : undefined
            : ['Institution not resolved — ask for full official name.'],
        }
      }
      case 'get_nelfund_support':
        return {
          callId: id,
          name,
          status: 'ok',
          data: {
            ticket_portal: ESUPPORT,
            client_support_email: 'clientsupport@nelf.gov.ng',
            application_portal: PORTAL,
            website: SITE,
          },
        }
      case 'draft_support_email': {
        const draft = draftSupportEmail({
          institutionId: args.institutionId || null,
          institutionName: args.institutionName || null,
          exactError: args.exactError || args.error || null,
          intentLabel: args.intentLabel || 'missing information',
          studentName: args.studentName || null,
          matric: args.matric || null,
          recipient: (args.recipient as 'school' | 'nelfund') || 'school',
        })
        return {
          callId: id,
          name,
          status: 'ok',
          data: { subject: draft.subject, body: draft.body, recipient: args.recipient || 'school' },
        }
      }
      case 'fetch_official_page':
        return {
          callId: id,
          name,
          status: 'error',
          data: {
            message: 'Live fetch is server-only (api/chat). Client/mock returns structure only.',
            suggested_urls: [PORTAL, SITE, ESUPPORT],
          },
          warnings: ['Use server agent for live page fetch.'],
        }
      default:
        return {
          callId: id,
          name,
          status: 'error',
          data: { message: `Unknown tool: ${name}` },
        }
    }
  } catch (e) {
    return {
      callId: id,
      name,
      status: 'error',
      data: { message: e instanceof Error ? e.message : 'tool failed' },
    }
  }
}
