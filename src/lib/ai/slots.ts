/**
 * Lightweight slot extraction from student free text.
 * Used to feed the LLM agent memory without FAQ matching.
 * Does not invent policy answers.
 */

import { getInstitution } from '../data'
import { resolveInstitutionFromText } from '../escalation'

export type ExtractedSlots = {
  institutionId: string | null
  institutionName: string | null
  exactError: string | null
  problemSummary: string | null
  objective: string | null
}

const ERROR_PATTERNS = [
  /missing\s*information[^\n.]{0,80}/i,
  /no\s*school\s*info(?:rmation)?[^\n.]{0,40}/i,
  /student\s*record[s]?\s*(not\s*found|missing)[^\n.]{0,40}/i,
  /record\s*not\s*found[^\n.]{0,40}/i,
  /invalid\s*jamb[^\n.]{0,40}/i,
  /nin\s*(verification\s*)?failed[^\n.]{0,40}/i,
  /application\s*(is\s*)?pending[^\n.]{0,40}/i,
  /application\s*(was\s*)?reject(?:ed)?[^\n.]{0,40}/i,
  /no\s*record\s*found[^\n.]{0,40}/i,
  /unable\s*to\s*(login|log\s*in|sign\s*in)[^\n.]{0,40}/i,
]

function extractError(text: string): string | null {
  for (const re of ERROR_PATTERNS) {
    const m = text.match(re)
    if (m) return m[0].trim().replace(/\s+/g, ' ')
  }
  return null
}

function extractObjective(text: string): string | null {
  const t = text.toLowerCase()
  if (/draft|write\s*(an?\s*)?(email|message|complaint)/i.test(text)) return 'draft_message'
  if (/contact|email|phone|office|reach/i.test(t) && /(school|institution|nelfund|support)/i.test(t))
    return 'find_contact'
  if (/open|latest|current|today|deadline|announce/i.test(t)) return 'current_status'
  if (/login|log\s*in|sign\s*in|which\s*link/i.test(t)) return 'portal_access'
  if (/upload|data\s*(been\s*)?upload/i.test(t)) return 'verify_school_upload'
  if (/missing\s*information|record\s*not\s*found/i.test(t)) return 'resolve_portal_error'
  return null
}

/**
 * Merge free-text extraction onto existing slots (never wipe known good values).
 */
export function extractSlotsFromText(
  text: string,
  prior?: Partial<ExtractedSlots> | null,
): ExtractedSlots {
  const base: ExtractedSlots = {
    institutionId: prior?.institutionId ?? null,
    institutionName: prior?.institutionName ?? null,
    exactError: prior?.exactError ?? null,
    problemSummary: prior?.problemSummary ?? null,
    objective: prior?.objective ?? null,
  }

  if (!text?.trim()) return base

  const instId = resolveInstitutionFromText(text)
  if (instId) {
    base.institutionId = instId
    base.institutionName = getInstitution(instId)?.name ?? base.institutionName
  }

  const err = extractError(text)
  if (err) {
    base.exactError = err
    base.problemSummary = base.problemSummary || err
  }

  const objective = extractObjective(text)
  if (objective) base.objective = objective

  return base
}
