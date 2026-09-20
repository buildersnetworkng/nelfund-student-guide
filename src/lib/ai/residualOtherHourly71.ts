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
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close|loan\s*window/i.test(
    q,
  )
}

/**
 * Hour-71 leftover catcher.
 * Live 2026-09-20: unknownAi 438, other 324, pending-status 70, jamb 40.
 * Extra sentence shapes for pending / how far / money never enter.
 */
export function residualOtherHourly71(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  if (liveish(q) && !/pending|how\s*far|never\s*enter|processing|under\s*review/.test(q.toLowerCase())) {
    return null
  }

  if (
    /nothing\s*(don|has|have)\s*(drop|enter|show|come)|e\s*no\s*(show|enter|drop)\s*(for|in)\s*(my\s*)?(account|bank|phone)|account\s*(still\s*)?(empty|blank|zero)|zero\s*(naira|balance)\s*(for|on)\s*(my\s*)?(loan|upkeep)|i\s*never\s*collect\s*(anything|am|my\s*own)|collect\s*(my\s*)?(own|money)\s*abeg|una\s*forget\s*(my\s*)?(file|own|application)|my\s*name\s*(no|not)\s*dey\s*(the\s*)?(list|batch)|name\s*no\s*dey\s*list|tinubu\s*(never|no)\s*pay\s*me|batch\s*(pass|don\s*pass)\s*(me|my\s*own)|i\s*miss\s*(the\s*)?batch|dem\s*skip\s*(my\s*)?(name|file)|skip\s*my\s*application|file\s*dey\s*sleep|my\s*file\s*(dey|is)\s*(sleep|stuck|freeze|frozen)|stuck\s*(on|for)\s*(pending|submitted|review)|freeze\s*(for|on)\s*(pending|portal)|portal\s*(still\s*)?show(s|ing)?\s*(pending|submitted|processing)|dashboard\s*(still\s*)?(say|show|dey)\s*(pending|0|zero)|total\s*loans?\s*(still\s*)?(0|zero)|session\s*registration\s*(pending|blank)|i\s*don\s*wait\s*(too\s*)?(long|plenty)|wait\s*don\s*too\s*much|e\s*don\s*taka\s*(time|long)|since\s*(last\s*)?(session|semester)\s*(nothing|never)|last\s*session\s*(i\s*)?apply\s*(nothing|never)|apply\s*finish\s*(nothing|never)\s*(show|enter)|i\s*submit\s*(finish|already)\s*(e\s*)?never\s*(move|change)|submit\s*don\s*do\s*(nothing|no\s*change)|no\s*movement\s*(for|on)\s*(my\s*)?(loan|file)|movement\s*no\s*dey|progress\s*bar\s*(no|not)\s*(move|dey)|in\s*progress\s*since|been\s*in\s*progress|application\s*hang|loan\s*hang\s*(for|on)\s*portal|hang\s*for\s*pending/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.94, ['pending-status'], 'Pending leftover 71', 'waiting', entities, true)
  }

  if (
    /wetin\s*(dey\s*)?happen\s*(to|with)\s*(my\s*)?(loan|application|file|own)|wetin\s*una\s*dey\s*do\s*(with\s*)?(my\s*)?(file|loan)|una\s*see\s*(my\s*)?(file|application)|have\s*(you|una)\s*(seen|look)\s*(my\s*)?(file|application)|look\s*(into|at)\s*(my\s*)?(loan|file)|follow\s*up\s*(on\s*)?(my\s*)?(loan|application)|i\s*wan\s*(follow\s*up|check\s*up)|followup\s*(my\s*)?(loan|app)|any\s*news\s*(on|about)\s*(my\s*)?(loan|application)|news\s*(about\s*)?(my\s*)?(money|upkeep)|update\s*(on|for)\s*(my\s*)?(application|loan|file)|give\s*me\s*(status|update)\s*(abeg)?|status\s*update\s*(abeg|pls|please)?|what\s*is\s*(the\s*)?(status|state)\s*of\s*(my\s*)?(loan|application)|state\s*of\s*(my\s*)?(application|loan)|where\s*(my\s*)?(application|loan)\s*(reach|dey)|my\s*(loan|application)\s*(reach|dey)\s*where|how\s*(far|e)\s*take\s*(my\s*)?(own|application)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.93, ['pending-status', 'how-far'], 'How far leftover 71', 'waiting', entities, true)
  }

  if (
    /jamb\s*(reg(istration)?|id|no\.?|number)\s*(is\s*)?(wrong|invalid|reject|fail)|portal\s*(say|says|dey\s*say)\s*(invalid|wrong)\s*jamb|caps\s*(no|not)\s*(match|gree)|admission\s*(letter\s*)?(jamb|number)\s*(no|not)\s*(work|gree)|old\s*jamb\s*(no|not)\s*(work|gree)|direct\s*entry\s*jamb\s*(fail|invalid)|utme\s*(reg|number)\s*(fail|invalid)|jamb\s*verification\s*(error|fail|failed)/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.93, ['jamb'], 'JAMB leftover 71', 'applying', entities, true)
  }

  if (
    /this\s*email\s*(don|has|have)\s*(dey|exist|been\s*used)|mail\s*(una|dem)\s*say\s*(don\s*)?(use|exist)|cannot\s*sign\s*up\s*(with\s*)?(this\s*)?(mail|email)|sign\s*up\s*(no|not)\s*(gree|work).{0,20}(email|mail)|i\s*get\s*account\s*before|i\s*don\s*register\s*(before|already)|old\s*account\s*(dey|exist)/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.93, ['login'], 'Login leftover 71', 'applying', entities, true)
  }

  if (
    /school\s*(name\s*)?(no|not)\s*(appear|come\s*out|dey\s*there)|search\s*(my\s*)?school\s*(no|not)\s*(show|come)|institution\s*(no|not)\s*(appear|dey)|poly\s*(no|not)\s*dey\s*(the\s*)?list|coe\s*(no|not)\s*dey\s*(the\s*)?list|my\s*uni\s*(no|not)\s*dey/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.93, ['school-list'], 'School leftover 71', 'applying', entities, true)
  }

  return null
}
