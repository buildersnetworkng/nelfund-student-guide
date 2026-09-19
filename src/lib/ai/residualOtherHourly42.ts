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
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close|when\s*(will|go).{0,16}(open|start|begin)/i.test(
    q,
  )
}

/**
 * Hour-42 leftover catcher for admin topic `other` (324) and pending-status (70).
 * Focus: empty dashboard / total loans 0, session registration dump, name mismatch,
 * screenshot-only, change of course, and "I don submit" without classic pending words.
 */
export function residualOtherHourly42(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null

  if (
    /wetin\s*(be|na)\s*(nelfund|dis\s*loan|this\s*loan)|why\s*(dem|una|they|fg)\s*(create|form|bring)|purpose\s*of\s*nelfund|nelfund\s*na\s*wetin|wetin\s*nelfund\s*stand\s*for/i.test(
      q,
    )
  ) {
    return hit('what-is-nelfund', 0.92, ['what-is', 'other'], 'Purpose leftover 42', 'exploring', entities)
  }

  if (liveish(q)) {
    return hit('current-information', 0.9, ['open-status', 'other'], 'Live window leftover 42', 'exploring', entities)
  }

  if (
    /email\s*(already|don)\s*(used|exist|register)|registered\s*(last|this)\s*year|account\s*(already|don)\s*(dey|exist)/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.93, ['login', 'other'], 'Email already used leftover 42', 'applying', entities, true)
  }

  if (
    /invalid\s*jamb|jamb\s*(no|not|never|invalid|fail|wahala|reject)|utme\s*(no|not|invalid)|wrong\s*jamb|format\s*(of\s*)?jamb|jamb\s*year/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.92, ['jamb', 'other'], 'JAMB leftover 42', 'applying', entities, true)
  }

  if (
    /school\s*(no|not|never)\s*(dey|show|appear|on\s*(the\s*)?list)|institution\s*(no|not)\s*(found|showing)|my\s*school\s*(no|not)\s*dey/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.9, ['school-list', 'other'], 'School not showing leftover 42', 'applying', entities, true)
  }

  if (
    /name\s*(no|not|never)\s*(match|gree|tally|align)|mismatch\s*(name|dob|date)|date\s*of\s*birth\s*(no|not)\s*(match|gree)|surname\s*(no|not)\s*(match|gree)/i.test(
      q,
    )
  ) {
    return hit(
      'missing-information',
      0.9,
      ['missing', 'other'],
      'Name / DOB mismatch leftover 42',
      'applying',
      entities,
      true,
    )
  }

  if (
    /change\s*(of\s*)?(course|department|faculty|programme|program)|i\s*(don|have)\s*change\s*(course|dept|department)|transfer\s*(student|admission)/i.test(
      q,
    )
  ) {
    return hit(
      'missing-information',
      0.88,
      ['missing', 'other'],
      'Change of course leftover 42',
      'applying',
      entities,
      true,
    )
  }

  if (
    /total\s*loans?\s*(is\s*)?(0|zero|nil)|pending\s*loans?\s*(is\s*)?(0|zero)|approved\s*loans?\s*(is\s*)?(0|zero)|dashboard\s*(empty|blank|zero|nothing)|session\s*registration|welcome\s*to\s*student\s*loan|i\s*no\s*see\s*(any\s*)?(loan|application)\s*(for|on)\s*(my\s*)?(dashboard|portal)/i.test(
      q,
    )
  ) {
    return hit(
      'pending-application',
      0.9,
      ['pending-status', 'other'],
      'Empty dashboard leftover 42',
      'waiting',
      entities,
      true,
    )
  }

  if (
    /how\s*far|money\s*(never|no|not)\s*(enter|drop|show|land|dey)|still\s*pending|under\s*review|when\s*(dem|they|una)\s*(go|will)\s*pay|no\s*alert|i\s*don\s*(apply|submit)|check\s*(my\s*)?(loan|application|status)|name\s*(no|not)\s*dey\s*(the\s*)?(pay\s*)?list|account\s*(empty|blank|zero)|e\s*never\s*(show|enter|drop)|nothing\s*(don|has)\s*(enter|drop|show)|status\s*(na|is|dey)\s*(pending|processing)|i\s*don\s*submit|una\s*dey\s*pay\s*me/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.91, ['pending-status', 'other'], 'Pending leftover 42', 'waiting', entities, true)
  }

  if (
    /screenshot|i\s*(send|don\s*send|go\s*send)\s*(pic|picture|photo|image)|see\s*(the\s*)?(pic|photo|image)|look\s*(this|dis)\s*(pic|photo|screen)/i.test(
      q,
    )
  ) {
    return hit(
      'pending-application',
      0.78,
      ['pending-status', 'other'],
      'Screenshot leftover 42',
      'waiting',
      entities,
      true,
    )
  }

  if (
    /^(nelfund\s*)?(login|sign\s*in|sign\s*up|log\s*in)[.!? ]*$/i.test(q) ||
    /cannot\s*(login|sign\s*in)|forgot\s*(my\s*)?password|portal\s*(no|not)\s*(open|load)/i.test(q)
  ) {
    return hit('portal-login', 0.88, ['login', 'other'], 'Login leftover 42', 'applying', entities, true)
  }

  if (
    /i\s*(wan|want|need)\s*(the\s*)?(loan|nelfund)|give\s*me\s*(the\s*)?(loan|nelfund)|help\s*me\s*(get|collect)\s*(the\s*)?(loan|nelfund)|how\s*(do\s*i|to|i\s*go)\s*(get|collect)\s*nelfund|i\s*need\s*(school\s*)?fee/i.test(
      q,
    ) &&
    !liveish(q)
  ) {
    return hit('how-to-apply', 0.86, ['how-to-apply', 'other'], 'I want loan leftover 42', 'preparing', entities)
  }

  if (/school\s*(never|no|not)\s*(upload|verify)|institution(al)?\s*verif|record\s*(no|not|never)\s*(dey|upload)/i.test(q)) {
    return hit('missing-information', 0.88, ['missing', 'other'], 'School record leftover 42', 'applying', entities, true)
  }

  if (/^(help(\s*me)?|abeg|please\s*help|i\s*need\s*help)[.!? ]*$/i.test(q)) {
    return hit('how-to-apply', 0.62, ['how-to-apply', 'other'], 'Bare help leftover 42', 'preparing', entities)
  }

  return null
}
