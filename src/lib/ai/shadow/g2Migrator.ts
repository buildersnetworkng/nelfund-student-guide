/**
 * Temporary stub — replaced immediately with validated G3 migrator.
 * Exports match production bridge imports so tree remains import-safe.
 */
import packJson from '../packs/migrated_v1/pack.json'
import { DEFAULT_AI_FEATURE_FLAGS, type AiFeatureFlags } from './featureFlags'

export type G2Claim = {
  text: string
  evidence_ids: string[]
  authority: string | null
  freshness: string | null
  portal_confirm: boolean
  supported: boolean
  unsupported_reason?: string
}

export type G2DialogState = {
  priorIntent: string | null
  priorArea: string | null
  institutionId: string | null
  institutionName: string | null
  awaitingSlot: string | null
  lastProcedureIds: string[]
}

export type G2Result = {
  ok: boolean
  handled: boolean
  area: string | null
  areas: string[]
  procedure_id: string | null
  procedure_ids: string[]
  pack_id: string
  pack_version: string
  predicted_intent: string | null
  entities: { institutionId: string | null; institutionName: string | null }
  dialog_state: G2DialogState
  planned_action: string
  tools_called: string[]
  evidence_ids: string[]
  claims: G2Claim[]
  proposed_answer: string
  clarification: boolean
  refusal: boolean
  refusal_class: string | null
  verification_passed: boolean
  verification_notes: string[]
  failure_reason: string | null
  exception: string | null
  latency_ms: number
  mode: 'shadow' | 'production'
  ocr_screen_kind: string | null
  multipart_parts: string[]
}

export function createDialogState(partial?: Partial<G2DialogState>): G2DialogState {
  return {
    priorIntent: null,
    priorArea: null,
    institutionId: null,
    institutionName: null,
    awaitingSlot: null,
    lastProcedureIds: [],
    ...partial,
  }
}

export function runG2MigratedTurn(_opts: {
  userText?: string
  ocrText?: string | null
  dialog?: G2DialogState
  mode?: 'shadow' | 'production'
  flags?: AiFeatureFlags
}): G2Result {
  const pack = packJson as { pack_id: string; pack_version: string }
  return {
    ok: true,
    handled: false,
    area: null,
    areas: [],
    procedure_id: null,
    procedure_ids: [],
    pack_id: pack.pack_id,
    pack_version: pack.pack_version,
    predicted_intent: null,
    entities: { institutionId: null, institutionName: null },
    dialog_state: createDialogState(),
    planned_action: 'stub_not_handled',
    tools_called: [],
    evidence_ids: [],
    claims: [],
    proposed_answer: '',
    clarification: false,
    refusal: false,
    refusal_class: null,
    verification_passed: true,
    verification_notes: ['stub'],
    failure_reason: null,
    exception: null,
    latency_ms: 0,
    mode: 'production',
    ocr_screen_kind: null,
    multipart_parts: [],
  }
}

export function runG2Dialogue(
  _turns: Array<{ text?: string; ocr_text?: string; as_followup?: boolean; history_intent?: string }>,
  mode: 'shadow' | 'production' = 'shadow',
): G2Result {
  return runG2MigratedTurn({ mode })
}

void DEFAULT_AI_FEATURE_FLAGS
