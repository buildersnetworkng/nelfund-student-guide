import { getSource, sources } from '../data'
import { classifyIntent } from './intent'
import { retrieveEvidence, retrieveRelevantVideo } from './retrieve'
import type {
  GroundedAnswer, EvidenceItem, AnswerSource, AnswerVideo, IntentId, ConversationTurn, IntentResult,
} from './types'
import { diagnosticAssemble } from './diagnostics'

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
    hasEvidence: false, intent, confidence: intentMeta.confidence, problem: intentMeta.problem,
    answer: "I do not have enough verified information in this guide's knowledge layer to answer that confidently.",
    whatThisMeans: 'This assistant only answers from verified NELFUND information stored in this platform. It will not invent deadlines, amounts, or policies.',
    nextActions: [
      `Check the official NELFUND website: ${OFFICIAL_SITE}`,
      `Check the official application portal: ${OFFICIAL_PORTAL}`,
      'Browse FAQ, Problems, or How to apply on this site for related verified topics.',
    ],
    clarifyingQuestions: clarifying.slice(0, 2),
    evidence: [],
    sources: sources.filter((s) => s.official && s.scope === 'nelfund-wide').map((s) => ({ id: s.id, label: s.label, url: s.url, official: s.official })),
    video: null,
    insufficientReason: 'No sufficiently relevant verified knowledge entry matched this question.',
    officialFallbackUrl: OFFICIAL_PORTAL,
  }
}

export function answerQuestion(
  question: string,
  institutionId: string | null = null,
  history?: ConversationTurn[],
): GroundedAnswer {
  const trimmed = question.trim()
  if (!trimmed) {
    return insufficientAnswer('unknown', {
      intent: 'unknown', confidence: 0, topics: [], problem: null, stage: 'unknown', entities: [], isTroubleshooting: false,
    })
  }
  const intentMeta = classifyIntent(trimmed, history)
  const { intent, confidence } = intentMeta
  const evidence = retrieveEvidence(trimmed, intent, institutionId)
  const strongEvidence = evidence.filter(
    (e) => e.verification_status === 'verified' || e.verification_status === 'may_change' || e.verification_status === 'guidance',
  )

  if ((intent === 'academic-session' || intent === 'deadline') && !strongEvidence.some((e) => e.verification_status === 'verified')) {
    const assembled = diagnosticAssemble(intent, strongEvidence, intentMeta)
    return {
      hasEvidence: true, intent, confidence, problem: intentMeta.problem,
      answer: assembled.answer, whatThisMeans: assembled.whatThisMeans, nextActions: assembled.nextActions,
      clarifyingQuestions: assembled.clarifyingQuestions, evidence: strongEvidence, sources: buildSources(strongEvidence),
      video: null, insufficientReason: null, officialFallbackUrl: OFFICIAL_PORTAL,
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
  const answerText = assembled.answer || strongEvidence[0]?.body || 'See the related verified entries linked below for details.'

  return {
    hasEvidence: true, intent, confidence, problem: intentMeta.problem,
    answer: answerText, whatThisMeans: assembled.whatThisMeans, nextActions: assembled.nextActions,
    clarifyingQuestions: assembled.clarifyingQuestions, evidence: strongEvidence, sources: buildSources(strongEvidence),
    video: videoRaw ? mapVideo(videoRaw) : null, insufficientReason: null, officialFallbackUrl: OFFICIAL_PORTAL,
  }
}
