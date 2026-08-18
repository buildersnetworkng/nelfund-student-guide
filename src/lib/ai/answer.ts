import { getSource, sources } from '../data'
import { classifyIntent } from './intent'
import { retrieveEvidence, retrieveRelevantVideo } from './retrieve'
import type {
  GroundedAnswer, EvidenceItem, AnswerSource, AnswerVideo, IntentId, ConversationTurn, IntentResult,
} from './types'
import { diagnosticAssemble } from './diagnostics'
import { buildEscalationPlan, needsInstitutionForEscalation, resolveInstitutionFromText } from '../escalation'
import { understandPortalText } from './screenshotUnderstand'

const OFFICIAL_PORTAL = 'https://portal.nelf.gov.ng/'
const OFFICIAL_SITE = 'https://nelf.gov.ng/'

function buildSources(evidence: EvidenceItem[]): AnswerSource[] {
  const out: AnswerSource[] = []
  const seen = new Set<string>()
  for (const e of evidence) {
    if (!e.source_id || seen.has(e.source_id)) continue
    seen.add(e.source_id)
    const s = getSource(e.source_id)
    if (s) out.push({ id: s.id, label: s.label, url: s.url, official: s.official })
    else out.push({ id: e.source_id, label: e.source_id, url: null, official: false })
  }
  if (out.length === 0 || !out.some((s) => s.official)) {
    const portal = sources.find((x) => x.id === 'nelfund-portal' || (x.official && x.scope === 'nelfund-wide'))
    if (portal && !seen.has(portal.id)) {
      out.push({ id: portal.id, label: portal.label, url: portal.url, official: portal.official })
    }
  }
  return out.sort((a, b) => Number(b.official) - Number(a.official))
}

function mapVideo(v: NonNullable<ReturnType<typeof retrieveRelevantVideo>>): AnswerVideo {
  return {
    id: v.id, title: v.title, url: v.url, channel: v.channel, source_type: v.source_type,
    verification_status: v.verification_status, warning: v.warning, freshness_note: v.freshness_note,
  }
}

function insufficientAnswer(intent: IntentId, intentMeta: IntentResult): GroundedAnswer {
  const clarifying: string[] = []
  if (intentMeta.entities.includes('school')) clarifying.push('Which institution are you applying from?')
  clarifying.push('What exact message or error does the portal show?')
  return {
    hasEvidence: false,
    intent,
    confidence: intentMeta.confidence,
    responseMode: 'conversation',
    problem: intentMeta.problem,
    answer:
      'I want to help with the right next step. Tell me the exact portal message, your institution, or what you are trying to do (login, registration window, missing information, contact school, draft an email, or current status). If you uploaded a screenshot, make sure the main text is readable.',
    whatThisMeans: null,
    nextActions: [
      `Official portal: ${OFFICIAL_PORTAL}`,
      `Official website: ${OFFICIAL_SITE}`,
      'You can also ask me to draft an email or find support contacts once I know your institution.',
    ],
    clarifyingQuestions: clarifying.slice(0, 2),
    evidence: [],
    sources: sources.filter((s) => s.official && s.scope === 'nelfund-wide').map((s) => ({ id: s.id, label: s.label, url: s.url, official: s.official })),
    video: null,
    insufficientReason: null,
    officialFallbackUrl: OFFICIAL_PORTAL,
    escalation: null,
  }
}

export function answerQuestion(
  question: string,
  institutionId: string | null = null,
  history?: ConversationTurn[],
): GroundedAnswer {
  const trimmed = question.trim()
  const screen = understandPortalText(trimmed)
  if (screen && (screen.kind === 'dashboard' || screen.kind === 'error' || screen.kind === 'login')) {
    return {
      hasEvidence: true,
      intent: screen.kind === 'error' ? 'missing-information' : 'current-information',
      confidence: 0.88,
      responseMode: 'conversation',
      problem: screen.exactError || screen.kind,
      answer: screen.explanation,
      whatThisMeans: null,
      nextActions: screen.nextActions.slice(0, 4),
      clarifyingQuestions: [],
      evidence: [],
      sources: [
        { id: 'portal', label: 'NELFUND portal', url: OFFICIAL_PORTAL, official: true },
        { id: 'site', label: 'NELFUND website', url: OFFICIAL_SITE, official: true },
      ],
      video: null,
      insufficientReason: null,
      officialFallbackUrl: OFFICIAL_PORTAL,
      escalation: null,
    }
  }
  if (!trimmed) {
    return insufficientAnswer('unknown', {
      intent: 'unknown',
      confidence: 0,
      topics: [],
      problem: null,
      stage: 'unknown',
      entities: [],
      isTroubleshooting: false,
    })
  }
  const intentMeta = classifyIntent(trimmed, history)
  const { intent, confidence } = intentMeta
  const evidence = retrieveEvidence(trimmed, intent, institutionId)
  const strongEvidence = evidence.filter(
    (e) =>
      e.verification_status === 'verified' ||
      e.verification_status === 'may_change' ||
      e.verification_status === 'guidance',
  )

  if (
    (intent === 'academic-session' || intent === 'deadline') &&
    !strongEvidence.some((e) => e.verification_status === 'verified')
  ) {
    const assembled = diagnosticAssemble(intent, strongEvidence, intentMeta)
    return {
      hasEvidence: true,
      intent,
      confidence,
      responseMode: 'conversation',
      problem: intentMeta.problem,
      answer: assembled.answer,
      whatThisMeans: null,
      nextActions: assembled.nextActions,
      clarifyingQuestions: assembled.clarifyingQuestions,
      evidence: strongEvidence,
      sources: buildSources(strongEvidence),
      video: null,
      insufficientReason: null,
      officialFallbackUrl: OFFICIAL_PORTAL,
      escalation: null,
    }
  }

  if (strongEvidence.length === 0 || (intent === 'unknown' && (evidence[0]?.score ?? 0) < 20)) {
    return insufficientAnswer(intent, intentMeta)
  }
  if (confidence < 0.45 && (evidence[0]?.score ?? 0) < 25) {
    return insufficientAnswer(intent, intentMeta)
  }

  const assembled = diagnosticAssemble(intent, strongEvidence, intentMeta)
  const videoRaw = retrieveRelevantVideo(strongEvidence, intent, institutionId)

  let resolvedInstitutionId = institutionId
  if (!resolvedInstitutionId) {
    resolvedInstitutionId = resolveInstitutionFromText(trimmed)
  }
  if (!resolvedInstitutionId && history) {
    for (const turn of [...history].reverse()) {
      if (turn.role === 'user') {
        const found = resolveInstitutionFromText(turn.text)
        if (found) {
          resolvedInstitutionId = found
          break
        }
      }
    }
  }

  const escalation = buildEscalationPlan(intent, resolvedInstitutionId)

  const clarifyingQuestions = [...assembled.clarifyingQuestions]
  if (escalation?.needsInstitution && !clarifyingQuestions.some((q) => /school|institution/i.test(q))) {
    clarifyingQuestions.unshift('Which school do you attend?')
  }

  let answerText =
    assembled.answer || strongEvidence[0]?.body || 'See the related verified entries linked below for details.'
  if (escalation?.needsInstitution && needsInstitutionForEscalation(intent)) {
    answerText =
      answerText +
      ' To point you to the right office at your school, tell me which institution you attend.'
  }

  return {
    hasEvidence: true,
    intent,
    confidence,
    responseMode: 'conversation',
    problem: intentMeta.problem,
    answer: answerText,
    whatThisMeans: null,
    nextActions: assembled.nextActions,
    clarifyingQuestions: clarifyingQuestions.slice(0, 3),
    evidence: strongEvidence,
    sources: buildSources(strongEvidence),
    video: videoRaw ? mapVideo(videoRaw) : null,
    insufficientReason: null,
    officialFallbackUrl: OFFICIAL_PORTAL,
    escalation,
  }
}
