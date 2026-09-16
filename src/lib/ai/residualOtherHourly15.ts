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
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close/i.test(q)
}

/** 17 Sep 00:00 WAT hourly: topUnknownTopics.other 324, pending-status 70, jamb 40. */
export function residualOtherHourly15(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  const low = q.toLowerCase()

  if (liveish(q)) return null

  if (/transfer\s*student|inter[-\s]*university\s*transfer|i\s*(just\s*)?transfer(red)?|change\s*of\s*institution/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('missing-information', 0.86, ['missing', 'other', 'transfer'], 'Transfer / COI leftover', 'applying', entities, true)
  }

  if (/already\s*graduat|i\s*(don|have)\s*finish(ed)?\s*(school|uni)|alumni|i\s*(no|not)\s*(dey|am)\s*(for|in)\s*school\s*again/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.86, ['eligibility', 'other', 'alumni'], 'Already graduated leftover', 'exploring', entities)
  }

  if (/\b(ijmb|jupeb|pre[-\s]*degree|remedial|preliminary)\b/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.86, ['eligibility', 'other', 'predegree'], 'IJMB/JUPEB/pre-degree leftover', 'exploring', entities)
  }

  if (/defer(ment|red)?|i\s*defer\s*(my\s*)?(admission|session)|rusticat|withdrawn|suspension|i\s*(no|not)\s*dey\s*class/i.test(q) && !/how\s*far/.test(low)) {
    return hit('eligibility', 0.84, ['eligibility', 'other', 'defer'], 'Defer / withdrawn leftover', 'exploring', entities)
  }

  if (/applied\s*last\s*(year|session)|last\s*session\s*(i\s*)?apply|apply\s*again|second\s*application|two\s*times|apply\s*twice/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('reapplication', 0.86, ['reapplication', 'other'], 'Apply again leftover', 'preparing', entities)
  }

  if (/two\s*accounts?|duplicate\s*account|second\s*profile|i\s*create\s*(another|two)|double\s*account/i.test(q)) {
    return hit('portal-login', 0.86, ['login', 'other', 'duplicate-account'], 'Duplicate account leftover', 'applying', entities, true)
  }

  if (/change\s*(my\s*)?(phone|number|email)|new\s*phone\s*number|old\s*number\s*(no|not)\s*dey/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('profile-update', 0.86, ['profile', 'other', 'phone'], 'Change phone/email leftover', 'applying', entities, true)
  }

  if (/how\s*much\s*(dem|they|una|will|go)\s*(give|pay|disburse)|wetin\s*(be\s*)?(the\s*)?amount|loan\s*amount|maximum\s*(loan|upkeep)/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('upkeep', 0.8, ['upkeep', 'other', 'amount'], 'How much leftover', 'exploring', entities)
  }

  if (/foreign\s*student|international\s*student|i\s*(no|not)\s*be\s*nigerian|non[-\s]*nigerian|residence\s*permit/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.88, ['eligibility', 'other', 'foreign'], 'Foreign student leftover', 'exploring', entities)
  }

  if (/\bnysc\b.*(serving|camp|batch)|i\s*(dey|am)\s*(for\s*)?nysc|corp\s*member/i.test(q) && /repay|loan|apply|eligible|qualify/i.test(low)) {
    return hit('repayment', 0.84, ['repayment', 'other', 'nysc'], 'NYSC serving leftover', 'repaying', entities)
  }

  if (/affiliate\s*(campus|school)|satellite\s*campus|study\s*centre|distance\s*learning|open\s*and\s*distance/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.84, ['eligibility', 'other', 'affiliate'], 'Affiliate / ODL leftover', 'exploring', entities)
  }

  if (/no\s*admission\s*yet|i\s*(never|no)\s*get\s*admission|waiting\s*for\s*admission|only\s*jamb\s*result/i.test(q) && !/pending|how\s*far/.test(low)) {
    return hit('eligibility', 0.86, ['eligibility', 'other', 'no-admission'], 'No admission leftover', 'preparing', entities)
  }

  if (/session\s*(dropdown|list|option)\s*(empty|blank|no\s*dey)|no\s*session\s*(dey|show|appear)|wrong\s*session/i.test(q)) {
    return hit('academic-session', 0.88, ['session', 'other', 'missing'], 'Empty session leftover', 'applying', entities, true)
  }

  if (/wetin\s*be\s*institutional|what\s*(is|are)\s*institutional\s*charges|na\s*wetin\s*institutional/i.test(q)) {
    return hit('school-fees', 0.9, ['fees', 'other', 'explain'], 'What is institutional charges leftover', 'exploring', entities)
  }

  if (/name\s*(no|not|never)\s*(match|correct|tally)|date\s*of\s*birth\s*(wrong|no\s*match)|dob\s*(wrong|mismatch)|bio[-\s]*data\s*(no|not)\s*match/i.test(q)) {
    return hit('profile-update', 0.86, ['profile', 'other', 'mismatch'], 'Name/DOB mismatch leftover', 'applying', entities, true)
  }

  if (/i\s*(go\s*)?send\s*(screenshot|pic|photo)|see\s*(the\s*)?(picture|screenshot)|i\s*upload\s*(the\s*)?(error\s*)?(pic|photo)/i.test(q) && q.length < 80) {
    return hit('official-sources', 0.55, ['other', 'screenshot-prompt'], 'Screenshot-only leftover', 'unknown', entities)
  }

  if (/can\s*i\s*apply\s*(for\s*)?(two|2)\s*schools|two\s*institutions|double\s*school/i.test(q)) {
    return hit('eligibility', 0.84, ['eligibility', 'other', 'two-schools'], 'Two schools leftover', 'exploring', entities)
  }

  return null
}
