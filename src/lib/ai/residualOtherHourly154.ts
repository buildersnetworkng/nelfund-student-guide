import type { IntentId, IntentResult } from './types'
import { residualOtherHourly153 } from './residualOtherHourly153'

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
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s+today|can\s*i\s*still\s*apply|closing\s*date|loan\s*window|account\s*creation\s*(open|close)/i.test(
    q,
  )
}

/**
 * Hourly 154 2026-09-24: leftover admin unknown buckets
 * (other, pending-status, jamb, empty, open-status, repayment, greeting-vague).
 * Formal / Pidgin / fragments. Never invent policy or amounts.
 */
export function residualOtherHourly154(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return hit('official-sources', 0.45, ['empty'], 'Empty residual 154', 'unknown', entities)

  try {
    const newer = residualOtherHourly153(q, entities)
    if (newer && newer.intent !== 'unknown') return newer
  } catch {
    /* optional */
  }

  if (liveish(q)) {
    return hit('current-information', 0.9, ['open-status'], 'Hourly 154 open / deadline', 'exploring', entities)
  }

  if (
    /see\s*(this\s*)?(screenshot|picture|photo|image)|check\s*(this\s*)?(screenshot|pic|photo)|look\s*at\s*(my\s*)?(dashboard|portal|status)|i\s*(send|sent|drop)\s*(screenshot|pic)|wetin\s*(this|dis)\s*(status|page)\s*mean|total\s*loans.{0,40}pending|dashboard\s*(dey\s*)?(show|shows)\s*(0|zero|pending)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.88, ['pending-status'], 'Hourly 154 screenshot / dashboard dump', 'waiting', entities, true)
  }

  if (
    /documents?\s*(i\s*)?(need|required|dey\s*need)|wetin\s*(una|i)\s*need\s*(to\s*)?(upload|carry|bring)|which\s*(papers|docs)|nin\s*(and|,)\s*bvn|what\s*do\s*i\s*need\s*to\s*(apply|register)/i.test(
      q,
    )
  ) {
    return hit('how-to-apply', 0.86, ['apply'], 'Hourly 154 documents / what to carry', 'applying', entities)
  }

  if (
    /when\s*(dem|they|una)\s*(go|will)\s*(start\s*)?(collect|debit|cut)|salary\s*(deduct|cut)|employer\s*(go|will)\s*(cut|deduct)|how\s*(many|much)\s*years?\s*(to\s*)?pay\s*back/i.test(
      q,
    )
  ) {
    return hit('repayment', 0.88, ['repayment'], 'Hourly 154 repayment leftover', 'repaying', entities)
  }

  if (
    /^(wetin|what)\s*(una|you)\s*(dey|are)\s*(do|here)|who\s*(be|are)\s*(you|una)|wetin\s*(fit|can)\s*i\s*ask|talk\s*to\s*me|yarn\s*me\s*something$/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.8, ['greeting-vague'], 'Hourly 154 vague greeting', 'exploring', entities)
  }

  if (
    /private\s*(uni|university|school)\s*(fit|can|eligible)|is\s*(noun|open\s*university)\s*(eligible|qualify)|part[\s-]*time\s*(fit|can)|sandwich\s*(fit|can)/i.test(
      q,
    )
  ) {
    return hit('eligibility', 0.88, ['eligibility'], 'Hourly 154 eligibility leftover', 'exploring', entities)
  }

  return null
}
