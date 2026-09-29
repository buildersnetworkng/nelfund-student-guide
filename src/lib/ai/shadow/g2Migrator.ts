import packJson from '../packs/migrated_v1/pack.json'
import { resolveInstitutionFromText } from '../../escalation'
import { getInstitution } from '../../data'
import { normalizeStudentText, isMultiQuestion, splitMultiQuestions } from '../understand'
import { understandPortalText } from '../screenshotUnderstand'
import { DEFAULT_AI_FEATURE_FLAGS, isAreaEnabled, type AiFeatureFlags } from './featureFlags'

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

type Area =
  | 'portal_login'
  | 'account_already_exists'
  | 'how_to_apply'
  | 'pending_status'
  | 'disbursement_timing'
  | 'institution_followup'
  | 'application_window'

type Proc = {
  id: string
  area: string
  title: string
  intent_hints: string[]
  evidence_ids: string[]
  time_sensitive?: boolean
  require_portal_confirm?: boolean
}

type Ev = {
  id: string
  body: string
  authority: string
  freshness: string
  title: string
}

const pack = packJson as {
  pack_id: string
  pack_version: string
  procedures: Proc[]
  evidence: Ev[]
}

function byId(id: string): Ev | undefined {
  return pack.evidence.find((e) => e.id === id)
}

function procedureForArea(area: Area): Proc | undefined {
  return pack.procedures.find((p) => p.area === area)
}

function detectAreas(text: string, prior: G2DialogState): Area[] {
  const t = text.toLowerCase()
  const found: Area[] = []
  const add = (a: Area) => {
    if (!found.includes(a)) found.push(a)
  }

  if (/email\s*(already|is already)|already\s*(registered|exist|existed)|account\s*already|old\s*email|registered\s*last|mail last session/i.test(t))
    add('account_already_exists')
  if (/fogot|forgot\s*pass|password|log\s*in|login|sign\s*in|which\s*(site|website|link)|student loan portal sign/i.test(t))
    add('portal_login')
  if (/how much is upkeep exactly|upkeep exactly per month/i.test(t)) add('disbursement_timing')
  if (/disburse|disurment|when will (the )?money|how long does approval|how many days does approval|after approval/i.test(t))
    add('disbursement_timing')
  if (/still\s*(dey\s*)?open|is nelfund.*open|can i still apply|application open|una still dey|open right now/i.test(t))
    add('application_window')
  if (/pending|application status|check my (loan|application)/i.test(t)) add('pending_status')
  if (/how (do i|to|can i|i go take) apply|start my nelfund|request (for )?(student )?loan|steps to put in|where is the button to request|aploy|apply for (this )?nelfund|put in for the student loan|submit institutional charges|abeg how i go|how do i apply and what is upkeep|institutional charges on the portal/i.test(t))
    add('how_to_apply')
  if (/upkeep/i.test(t) && (found.includes('how_to_apply') || /apply|loan/i.test(t))) add('how_to_apply')
  if (/missing information|portal shows missing/i.test(t)) add('institution_followup')

  // Follow-up / dialog-state driven
  if (prior.priorArea === 'pending_status' || prior.priorIntent === 'pending-application') {
    if (/what (should i do )?next|what next|and then|continue|after that/i.test(t)) add('pending_status')
  }
  if (prior.priorArea === 'how_to_apply' || prior.priorIntent === 'how-to-apply') {
    if (/upkeep|loan and upkeep|meant for the loan/i.test(t)) add('how_to_apply')
  }
  if (prior.priorArea === 'account_already_exists' && /log|sign|password|login/i.test(t)) add('portal_login')
  if (
    (prior.priorArea === 'institution_followup' || prior.priorIntent === 'missing-information' || prior.awaitingSlot === 'institution') &&
    (/^[A-Z]{2,8}$/.test(text.trim()) || resolveInstitutionFromText(text))
  ) {
    add('institution_followup')
  }
  if (prior.awaitingSlot === 'institution' && text.trim()) add('institution_followup')

  // Multi-clause: login and pending in one message
  if (/log\s*in|login|sign\s*in/i.test(t) && /pending/i.test(t)) {
    add('portal_login')
    add('pending_status')
  }

  return found
}

function extractInstitution(text: string, priorName: string | null, priorId: string | null) {
  let institutionId = resolveInstitutionFromText(text)
  let institutionName = priorName
  if (institutionId) {
    const inst = getInstitution(institutionId)
    institutionName = inst?.short_name || inst?.name || institutionId
  } else if (/^[A-Z]{2,8}$/.test(text.trim())) {
    institutionId = resolveInstitutionFromText(text.trim())
    if (institutionId) {
      const inst = getInstitution(institutionId)
      institutionName = inst?.short_name || inst?.name || text.trim()
    } else {
      institutionName = text.trim()
    }
  }
  if (!institutionId && priorId) institutionId = priorId
  if (!institutionName && priorName) institutionName = priorName
  return { institutionId, institutionName }
}

function composeFromProcs(
  procs: Proc[],
  institutionName: string | null,
): { answer: string; claims: G2Claim[]; evidence_ids: string[]; parts: string[] } {
  const claims: G2Claim[] = []
  const eids: string[] = []
  const chunks: string[] = []
  const parts: string[] = []
  procs.forEach((proc, i) => {
    const bodies: string[] = []
    for (const eid of proc.evidence_ids) {
      eids.push(eid)
      const ev = byId(eid)
      if (!ev) {
        claims.push({
          text: `(missing evidence ${eid})`,
          evidence_ids: [],
          authority: null,
          freshness: null,
          portal_confirm: true,
          supported: false,
          unsupported_reason: 'evidence_id_not_in_pack',
        })
        continue
      }
      bodies.push(ev.body)
      claims.push({
        text: ev.title,
        evidence_ids: [ev.id],
        authority: ev.authority,
        freshness: ev.freshness,
        portal_confirm: !!proc.require_portal_confirm,
        supported: true,
      })
    }
    const label = procs.length > 1 ? `**${i + 1}. ${proc.title}**\n` : ''
    chunks.push(label + bodies.join('\n\n'))
    parts.push(proc.area)
  })
  let answer = chunks.join('\n\n')
  if (institutionName) {
    const re = new RegExp(institutionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    if (!re.test(answer)) {
      answer = `**School context:** ${institutionName}\n\n${answer}`
      claims.push({
        text: `institution_context:${institutionName}`,
        evidence_ids: [],
        authority: 'user_context',
        freshness: 'live',
        portal_confirm: false,
        supported: true,
      })
    }
  }
  return { answer, claims, evidence_ids: [...new Set(eids)], parts }
}

function ocrToAreas(kind: string | null, explanation: string): Area[] {
  if (!kind) return []
  if (kind === 'dashboard-before-apply') return ['how_to_apply']
  if (kind === 'dashboard-after-apply' || kind === 'dashboard') return ['pending_status']
  if (kind === 'login') return ['portal_login']
  if (kind === 'apply-flow') return ['how_to_apply']
  if (kind === 'error') {
    if (/missing information/i.test(explanation)) return ['institution_followup']
    if (/no result|institution/i.test(explanation)) return ['institution_followup']
    return ['pending_status']
  }
  return []
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

export function runG2MigratedTurn(opts: {
  userText?: string
  ocrText?: string | null
  dialog?: G2DialogState
  mode?: 'shadow' | 'production'
  flags?: AiFeatureFlags
}): G2Result {
  const t0 = Date.now()
  const flags = opts.flags || DEFAULT_AI_FEATURE_FLAGS
  const mode = opts.mode || 'shadow'
  const dialog = opts.dialog || createDialogState()
  const tools: string[] = []

  try {
    const userRaw = (opts.userText || '').trim()
    const ocrRaw = (opts.ocrText || '').trim()
    tools.push('normalize')
    const normalized = normalizeStudentText([userRaw, ocrRaw].filter(Boolean).join('\n')) || userRaw

    const { institutionId, institutionName } = extractInstitution(userRaw || ocrRaw, dialog.institutionName, dialog.institutionId)
    tools.push('resolveInstitutionFromText')

    // OCR path
    let ocrKind: string | null = null
    let ocrExplanation: string | null = null
    if (ocrRaw.length >= 8) {
      tools.push('understandPortalText')
      const screen = understandPortalText(ocrRaw)
      if (screen) {
        ocrKind = screen.kind
        ocrExplanation = screen.explanation
      } else if (/admission\s*letter/i.test(ocrRaw)) {
        ocrKind = 'apply-flow'
        ocrExplanation =
          'The portal requires an **admission letter** upload to continue. Use a clear scan in the apply flow before Submit.'
        tools.push('ocr_keyword_admission')
      } else if (/no\s*result\s*found|select\s*institution/i.test(ocrRaw)) {
        ocrKind = 'error'
        ocrExplanation =
          '**No Result found** when selecting institution — try shorter school names or confirm the school appears on the portal list.'
        tools.push('ocr_keyword_no_result')
      }
      // else: leave ocrKind null and continue; detectAreas may still use user text
    }

    let areas = detectAreas(userRaw || '', dialog)
    tools.push('detectAreas')

    // Institution-only follow-up after a process question: keep prior area + attach school
    if (
      !areas.length &&
      institutionName &&
      (dialog.priorArea === 'how_to_apply' ||
        dialog.priorArea === 'pending_status' ||
        dialog.priorArea === 'institution_followup')
    ) {
      areas = [dialog.priorArea as Area]
      tools.push('retain_prior_area_with_institution')
    }

    if (ocrKind) {
      const oAreas = ocrToAreas(ocrKind, ocrExplanation || '')
      for (const a of oAreas) if (!areas.includes(a)) areas.push(a)
      tools.push('ocr_map_areas')
    }

    // If only OCR and mapped
    if (!areas.length && ocrKind && ocrExplanation) {
      // use OCR explanation as primary with pack enrichment if possible
      areas = ocrToAreas(ocrKind, ocrExplanation)
    }

    if (!areas.length) {
      // Clarification if too vague
      if (/^(help|fix|loan|issue|problem)\.?$/i.test(userRaw.trim()) || userRaw.trim().length < 3) {
        return {
          ok: true,
          handled: true,
          area: null,
          areas: [],
          procedure_id: null,
          procedure_ids: [],
          pack_id: pack.pack_id,
          pack_version: pack.pack_version,
          predicted_intent: dialog.priorIntent,
          entities: { institutionId, institutionName },
          dialog_state: { ...dialog, institutionId, institutionName, awaitingSlot: 'problem_detail' },
          planned_action: 'clarify',
          tools_called: tools,
          evidence_ids: [],
          claims: [],
          proposed_answer:
            'I need a bit more detail: apply, login, pending status, missing information, or fees/upkeep? You can also paste the portal message (no BVN/NIN/OTP). Portal: https://portal.nelf.gov.ng/',
          clarification: true,
          refusal: false,
          refusal_class: null,
          verification_passed: true,
          verification_notes: ['clarification'],
          failure_reason: null,
          exception: null,
          latency_ms: Date.now() - t0,
          mode,
          ocr_screen_kind: ocrKind,
          multipart_parts: [],
        }
      }
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
        entities: { institutionId, institutionName },
        dialog_state: { ...dialog, institutionId, institutionName },
        planned_action: 'not_in_migrated_slice',
        tools_called: tools,
        evidence_ids: [],
        claims: [],
        proposed_answer: '',
        clarification: false,
        refusal: false,
        refusal_class: null,
        verification_passed: true,
        verification_notes: ['area_not_migrated'],
        failure_reason: null,
        exception: null,
        latency_ms: Date.now() - t0,
        mode,
        ocr_screen_kind: ocrKind,
        multipart_parts: [],
      }
    }

    const enabledAreas = areas.filter((a) => isAreaEnabled(flags, a, mode))
    if (!enabledAreas.length) {
      return {
        ok: true,
        handled: false,
        area: areas[0] || null,
        areas,
        procedure_id: null,
        procedure_ids: [],
        pack_id: pack.pack_id,
        pack_version: pack.pack_version,
        predicted_intent: null,
        entities: { institutionId, institutionName },
        dialog_state: { ...dialog, institutionId, institutionName },
        planned_action: 'area_disabled_by_flag',
        tools_called: tools,
        evidence_ids: [],
        claims: [],
        proposed_answer: '',
        clarification: false,
        refusal: false,
        refusal_class: null,
        verification_passed: true,
        verification_notes: ['flag_disabled'],
        failure_reason: null,
        exception: null,
        latency_ms: Date.now() - t0,
        mode,
        ocr_screen_kind: ocrKind,
        multipart_parts: [],
      }
    }

    const procs = enabledAreas.map((a) => procedureForArea(a)).filter(Boolean) as Proc[]
    tools.push('pack_lookup_procedure')
    if (!procs.length) {
      return {
        ok: true,
        handled: false,
        area: enabledAreas[0],
        areas: enabledAreas,
        procedure_id: null,
        procedure_ids: [],
        pack_id: pack.pack_id,
        pack_version: pack.pack_version,
        predicted_intent: null,
        entities: { institutionId, institutionName },
        dialog_state: { ...dialog, institutionId, institutionName },
        planned_action: 'procedure_missing',
        tools_called: tools,
        evidence_ids: [],
        claims: [
          {
            text: 'procedure_missing',
            evidence_ids: [],
            authority: null,
            freshness: null,
            portal_confirm: true,
            supported: false,
            unsupported_reason: 'no_procedure_in_pack',
          },
        ],
        proposed_answer: '',
        clarification: false,
        refusal: false,
        refusal_class: null,
        verification_passed: false,
        verification_notes: ['no_procedure_in_pack'],
        failure_reason: 'no_procedure_in_pack',
        exception: null,
        latency_ms: Date.now() - t0,
        mode,
        ocr_screen_kind: ocrKind,
        multipart_parts: [],
      }
    }

    tools.push('compose_from_evidence')
    let { answer, claims, evidence_ids, parts } = composeFromProcs(procs, institutionName)

    // OCR explanation as leading context when present
    if (ocrExplanation) {
      answer = `**From your screenshot (${ocrKind || 'portal screen'})**\n${ocrExplanation}\n\n${answer}`
      tools.push('ocr_explanation_prefix')
    }

    // Invented policy guard
    if (/guaranteed within \d+|exactly \d+ days|always pays on the|I confirm you are approved/i.test(answer)) {
      return {
        ok: true,
        handled: true,
        area: enabledAreas[0],
        areas: enabledAreas,
        procedure_id: procs[0].id,
        procedure_ids: procs.map((p) => p.id),
        pack_id: pack.pack_id,
        pack_version: pack.pack_version,
        predicted_intent: procs[0].intent_hints[0] || null,
        entities: { institutionId, institutionName },
        dialog_state: { ...dialog, institutionId, institutionName },
        planned_action: 'blocked_invented_policy',
        tools_called: tools,
        evidence_ids,
        claims,
        proposed_answer:
          'I will not invent approval or disbursement timelines. Confirm live status on https://portal.nelf.gov.ng/auth/login',
        clarification: false,
        refusal: true,
        refusal_class: 'insufficient_evidence',
        verification_passed: false,
        verification_notes: ['invented_policy_blocked'],
        failure_reason: 'invented_policy_blocked',
        exception: null,
        latency_ms: Date.now() - t0,
        mode,
        ocr_screen_kind: ocrKind,
        multipart_parts: parts,
      }
    }

    const primary = enabledAreas[0]
    const newDialog: G2DialogState = {
      priorIntent: procs[0].intent_hints[0] || dialog.priorIntent,
      priorArea: primary,
      institutionId,
      institutionName,
      awaitingSlot: primary === 'institution_followup' && !institutionName ? 'institution' : null,
      lastProcedureIds: procs.map((p) => p.id),
    }

    return {
      ok: true,
      handled: true,
      area: primary,
      areas: enabledAreas,
      procedure_id: procs[0].id,
      procedure_ids: procs.map((p) => p.id),
      pack_id: pack.pack_id,
      pack_version: pack.pack_version,
      predicted_intent: procs[0].intent_hints[0] || null,
      entities: { institutionId, institutionName },
      dialog_state: newDialog,
      planned_action: enabledAreas.length > 1 ? 'multi_area_pack' : ocrKind ? 'ocr_pack' : 'pack_procedure',
      tools_called: tools,
      evidence_ids,
      claims,
      proposed_answer: answer,
      clarification: false,
      refusal: false,
      refusal_class: null,
      verification_passed: claims.every((c) => c.supported || c.unsupported_reason !== 'evidence_id_not_in_pack'),
      verification_notes: claims.filter((c) => !c.supported).map((c) => c.unsupported_reason || 'unsupported'),
      failure_reason: null,
      exception: null,
      latency_ms: Date.now() - t0,
      mode,
      ocr_screen_kind: ocrKind,
      multipart_parts: parts,
    }
  } catch (e) {
    return {
      ok: false,
      handled: false,
      area: null,
      areas: [],
      procedure_id: null,
      procedure_ids: [],
      pack_id: pack.pack_id,
      pack_version: pack.pack_version,
      predicted_intent: null,
      entities: { institutionId: null, institutionName: null },
      dialog_state: dialog,
      planned_action: 'error',
      tools_called: tools,
      evidence_ids: [],
      claims: [],
      proposed_answer: '',
      clarification: false,
      refusal: false,
      refusal_class: null,
      verification_passed: false,
      verification_notes: [],
      failure_reason: e instanceof Error ? e.message : String(e),
      exception: e instanceof Error ? e.message : String(e),
      latency_ms: Date.now() - t0,
      mode,
      ocr_screen_kind: null,
      multipart_parts: [],
    }
  }
}

export function runG2Dialogue(
  turns: Array<{ text?: string; ocr_text?: string; as_followup?: boolean; history_intent?: string }>,
  mode: 'shadow' | 'production' = 'shadow',
): G2Result {
  let dialog = createDialogState()
  let last: G2Result | null = null
  for (const t of turns) {
    if (t.history_intent && !dialog.priorIntent) dialog.priorIntent = t.history_intent
    last = runG2MigratedTurn({
      userText: t.text || '',
      ocrText: t.ocr_text || null,
      dialog,
      mode,
    })
    dialog = last.dialog_state
    // seed prior intent from first missing-info / apply user text
    if (t.text && /missing information/i.test(t.text)) {
      dialog.priorIntent = 'missing-information'
      dialog.priorArea = 'institution_followup'
    }
    if (t.text && /how to apply|how do i apply/i.test(t.text)) {
      dialog.priorIntent = 'how-to-apply'
      dialog.priorArea = 'how_to_apply'
    }
    if (t.text && /pending/i.test(t.text)) {
      dialog.priorIntent = 'pending-application'
      dialog.priorArea = 'pending_status'
    }
    if (t.text && /old email|already exist|email already/i.test(t.text)) {
      dialog.priorArea = 'account_already_exists'
      dialog.priorIntent = 'email-already-used'
    }
  }
  return last || runG2MigratedTurn({ userText: '', dialog, mode })
}

// silence unused import warnings in some builds
void isMultiQuestion
void splitMultiQuestions
