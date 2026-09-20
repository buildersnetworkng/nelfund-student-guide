import type { IntentId, IntentResult } from './types'
import { residualOtherHourly72 } from './residualOtherHourly72'

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
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close|loan\s*window/i.test(
    q,
  )
}

/**
 * Hour-71 leftover catcher plus Hour-72 first.
 */
export function residualOtherHourly71(text: string, entities: string[]): IntentResult | null {
  const newer = residualOtherHourly72(text, entities)
  if (newer) return newer

  const q = (text || '').trim()
  if (!q) return null
  if (liveish(q) && !/pending|how\s*far|never\s*enter|processing|under\s*review/.test(q.toLowerCase())) {
    return null
  }

  if (
    /nothing\s*(don|has|have)\s*(drop|enter|show|come)|e\s*no\s*(show|enter|drop)\s*(for|in)\s*(my\s*)?(account|bank|phone)|account\s*(still\s*)?(empty|blank|zero)|i\s*never\s*collect\s*(anything|am|my\s*own)|file\s*dey\s*sleep|stuck\s*(on|for)\s*(pending|submitted|review)|portal\s*(still\s*)?show(s|ing)?\s*(pending|submitted|processing)|dashboard\s*(still\s*)?(say|show|dey)\s*(pending|0|zero)|total\s*loans?\s*(still\s*)?(0|zero)|no\s*movement\s*(for|on)\s*(my\s*)?(loan|file)|application\s*hang|hang\s*for\s*pending/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.93, ['pending-status'], 'Pending leftover 71', 'waiting', entities, true)
  }

  if (
    /wetin\s*(dey\s*)?happen\s*(to|with)\s*(my\s*)?(loan|application|file|own)|any\s*news\s*(on|about)\s*(my\s*)?(loan|application)|where\s*(my\s*)?(application|loan)\s*(reach|dey)|what\s*is\s*(the\s*)?(status|state)\s*of\s*(my\s*)?(loan|application)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.93, ['pending-status', 'how-far'], 'How far leftover 71', 'waiting', entities, true)
  }

  if (
    /jamb\s*(reg(istration)?|id|no\.?|number)\s*(is\s*)?(wrong|invalid|reject|fail)|portal\s*(say|says|dey\s*say)\s*(invalid|wrong)\s*jamb|jamb\s*verification\s*(error|fail|failed)/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.93, ['jamb'], 'JAMB leftover 71', 'applying', entities, true)
  }

  if (
    /this\s*email\s*(don|has|have)\s*(dey|exist|been\s*used)|cannot\s*sign\s*up\s*(with\s*)?(this\s*)?(mail|email)|i\s*get\s*account\s*before|i\s*don\s*register\s*(before|already)|old\s*account\s*(dey|exist)/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.93, ['login'], 'Login leftover 71', 'applying', entities, true)
  }

  if (
    /school\s*(name\s*)?(no|not)\s*(appear|come\s*out|dey\s*there)|search\s*(my\s*)?school\s*(no|not)\s*(show|come)|institution\s*(no|not)\s*(appear|dey)|my\s*uni\s*(no|not)\s*dey/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.93, ['school-list'], 'School leftover 71', 'applying', entities, true)
  }

  return null
}
