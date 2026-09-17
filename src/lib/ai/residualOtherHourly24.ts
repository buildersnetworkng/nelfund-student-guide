import type { IntentId, IntentResult } from './types'

function hit(
  intent: IntentId,
  confidence: number,
  topics: string[],
  problem: string,
  stage: IntentResult['stage'],
  entities: string[],
  isTroubleshooting = false,
): IntentResult {
  return { intent, confidence, topics, problem, stage, entities, isTroubleshooting }
}

function liveish(q: string): boolean {
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close/i.test(q)
}

/** 17 Sep 21:15 WAT: other 324, pending-status 70, jamb 40, empty 30, open-status 26. */
export function residualOtherHourly24(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  const low = q.toLowerCase()

  if (liveish(q)) return null

  if (
    /dem\s*never\s*(pay|credit|send)|nobody\s*(pay|credit)\s*me|no\s*alert|account\s*(still\s*)?(empty|dry)|money\s*no\s*(drop|land|enter)|i\s*no\s*see\s*(alert|credit)|when\s*(dem|they)\s*(go|will)\s*pay\s*me/i.test(
      q,
    )
  ) {
    return hit(
      'pending-application',
      0.88,
      ['pending-status', 'other', 'no-alert'],
      'No alert / never pay leftover',
      'waiting',
      entities,
      true,
    )
  }

  if (/next\s*batch|last\s*batch|batch\s*\d+|when\s*(is|be)\s*(the\s*)?batch/i.test(q)) {
    return hit(
      'pending-application',
      0.86,
      ['pending-status', 'other', 'batch'],
      'Batch rumour leftover',
      'waiting',
      entities,
      true,
    )
  }

  if (/apply\s*(again|am\s*again)|second\s*(time|application)|last\s*(year|session)\s*(i\s*)?(apply|applied)|reapply|re-apply/i.test(q)) {
    return hit('reapplication', 0.86, ['other', 'reapply'], 'Apply again leftover', 'applying', entities)
  }

  if (/change\s*(my\s*)?school|transfer\s*(to|from)|i\s*(wan|want)\s*move\s*school|wrong\s*school/i.test(q)) {
    return hit('profile-update', 0.86, ['other', 'school-change'], 'Change school leftover', 'applying', entities, true)
  }

  if (/\b(bvn)\b.{0,24}(not|no|never|mismatch|invalid|fail|error)|bvn\s*(issue|problem|wahala)/i.test(q)) {
    return hit('missing-information', 0.88, ['other', 'bvn'], 'BVN leftover', 'applying', entities, true)
  }

  if (/\bnin\b.{0,24}(not|no|never|mismatch|invalid|fail|error)|nin\s*(issue|problem|wahala)/i.test(q)) {
    return hit('nin-verification', 0.88, ['other', 'nin'], 'NIN leftover', 'applying', entities, true)
  }

  if (/direct\s*entry|\bde\s*student|jamb\s*de\b/i.test(q)) {
    return hit('eligibility', 0.84, ['eligibility', 'other', 'direct-entry'], 'Direct entry leftover', 'exploring', entities)
  }

  if (/post\s*graduate|postgraduate|\bmasters?\b|\bmsc\b|\bphd\b|pgd\b/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.84, ['eligibility', 'other', 'pg'], 'Postgraduate leftover', 'exploring', entities)
  }

  if (/jamb\s*(profile|record|data|cap).{0,16}(not|no|never)\s*(show|dey|appear)|utme\s*(profile|record)\s*(blank|empty)/i.test(q)) {
    return hit('jamb-verification', 0.88, ['jamb', 'other'], 'JAMB profile leftover', 'applying', entities, true)
  }

  if (/wetin\s*remain|wetin\s*next|i\s*don\s*submit|after\s*i\s*apply\s*wetin/i.test(q) && !/open|deadline/.test(low)) {
    return hit('pending-application', 0.8, ['pending-status', 'other', 'after-submit'], 'After submit leftover', 'waiting', entities, true)
  }

  if (/^(ok|okay|k|thanks|thank\s*you|ok\s*sir|ok\s*ma)[.!? ]*$/i.test(q)) {
    return hit('official-sources', 0.45, ['empty', 'greeting-vague'], 'Ack leftover', 'unknown', entities)
  }

  return null
}
