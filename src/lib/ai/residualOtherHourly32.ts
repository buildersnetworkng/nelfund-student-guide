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
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close|loan\s+(window|application)\s+(open|closed)/i.test(
    q,
  )
}

/** 18 Sep 11:19 WAT: unknownAi 438, other 324, pending-status 70, jamb 40. */
export function residualOtherHourly32(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null

  if (liveish(q)) return null

  if (
    /email\s*(don|has|already)\s*(exist|dey|used)|account\s*(don|already)\s*(dey|exist)|i\s*(don|have)\s*(register|create).{0,20}last\s*year|last\s*year\s*(account|email|portal)/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.9, ['login', 'other'], 'Last year / email exists leftover', 'applying', entities, true)
  }

  if (
    /jamb\s*(no|number)\s*(no|not|never)\s*(gree|work|dey)|my\s*jamb\s*(no|not)\s*(correct|valid)|utme\s*(invalid|fail)/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.88, ['jamb', 'other'], 'JAMB number fail leftover', 'applying', entities, true)
  }

  if (
    /school\s*(no|not|never)\s*dey(\s*show)?|my\s*school\s*no\s*dey|institution\s*no\s*dey|dem\s*no\s*put\s*(my\s*)?school/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.88, ['school-list', 'other'], 'School no dey leftover', 'applying', entities, true)
  }

  if (
    /^(my\s*)?(loan|application|nelfund|file)[.!? ]*$/i.test(q) ||
    /about\s*(my\s*)?(loan|application|file)|wetin\s*about\s*(my\s*)?(loan|application)|how\s*far\s*(with\s*)?(my\s*)?(own|own\s*one)/i.test(
      q,
    )
  ) {
    return hit(
      'pending-application',
      0.8,
      ['pending-status', 'other'],
      'My loan / application leftover',
      'waiting',
      entities,
      true,
    )
  }

  if (/direct\s*entry|\bde\s*student\b|i\s*be\s*de\b|jamb\s*de\b/i.test(q) && !/pending|how\s*far/.test(q)) {
    return hit('jamb-verification', 0.84, ['jamb', 'other'], 'Direct Entry leftover', 'preparing', entities, true)
  }

  if (
    /create\s*(an?\s*)?account|sign\s*up\s*(or|vs|versus)\s*(sign\s*in|login)|difference\s*(between\s*)?(sign\s*up|login)/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.84, ['login', 'other'], 'Create account vs login leftover', 'applying', entities)
  }

  if (/2026\s*\/\s*2027|2025\s*\/\s*2026|next\s*(academic\s*)?session|this\s*session\s*(loan|apply)/i.test(q)) {
    return hit('academic-session', 0.8, ['session', 'other'], 'Which session leftover', 'preparing', entities)
  }

  if (/i\s*don\s*apply(\s*already)?|already\s*apply|application\s*don\s*go/i.test(q)) {
    return hit(
      'pending-application',
      0.82,
      ['pending-status', 'other'],
      'Already applied leftover',
      'waiting',
      entities,
      true,
    )
  }

  if (/undergraduate\s*only|only\s*undergrad|phd|doctorate|law\s*school/i.test(q) && /eligib|qualify|fit|can\s*i/i.test(q)) {
    return hit('eligibility', 0.84, ['eligibility', 'other'], 'Degree type leftover', 'exploring', entities)
  }

  if (/admission\s*letter\s*(no|not|never)|scan\s*(my\s*)?admission|upload\s*admission/i.test(q)) {
    return hit(
      'documents-needed',
      0.84,
      ['documents', 'other'],
      'Admission letter leftover',
      'preparing',
      entities,
      true,
    )
  }

  if (/my\s*money|una\s*never\s*give\s*me|i\s*never\s*collect|dem\s*never\s*give\s*me/i.test(q)) {
    return hit(
      'pending-application',
      0.84,
      ['pending-status', 'other'],
      'My money / never collect leftover',
      'waiting',
      entities,
      true,
    )
  }

  if (/pls\s*help|please\s*help\s*(me\s*)?(with\s*)?(nelfund|loan|portal)|abeg\s*help\s*(me\s*)?(with\s*)?(nelfund|loan)/i.test(q)) {
    return hit('how-to-apply', 0.7, ['how-to-apply', 'other'], 'Please help with NELFUND leftover', 'preparing', entities)
  }

  return null
}
