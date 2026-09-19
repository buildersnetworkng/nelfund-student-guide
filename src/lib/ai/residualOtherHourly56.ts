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

/**
 * Hour-56 leftover catcher.
 * Admin 2026-09-19: unknownAi 438, other 324, pending-status 70, jamb 40, empty 30, open-status 26.
 * Short Pidgin and dashboard-dump follow-ups that still land in other.
 */
export function residualOtherHourly56(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null

  if (
    /how\s*far\s*(na|now|my\s*own|this\s*thing)?\s*$|howfar|wetin\s*dey\s*happen\s*(na)?$|status\s*(no|never|not)\s*(change|move|update)|nothing\s*don\s*(show|enter|drop|change)|e\s*never\s*(enter|drop|show)|mates?\s*don\s*(collect|receive|see\s*money)|my\s*people\s*don\s*collect|una\s*don\s*start\s*payment|dashboard\s*(still\s*)?(pending|empty|blank)|i\s*no\s*see\s*(anything|nothing)\s*(for|on)\s*(the\s*)?(portal|dashboard)/i.test(
      q,
    )
  ) {
    return hit(
      'pending-application',
      0.93,
      ['pending-status', 'other'],
      'How far / nothing don show leftover 56',
      'waiting',
      entities,
      true,
    )
  }

  if (
    /i\s*don\s*pay\s*(school\s*)?fees?\s*(myself|already)|already\s*paid\s*(my\s*)?(school\s*)?fees?|school\s*fees?\s*(don\s*)?pay\s*(already|myself)|refund\s*(my\s*)?(school\s*)?fees?/i.test(
      q,
    )
  ) {
    return hit('refund', 0.92, ['fees', 'other'], 'Already paid school fees leftover 56', 'waiting', entities, true)
  }

  if (
    /jamb\s*no\s*gree|e\s*say\s*(my\s*)?jamb|reject(ed)?\s*(my\s*)?jamb|jamb\s*(wahala|issue|problem)|utme\s*(no|not|never)\s*(verify|valid|work)|direct\s*entry\s*(jamb|number|wahala)/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.93, ['jamb', 'other'], 'JAMB wahala leftover 56', 'applying', entities, true)
  }

  if (
    /school\s*no\s*dey(\s*list)?|school\s*no\s*show|my\s*school\s*no\s*dey|no\s*see\s*(my\s*)?school|institution\s*no\s*dey|school\s*name\s*(no|not)\s*(dey|show)|list\s*no\s*get\s*(my\s*)?school/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.93, ['school-list', 'other'], 'School no dey leftover 56', 'applying', entities, true)
  }

  if (
    /email\s*don\s*dey|dem\s*(don\s*)?use\s*(my\s*)?email|e\s*say\s*email\s*(exist|dey|used)|this\s*email\s*(don|already)\s*(dey|exist)|last\s*year\s*email/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.93, ['login', 'other'], 'Email don dey leftover 56', 'applying', entities, true)
  }

  if (
    /when\s*(una|dem|they)\s*(go|will)\s*open\s*(the\s*)?(loan|upkeep|application)|una\s*go\s*open\s*(loan|am)\s*when|loan\s*never\s*open|upkeep\s*window\s*(open|close)|as\s*of\s*now\s*(nelfund|loan)\s*(open|close)/i.test(
      q,
    )
  ) {
    return hit('current-information', 0.93, ['open-status', 'other'], 'When una go open leftover 56', 'exploring', entities)
  }

  if (
    /part\s*-?time|i\s*no\s*get\s*admission\s*yet|no\s*admission\s*(letter|yet)|100\s*l(evel)?|200\s*l(evel)?|can\s*(a\s*)?(fresher|freshers?)\s*apply/i.test(
      q,
    )
  ) {
    return hit('eligibility', 0.88, ['eligibility', 'other'], 'Part-time / no admission leftover 56', 'exploring', entities)
  }

  if (/passport\s*(photo|photograph)|admission\s*letter\s*(upload|need)|what\s*(document|paper)s?\s*(do\s*i|to)\s*(upload|need)/i.test(q)) {
    return hit('documents-needed', 0.9, ['docs', 'other'], 'Docs upload leftover 56', 'preparing', entities)
  }

  if (/screenshot|i\s*send\s*(am|pic|photo)|look\s*(this|dis)\s*(pic|photo|image)/i.test(q)) {
    return hit('pending-application', 0.7, ['other'], 'Screenshot leftover 56', 'waiting', entities, true)
  }

  if (/^(help|help\s*me|abeg\s*help|i\s*need\s*help)\s*$/i.test(q)) {
    return hit('how-to-apply', 0.58, ['empty', 'other'], 'Bare help leftover 56', 'exploring', entities)
  }

  return null
}
