/**
 * v5-journey gate: cancel/dispute precedence + matchJourneyKnowledge
 * Called from processTurn after official-host safety.
 */
import { matchPortalKnowledge } from './portalKnowledge'
import { matchJourneyKnowledge } from './journeyKnowledge'
import { isInstitutionalLoanActionScreen } from './screenshotUnderstand'
import type { IntentId } from './types'
import type { ConversationSlots, AgentTurnResult } from './conversation'

type WrapFn = (
  userText: string,
  slots: ConversationSlots,
  intent: IntentId,
  text: string,
) => AgentTurnResult

/** Returns an AgentTurnResult if handled, else null. */
export function tryJourneyOrCancelGate(
  raw: string,
  ocr: string,
  rawIn: string,
  slots: ConversationSlots,
  wrap: WrapFn,
): AgentTurnResult | null {
  // Cancel / pre-submit fee-dispute keep portal precedence over journey amount answers
  if (
    raw &&
    (/how\s*(do\s*i\s*|to\s*)?cancel|cancel\s*(my\s*)?(loan|application)|should\s*i\s*cancel|can\s*i\s*cancel|re-?apply\s*after\s*cancel|\bcancel\b.{0,35}\bpay\s*school\b/i.test(raw) ||
      /raise\s*(a\s*)?dispute|fee\s*dispute|wrong\s*(fee|amount).{0,30}(before\s*)?submit/i.test(raw))
  ) {
    const portalHit = matchPortalKnowledge(raw)
    if (portalHit) {
      return wrap(raw, slots, portalHit.intent as IntentId, portalHit.text)
    }
  }

  // Post-application journey: Pay School, Verified, amount vs school fees
  const journeyBlob = `${raw || ''} ${ocr || ''}`.trim()
  if (journeyBlob) {
    const journey = matchJourneyKnowledge(journeyBlob)
    if (journey) {
      return wrap(
        raw || rawIn || '[screenshot]',
        { ...slots, intent: journey.intent as IntentId },
        journey.intent as IntentId,
        journey.text,
      )
    }
  }
  return null
}

/** OCR: Pay School / Action Required / loan Verified (not JAMB). */
export function tryOcrJourneyGate(
  raw: string,
  ocr: string,
  slots: ConversationSlots,
  wrap: WrapFn,
): AgentTurnResult | null {
  if (ocr.length < 8) return null
  const screenshotText = `${raw || ''} ${ocr}`.trim()
  const ocrJourney = matchJourneyKnowledge(screenshotText)
  if (ocrJourney && isInstitutionalLoanActionScreen(screenshotText)) {
    return wrap(
      raw || '[Screenshot uploaded]',
      { ...slots, intent: ocrJourney.intent as IntentId },
      ocrJourney.intent as IntentId,
      ocrJourney.text,
    )
  }
  return null
}
