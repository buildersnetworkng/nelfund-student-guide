/**
 * Bridge: try migrated pack path, else signal fallback to legacy processUserTurn.
 * Never throws to caller — any error → fallback.
 */
import {
  runG2MigratedTurn,
  createDialogState,
  type G2DialogState,
  type G2Result,
} from './g2Migrator'
import { loadAiFeatureFlags, inRolloutCohort } from './featureFlags'
import type { ConversationSlots } from '../conversation'
import type { IntentId } from '../types'

export type PathSelection = {
  selected_path: 'migrated' | 'legacy'
  area: string | null
  areas: string[]
  procedure_ids: string[]
  evidence_ids: string[]
  pack_version: string | null
  fallback_reason: string | null
  latency_ms: number
  clarification: boolean
  refusal: boolean
  refusal_class: string | null
}

export type BridgedTurn = {
  used: 'migrated' | 'legacy_required'
  selection: PathSelection
  text?: string
  intent?: IntentId
  dialog?: G2DialogState
  g2?: G2Result
}

function slotsToDialog(slots: ConversationSlots): G2DialogState {
  const d = createDialogState()
  d.priorIntent = (slots.intent as string) || null
  d.institutionId = slots.institutionId || null
  d.institutionName = null
  const intent = slots.intent
  if (intent === 'pending-application') d.priorArea = 'pending_status'
  else if (intent === 'how-to-apply') d.priorArea = 'how_to_apply'
  else if (intent === 'email-already-used') d.priorArea = 'account_already_exists'
  else if (intent === 'portal-login' || intent === 'password-reset') d.priorArea = 'portal_login'
  else if (intent === 'missing-information') d.priorArea = 'institution_followup'
  else if (intent === 'current-information') d.priorArea = 'application_window'
  return d
}

export function tryMigratedPath(opts: {
  userText: string
  ocrText?: string | null
  slots: ConversationSlots
  userKey?: string | null
}): BridgedTurn {
  const t0 = Date.now()
  try {
    const flags = loadAiFeatureFlags()
    if (!flags.enableMigratedAreasProduction) {
      return {
        used: 'legacy_required',
        selection: {
          selected_path: 'legacy',
          area: null,
          areas: [],
          procedure_ids: [],
          evidence_ids: [],
          pack_version: null,
          fallback_reason: 'flag_production_off',
          latency_ms: Date.now() - t0,
          clarification: false,
          refusal: false,
          refusal_class: null,
        },
      }
    }
    if (!inRolloutCohort(flags, opts.userKey)) {
      return {
        used: 'legacy_required',
        selection: {
          selected_path: 'legacy',
          area: null,
          areas: [],
          procedure_ids: [],
          evidence_ids: [],
          pack_version: null,
          fallback_reason: 'outside_rollout_cohort',
          latency_ms: Date.now() - t0,
          clarification: false,
          refusal: false,
          refusal_class: null,
        },
      }
    }

    const dialog = slotsToDialog(opts.slots)
    const g2 = runG2MigratedTurn({
      userText: opts.userText,
      ocrText: opts.ocrText,
      dialog,
      mode: 'production',
      flags,
    })

    if (!g2.ok) {
      return {
        used: 'legacy_required',
        selection: {
          selected_path: 'legacy',
          area: g2.area,
          areas: g2.areas || [],
          procedure_ids: g2.procedure_ids || [],
          evidence_ids: g2.evidence_ids || [],
          pack_version: g2.pack_version,
          fallback_reason: `g2_not_ok:${g2.exception || g2.failure_reason || 'unknown'}`,
          latency_ms: Date.now() - t0,
          clarification: false,
          refusal: false,
          refusal_class: null,
        },
      }
    }

    if (!g2.handled || !g2.proposed_answer) {
      return {
        used: 'legacy_required',
        selection: {
          selected_path: 'legacy',
          area: g2.area,
          areas: g2.areas || [],
          procedure_ids: g2.procedure_ids || [],
          evidence_ids: g2.evidence_ids || [],
          pack_version: g2.pack_version,
          fallback_reason: g2.verification_notes?.join(',') || 'not_handled',
          latency_ms: Date.now() - t0,
          clarification: g2.clarification,
          refusal: g2.refusal,
          refusal_class: g2.refusal_class,
        },
        g2,
      }
    }

    const intent = (g2.predicted_intent as IntentId) || (opts.slots.intent as IntentId) || 'current-information'
    return {
      used: 'migrated',
      selection: {
        selected_path: 'migrated',
        area: g2.area,
        areas: g2.areas || [],
        procedure_ids: g2.procedure_ids || [],
        evidence_ids: g2.evidence_ids || [],
        pack_version: g2.pack_version,
        fallback_reason: null,
        latency_ms: Date.now() - t0,
        clarification: g2.clarification,
        refusal: g2.refusal,
        refusal_class: g2.refusal_class,
      },
      text: g2.proposed_answer,
      intent,
      dialog: g2.dialog_state,
      g2,
    }
  } catch (e) {
    return {
      used: 'legacy_required',
      selection: {
        selected_path: 'legacy',
        area: null,
        areas: [],
        procedure_ids: [],
        evidence_ids: [],
        pack_version: null,
        fallback_reason: `bridge_exception:${e instanceof Error ? e.message : String(e)}`,
        latency_ms: Date.now() - t0,
        clarification: false,
        refusal: false,
        refusal_class: null,
      },
    }
  }
}
