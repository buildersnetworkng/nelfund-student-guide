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
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close|loan\s*window|when\s*(will|go)\s*(nelfund|portal)\s*(open|start)/i.test(
    q,
  )
}

/**
 * Hour-90 leftover catcher.
 * Live 2026-09-21: unknownAi 438, other 324, pending-status 70, jamb 40.
 * New pending payout and "approved but no money" shapes. Skip live-status and purpose.
 */
export function residualOtherHourly90(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  const low = q.toLowerCase()

  if (liveish(q)) return null
  if (/what\s*is\s*nelfund|wetin\s*be\s*nelfund|purpose\s*of|why\s*dem\s*create/i.test(q)) return null

  if (
    /e\s*still\s*dey\s*(pending|processing)|still\s*pending\s*since|dem\s*never\s*pay\s*me|account\s*never\s*(see|show)\s*(the\s*)?(money|upkeep)|i\s*don\s*apply\s*but\s*nothing\s*(dey\s*)?happen|status\s*(no|never)\s*(change|move|update)|approved\s*but\s*(money|upkeep|alert)\s*(no|never)|how\s*long\s*(will|go)\s*(pending|this)\s*take|when\s*(will|go)\s*(they|dem)\s*pay\s*me|nothing\s*don\s*enter\s*(my\s*)?(account|bank)|bank\s*(never|no)\s*(alert|credit)|i\s*see\s*approved\s*but\s*(no|never)\s*(pay|money)|pending\s*for\s*(weeks|months)|e\s*never\s*leave\s*(that\s*)?(pending|review)|dem\s*pay\s*my\s*padi.{0,16}(i|me)\s*(never|no)|school\s*don\s*confirm.{0,20}(money|upkeep)\s*(no|never)|dashboard\s*still\s*(say|dey)\s*(pending|processing)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.93, ['pending-status'], 'Pending payout leftover 90', 'waiting', entities, true)
  }

  if (
    /jamb\s*(reg(istration)?\s*)?(no|not|never)\s*(work|gree|pass)|wrong\s*jamb(\s*number)?|jamb\s*reject|utme\s*(number\s*)?(invalid|fail)|portal\s*(no|not)\s*(accept|gree)\s*(my\s*)?jamb|verification\s*(no|not)\s*(pass|gree).{0,12}jamb/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.93, ['jamb'], 'JAMB leftover 90', 'applying', entities, true)
  }

  if (
    /this\s*mail\s*(don|has)\s*(already\s*)?(exist|dey)|email\s*don\s*(dey|exist)|i\s*use\s*(this\s*)?(same\s*)?(mail|email)\s*last\s*(year|session)|cannot\s*sign\s*up\s*with\s*(this\s*)?(mail|email)|account\s*already\s*exist/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.93, ['other', 'email-used'], 'Email used leftover 90', 'applying', entities, true)
  }

  if (
    /my\s*school\s*(name\s*)?(no|not)\s*(dey|show|appear)|institution\s*(no|not)\s*(dey|show)\s*(for|on)\s*(the\s*)?(list|portal)|i\s*no\s*see\s*(my\s*)?(school|institution)|dropdown\s*(no|not)\s*(get|show)\s*(my\s*)?school/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.93, ['school-list'], 'School list leftover 90', 'applying', entities, true)
  }

  if (
    /wetin\s*una\s*fit\s*help|i\s*just\s*dey\s*here|abeg\s*guide\s*me|help\s*me\s*abeg(\s*now)?$|make\s*una\s*help\s*small|i\s*no\s*sure\s*where\s*to\s*start/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.9, ['other', 'vague-help'], 'Vague help leftover 90', 'exploring', entities, false)
  }

  if (/pending|under\s*review|money\s*(never|no)|how\s*far\s*(my|with)|jamb|utme|school\s*(not|no)\s*(show|dey)|email\s*(already|used)|repay/i.test(low)) {
    return null
  }

  return null
}
