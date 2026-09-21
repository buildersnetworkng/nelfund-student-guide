import type { IntentId, IntentResult } from './types'
import { residualOtherHourly83 } from './residualOtherHourly83'

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
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close|loan\s*window|when\s*(will|go)\s*(nelfund|portal)\s*(open|start)/i.test(
    q,
  )
}

/**
 * Hour-82 leftover catcher. Chains hour-83 first.
 * Live 2026-09-21: unknownAi 438, other 324, pending-status 70, jamb 40.
 */
export function residualOtherHourly82(text: string, entities: string[]): IntentResult | null {
  const newer = residualOtherHourly83(text, entities)
  if (newer) return newer

  const q = (text || '').trim()
  if (!q) return null
  const low = q.toLowerCase()

  if (liveish(q)) return null

  if (
    /^(abeg|pls|please|kindly)?\s*(help|assist|guide|orientate)\s*(me)?\s*(now|abeg|pls|please|small)?\.?$|^una\s*fit\s*help\s*(me)?\.?$|^i\s*(just\s*)?(need|wan|want)\s*(ya|your)?\s*help\.?$|^help\s*(me\s*)?(abeg|pls|please)\.?$|^i\s*dey\s*(lost|confused)\.?$|^i\s*no\s*sabi\s*(wetin|where)\s*(to\s*)?(start|begin)?\.?$|^make\s*una\s*guide\s*me\.?$|^how\s*e\s*take\s*be\.?$|^wetin\s*i\s*(suppose|go)\s*do(\s*now)?\??$|^give\s*me\s*(brief|short)\s*(guide|menu)\.?$|^how\s*i\s*(go|fit)\s*(take\s*)?start\.?$|^una\s*fit\s*show\s*me\s*(the\s*)?way\.?$|^i\s*need\s*assistance\.?$|^can\s*you\s*help\s*me\??$|^kindly\s*assist\s*(me)?\.?$/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.9, ['other', 'greeting-vague'], 'Vague Pidgin help leftover 82', 'exploring', entities)
  }

  if (
    /i\s*no\s*know\s*wetin\s*to\s*(ask|type)|i\s*no\s*know\s*where\s*to\s*begin|just\s*help\s*me\s*(with\s*)?(nelfund|dis\s*loan)|orientate\s*me\s*(on\s*)?(nelfund|the\s*loan)|brief\s*me\s*(on\s*)?(nelfund|how\s*e\s*dey)|show\s*me\s*(wetin|what)\s*una\s*(fit|can)\s*do|wetin\s*una\s*fit\s*help\s*me\s*with|i\s*just\s*wan\s*ask\s*something|any\s*help\s*(on\s*)?(nelfund|dis\s*loan)|guide\s*me\s*small|abeg\s*yarn\s*me\s*how\s*e\s*dey/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.88, ['other', 'greeting-vague'], 'Vague orient leftover 82', 'exploring', entities)
  }

  if (
    /how\s*far\s*(with\s*)?(my\s*)?(loan|application|file|own)|my\s*(loan|application|file)\s*(never|no)\s*(move|change|enter)|e\s*never\s*(enter|drop|show|pay)|una\s*never\s*pay\s*(me|am)|dem\s*never\s*pay\s*(me|am)|still\s*no\s*(alert|credit|money)|acct\s*(still\s*)?(empty|quiet)|account\s*still\s*(empty|quiet|zero)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.93, ['pending-status'], 'How far leftover 82', 'waiting', entities, true)
  }

  if (
    /jamb\s*(wahala|palaver|issue|problem)|my\s*jamb\s*(no|not|never)\s*(gree|work|enter)|utme\s*(no|not)\s*(gree|work)|caps\s*(no|not)\s*(gree|match)|direct\s*entry\s*(jamb|utme)\s*(fail|invalid)/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.93, ['jamb'], 'JAMB wahala leftover 82', 'applying', entities, true)
  }

  if (
    /i\s*use\s*(this|dis)\s*email\s*last\s*year|last\s*year\s*(i\s*)?(register|use)\s*(this|dis)\s*email|email\s*don\s*(dey|exist|used)|cannot\s*sign\s*up\s*(again|with\s*(this|dis)\s*mail)|account\s*already\s*dey/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.93, ['login'], 'Email last year leftover 82', 'applying', entities, true)
  }

  if (
    /school\s*no\s*dey\s*(list|drop\s*down|dropdown)|institution\s*no\s*dey|my\s*school\s*missing|school\s*no\s*show\s*(for\s*)?(portal|list)/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.93, ['school-list'], 'School list leftover 82', 'applying', entities, true)
  }

  if (
    /how\s*(i\s*)?(go|to)\s*pay\s*(back|am)|when\s*(i\s*)?(go|will)\s*pay\s*(back|am)|repay(ment)?\s*(start|begin)|after\s*nysc\s*(i\s*)?(go|will)\s*pay/i.test(
      q,
    ) && !/pending|how\s*far|never\s*enter/.test(low)
  ) {
    return hit('repayment', 0.92, ['repayment'], 'Repay leftover 82', 'repaying', entities)
  }

  return null
}
