import { getSource, sources } from '../data'
import { classifyIntent } from './intent'
import { retrieveEvidence, retrieveRelevantVideo } from './retrieve'
import type { GroundedAnswer, EvidenceItem, AnswerSource, AnswerVideo, IntentId } from './types'

const OFFICIAL_PORTAL = 'https://portal.nelf.gov.ng/'
const OFFICIAL_SITE = 'https://nelf.gov.ng/'

function buildSources(evidence: EvidenceItem[]): AnswerSource[] {
  const out: AnswerSource[] = []
  const seen = new Set<string>()

  for (const e of evidence) {
    if (!e.source_id || seen.has(e.source_id)) continue
    seen.add(e.source_id)
    const s = getSource(e.source_id)
    if (s) {
      out.push({ id: s.id, label: s.label, url: s.url, official: s.official })
    } else {
      out.push({
        id: e.source_id,
        label: e.source_id === 'prompt-seed' ? 'Guide notes (general guidance)' : e.source_id,
        url: null,
        official: false,
      })
    }
  }

  for (const s of sources.filter((x) => x.official && x.scope === 'nelfund-wide')) {
    if (seen.has(s.id)) continue
    seen.add(s.id)
    out.push({ id: s.id, label: s.label, url: s.url, official: s.official })
  }

  return out.sort((a, b) => Number(b.official) - Number(a.official))
}

function mapVideo(v: NonNullable<ReturnType<typeof retrieveRelevantVideo>>): AnswerVideo {
  return {
    id: v.id,
    title: v.title,
    url: v.url,
    channel: v.channel,
    source_type: v.source_type,
    verification_status: v.verification_status,
    warning: v.warning,
    freshness_note: v.freshness_note,
  }
}

function assembleFromEvidence(intent: IntentId, evidence: EvidenceItem[]): {
  answer: string
  whatThisMeans: string | null
  nextActions: string[]
} {
  const primary = evidence[0]
  const troubleshooting = evidence.find((e) => e.kind === 'troubleshooting')
  const factOrFaq = evidence.find((e) => e.kind === 'fact' || e.kind === 'faq') || primary
  const guide = evidence.find((e) => e.kind === 'guide')

  let answer = factOrFaq.body
  let whatThisMeans: string | null = null
  const nextActions: string[] = []

  if (troubleshooting) {
    whatThisMeans = troubleshooting.body
    if (troubleshooting.steps?.length) {
      nextActions.push(...troubleshooting.steps.slice(0, 5))
    }
    if (troubleshooting.still_stuck) {
      nextActions.push(troubleshooting.still_stuck)
    }
    if (
      intent === 'school-not-showing' ||
      intent === 'no-school-info' ||
      intent === 'application-pending' ||
      intent === 'application-rejected' ||
      intent === 'already-paid-fees' ||
      intent === 'upkeep-amount'
    ) {
      answer = troubleshooting.body
    }
  }

  if (guide && (intent === 'how-to-apply' || intent === 'documents-needed')) {
    answer = guide.body
    if (guide.steps?.length) {
      nextActions.push(
        'Follow the step-by-step application guide on this site.',
        'Use only the official NELFUND portal for registration and submission.',
        `Open the official portal: ${OFFICIAL_PORTAL}`,
      )
    }
  }

  if (intent === 'official-sources') {
    const portal = sources.find((s) => s.id === 'nelfund-portal')
    const site = sources.find((s) => s.id === 'nelfund-website')
    answer =
      'Use only official NELFUND channels for applications and status checks. Third-party sites and social media posts are not official instructions.'
    nextActions.push(
      site ? `NELFUND website: ${site.url}` : `NELFUND website: ${OFFICIAL_SITE}`,
      portal ? `NELFUND application portal: ${portal.url}` : `NELFUND application portal: ${OFFICIAL_PORTAL}`,
    )
  }

  if (intent === 'scam-safety') {
    const tips = evidence.filter((e) => e.kind === 'scam').map((e) => e.body)
    answer =
      tips[0] ||
      'Do not pay anyone who claims they can process or speed up your NELFUND application. Apply only through the official portal.'
    nextActions.push(...tips.slice(0, 4), `Use only the official portal: ${OFFICIAL_PORTAL}`)
  }

  if (intent === 'readiness') {
    answer =
      'Use the readiness checklist on this guide to prepare your documents (NIN, JAMB, admission details, matriculation number, bank account/BVN). Confirm final requirements on the official NELFUND portal before you apply.'
    nextActions.push(
      'Open the "Am I ready?" checklist on this site.',
      `Confirm requirements on the official portal: ${OFFICIAL_PORTAL}`,
    )
  }

  if (nextActions.length === 0) {
    if (primary.path) {
      nextActions.push(`Read the full guide entry: ${primary.path}`)
    }
    nextActions.push(`Verify on the official NELFUND portal: ${OFFICIAL_PORTAL}`)
  }

  if (primary.verification_status === 'guidance' || primary.verification_status === 'unverified') {
    nextActions.push('Treat this as general guidance and confirm against official NELFUND sources before relying on it.')
  }
  if (primary.verification_status === 'may_change') {
    nextActions.push('This information may change between application cycles. Confirm the current rule on the official portal.')
  }

  return { answer, whatThisMeans, nextActions: dedupeActions(nextActions) }
}

function dedupeActions(actions: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const a of actions) {
    const key = a.trim().toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(a.trim())
  }
  return out.slice(0, 6)
}

function insufficientAnswer(intent: IntentId): GroundedAnswer {
  return {
    hasEvidence: false,
    intent,
    answer:
      'I do not have enough verified information in this guide\'s knowledge layer to answer that confidently.',
    whatThisMeans:
      'This assistant only answers from verified NELFUND information stored in this platform. It will not invent deadlines, amounts, or policies.',
    nextActions: [
      `Check the official NELFUND website: ${OFFICIAL_SITE}`,
      `Check the official application portal: ${OFFICIAL_PORTAL}`,
      'Browse FAQ, Problems, or How to apply on this site for related verified topics.',
    ],
    evidence: [],
    sources: sources
      .filter((s) => s.official && s.scope === 'nelfund-wide')
      .map((s) => ({ id: s.id, label: s.label, url: s.url, official: s.official })),
    video: null,
    insufficientReason:
      'No sufficiently relevant verified knowledge entry matched this question.',
    officialFallbackUrl: OFFICIAL_PORTAL,
  }
}

/**
 * Main entry: student question → grounded answer.
 *
 * Pipeline (hard requirement):
 *   Question → Intent → Retrieval → Evidence → Answer → Source → Action → Video
 *
 * The model\'s general knowledge is never used as a source of NELFUND facts.
 * If retrieval yields insufficient evidence, a transparent fallback is returned.
 */
export function answerQuestion(
  question: string,
  institutionId: string | null = null,
): GroundedAnswer {
  const trimmed = question.trim()
  if (!trimmed) {
    return insufficientAnswer('unknown')
  }

  const { intent, confidence } = classifyIntent(trimmed)
  const evidence = retrieveEvidence(trimmed, intent, institutionId)

  const strongEvidence = evidence.filter(
    (e) =>
      e.verification_status === 'verified' ||
      e.verification_status === 'may_change' ||
      e.verification_status === 'guidance',
  )

  if (strongEvidence.length === 0 || (intent === 'unknown' && evidence[0]?.score < 20)) {
    return insufficientAnswer(intent)
  }

  if (confidence < 0.5 && (evidence[0]?.score ?? 0) < 25) {
    return insufficientAnswer(intent)
  }

  const { answer, whatThisMeans, nextActions } = assembleFromEvidence(intent, strongEvidence)
  const videoRaw = retrieveRelevantVideo(strongEvidence, intent, institutionId)

  return {
    hasEvidence: true,
    intent,
    answer,
    whatThisMeans,
    nextActions,
    evidence: strongEvidence,
    sources: buildSources(strongEvidence),
    video: videoRaw ? mapVideo(videoRaw) : null,
    insufficientReason: null,
    officialFallbackUrl: OFFICIAL_PORTAL,
  }
}
