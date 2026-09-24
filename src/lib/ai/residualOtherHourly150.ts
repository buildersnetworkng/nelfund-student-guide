import type { IntentId, IntentResult } from './types'
import { residualOtherHourly151 } from './residualOtherHourly151'

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
 * Hourly 150 2026-09-24: leftover other bucket.
 * Formal, casual, Pidgin, fragments, typos. Never invent policy.
 */
export function residualOtherHourly150(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  try {
    const newer = residualOtherHourly151(q, entities)
    if (newer && newer.intent !== 'unknown') return newer
  } catch {
    /* optional */
  }
  if (liveish(q)) return null
  if (/what\s*is\s*nelfund|wetin\s*be\s*nelfund|purpose\s*of\s*(the\s*)?(scheme|loan)|why\s*dem\s*create/i.test(q))
    return null

  if (
    /please\s*(i\s*)?need\s*(a\s*)?(short\s*)?(menu|list|options)|kindly\s*(list|show)\s*(topics|options)|what\s*can\s*this\s*(bot|guide|ai)\s*do|wetin\s*this\s*(bot|guide)\s*sabi|i\s*no\s*know\s*wetin\s*to\s*ask\s*here|make\s*una\s*show\s*topics|give\s*me\s*topics\s*(abeg|pls)|i\s*just\s*open\s*(this\s*)?(page|site|chat)|first\s*visit\s*(abeg|pls)?|i\s*land\s*now|i\s*just\s*come\s*here|how\s*una\s*take\s*help\s*students|student\s*guide\s*(abeg|pls)|use\s*this\s*chat\s*how|wetin\s*be\s*this\s*page|explain\s*this\s*guide\s*small|i\s*need\s*a\s*compass|point\s*me\s*to\s*the\s*right\s*place|where\s*do\s*i\s*begin\s*on\s*this\s*site|i\s*am\s*lost\s*on\s*this\s*page|kindly\s*orient\s*me\s*please|biko\s*show\s*me\s*options|oga\s*wetin\s*una\s*dey\s*do\s*here|i\s*wan\s*use\s*una\s*help|make\s*we\s*start\s*from\s*zero|start\s*me\s*from\s*zero|onboard\s*me\s*abeg|i\s*need\s*a\s*map|give\s*direction\s*abeg/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.9, ['other', 'greeting-vague'], 'Vague menu leftover 150', 'exploring', entities)
  }

  if (
    /my\s*(file|application|loan)\s*(still\s*)?(dey|is)\s*(there|pending|same)|e\s*still\s*dey\s*same\s*place|status\s*never\s*change|dem\s*never\s*touch\s*my\s*file|una\s*never\s*do\s*my\s*own|when\s*una\s*go\s*look\s*my\s*file|i\s*don\s*wait\s*(tire|well)|waiting\s*since\s*(january|feb|march|april|may|june|july|august|sept|oct|nov|dec)|from\s*last\s*(batch|cycle)\s*till\s*now|my\s*mates\s*don\s*see\s*theirs|others\s*don\s*collect\s*mine\s*never|kobo\s*never\s*enter\s*my\s*account|no\s*alert\s*at\s*all|disbursement\s*pending|payment\s*pending\s*since|approved\s*no\s*pay|approved\s*without\s*credit/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.92, ['pending-status'], 'Pending leftover 150', 'waiting', entities, true)
  }

  if (
    /jamb\s*(profile|record)\s*(no|not|never)|portal\s*reject\s*(my\s*)?jamb|cannot\s*link\s*jamb|link\s*jamb\s*(fail|no\s*gree)|utme\s*wahala|caps\s*status\s*(no|not)|admission\s*no\s*dey\s*match|jamb\s*and\s*nelfund\s*(no|not)\s*match|wrong\s*jamb\s*number\s*entered|i\s*type\s*jamb\s*wrong|correct\s*my\s*jamb\s*abeg|edit\s*jamb\s*(number|reg)/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.92, ['jamb'], 'JAMB leftover 150', 'applying', entities, true)
  }

  if (
    /how\s*(do\s*they|dem)\s*(recover|collect)\s*(the\s*)?loan|when\s*repayment\s*go\s*start|repayment\s*after\s*(school|graduation|nysc)|do\s*i\s*pay\s*while\s*(in\s*school|serving)|interest\s*(rate|free)\s*repay|how\s*many\s*years\s*to\s*repay|gsi\s*(mandate|wahala)|salary\s*will\s*(they|dem)\s*cut|payback\s*period|loan\s*tenor|tenor\s*of\s*(the\s*)?loan|i\s*no\s*wan\s*owe|after\s*i\s*finish\s*school\s*how\s*pay/i.test(
      q,
    )
  ) {
    return hit('repayment', 0.91, ['repayment'], 'Repay leftover 150', 'repaying', entities)
  }

  if (
    /my\s*school\s*(no|not)\s*(on|in)\s*(the\s*)?(dropdown|select)|cannot\s*select\s*(my\s*)?(school|institution)|institution\s*field\s*(empty|blank)|search\s*school\s*(no|not)\s*find|type\s*school\s*name\s*nothing\s*show|polytechnic\s*(no|not)\s*listed|college\s*(no|not)\s*listed|my\s*faculty\s*no\s*dey|campus\s*name\s*missing/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.92, ['school-list'], 'School leftover 150', 'applying', entities, true)
  }

  if (
    /this\s*email\s*has\s*already\s*been\s*(used|taken|registered)|mail\s*already\s*in\s*use|i\s*registered\s*last\s*session|previous\s*year\s*account|old\s*portal\s*account|cannot\s*create\s*another\s*account|sign\s*up\s*says?\s*email\s*exist|otp\s*no\s*reach\s*mail|password\s*reset\s*no\s*gree|i\s*forget\s*the\s*mail\s*i\s*use|which\s*mail\s*i\s*use\s*before/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.93, ['login'], 'Email leftover 150', 'applying', entities, true)
  }

  if (
    /how\s*(do\s*i|to)\s*start\s*(the\s*)?application\s*process|application\s*procedure|procedure\s*to\s*apply|kindly\s*walk\s*me\s*through\s*registration|i\s*need\s*the\s*steps\s*to\s*register|register\s*me\s*how|how\s*person\s*go\s*take\s*collect\s*this\s*loan|collect\s*the\s*loan\s*how|i\s*wan\s*fill\s*form|form\s*filling\s*guide/i.test(
      q,
    )
  ) {
    return hit('how-to-apply', 0.9, ['other', 'apply'], 'Apply leftover 150', 'applying', entities)
  }

  if (
    /who\s*is\s*allowed\s*to\s*apply|can\s*part[- ]?time\s*students?\s*apply|does\s*(hnd|nd|nce)\s*qualify|postgraduate\s*(loan|apply)|masters?\s*student\s*(fit|can)|i\s*dey\s*final\s*year\s*(fit|can)\s*apply|freshers?\s*(fit|can)\s*apply|direct\s*entry\s*(fit|can)/i.test(
      q,
    )
  ) {
    return hit('eligibility', 0.91, ['other', 'eligibility'], 'Eligibility leftover 150', 'exploring', entities)
  }

  if (
    /^(hmm+|hmmm+|ok(ay)?\s*na|ehn+|abi|shey|ba|k|kk|yo+)\s*[.!?]*$/i.test(q) ||
    /^(help\s*me\s*oo+|abeg\s*na+|pls\s*oo+)\s*[.!?]*$/i.test(q)
  ) {
    return hit('official-sources', 0.78, ['other', 'greeting-vague'], 'Fragment leftover 150', 'exploring', entities)
  }

  return null
}
