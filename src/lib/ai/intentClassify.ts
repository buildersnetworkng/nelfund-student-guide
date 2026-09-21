import type { IntentResult, ConversationTurn } from './types'
import {
  detectEntities,
  expandWithContext,
  isPortalDump,
  lastUserIntent,
  residualSoftRoute,
} from './residualRoute'
import { PURPOSE_RE, liveOpenRe, lastUtterance } from './intent'

export function isPurposeAsk(text: string): boolean {
  const q = lastUtterance(text)
  if (!q) return false
  if (liveOpenRe().test(q) && !PURPOSE_RE.test(q)) return false
  return PURPOSE_RE.test(q)
}

function hitIntent(
  intent: IntentResult['intent'],
  confidence: number,
  topics: string[],
  problem: string,
  stage: IntentResult['stage'],
  entities: string[],
  isTroubleshooting = false,
): IntentResult {
  return { intent, confidence, topics, problem, stage, entities, isTroubleshooting }
}

export function classifyIntent(text: string, history?: ConversationTurn[]): IntentResult {
  const raw = lastUtterance(text)
  const expanded = expandWithContext(raw, history)
  const entities = detectEntities(`${raw} ${expanded}`)
  const prior = lastUserIntent(history)

  if (!raw.trim()) {
    return hitIntent('official-sources', 0.4, ['empty'], 'Empty message', 'unknown', entities)
  }

  if (liveOpenRe().test(raw) || liveOpenRe().test(expanded)) {
    return hitIntent('current-information', 0.92, ['open-status', 'current'], 'Live open / deadline', 'exploring', entities)
  }

  if (PURPOSE_RE.test(raw) || PURPOSE_RE.test(expanded)) {
    return hitIntent('what-is-nelfund', 0.94, ['what-is'], 'What / why NELFUND', 'exploring', entities)
  }

  if (isPortalDump(raw) || isPortalDump(expanded)) {
    if (/pending|under\s*review|how\s*far|approved|declin/i.test(raw)) {
      return hitIntent('pending-application', 0.86, ['pending-status'], 'Portal dump with status', 'waiting', entities, true)
    }
    if (/invalid\s*jamb|jamb/i.test(raw)) {
      return hitIntent('jamb-verification', 0.86, ['jamb'], 'Portal dump with JAMB', 'applying', entities, true)
    }
    if (/missing\s*information|not\s*on\s*(the\s*)?list/i.test(raw)) {
      return hitIntent('missing-information', 0.86, ['missing'], 'Portal dump missing info', 'applying', entities, true)
    }
    if (/total\s*loans|dashboard|session\s*registration/i.test(raw)) {
      return hitIntent('pending-application', 0.84, ['pending-status'], 'Portal dump dashboard', 'waiting', entities, true)
    }
  }

  if (/invalid\s*jamb|jamb\s*(no|not|never|invalid|fail)|utme\s*(no|not|invalid)|jamb\s*caps|direct\s*entry/i.test(raw)) {
    return hitIntent('jamb-verification', 0.9, ['jamb'], 'JAMB invalid / verification', 'applying', entities, true)
  }

  if (/life\s*(jail|imprison)|jail\s*for\s*life|prison\s*for\s*(unpaid|default)/i.test(raw)) {
    return hitIntent('repayment', 0.92, ['repayment', 'life-jail-rumour'], 'Life-jail rumour', 'repaying', entities)
  }

  if (/\bgsi\b|global\s*standing\s*instruction/i.test(raw)) {
    return hitIntent('gsi', 0.9, ['gsi'], 'GSI question', 'repaying', entities)
  }

  if (/how\s*much\s*(is\s*)?(the\s*)?(upkeep|stipend|allowance)|upkeep\s*(amount|how\s*much)/i.test(raw)) {
    return hitIntent('upkeep', 0.9, ['upkeep'], 'How much upkeep', 'exploring', entities)
  }

  if (/part[\s-]*time|sandwich\s*student|post\s*graduate|postgraduate|private\s*(uni|university|school)|who\s*(fit|can)\s*apply/i.test(raw)) {
    return hitIntent('eligibility', 0.88, ['eligibility'], 'Who can apply / mode of study', 'exploring', entities)
  }

  if (/already\s*paid\s*(my\s*)?(school\s*)?fee|refund\s*(my\s*)?(fee|money)|paid\s*from\s*pocket/i.test(raw)) {
    return hitIntent('refund', 0.88, ['refund'], 'Already paid fees', 'waiting', entities, true)
  }

  if (/change\s*(my\s*)?(bank|account\s*number)|wrong\s*bank|wallet\s*(no|not)\s*(work|accept)/i.test(raw)) {
    return hitIntent('bank-information', 0.88, ['bank'], 'Change bank', 'applying', entities, true)
  }

  if (/name\s*(no|not|never)\s*(match|gree|tally)|mismatch\s*(name|dob)|date\s*of\s*birth\s*(no|not)\s*(match|gree)/i.test(raw)) {
    return hitIntent('missing-information', 0.9, ['missing'], 'Name / DOB mismatch', 'applying', entities, true)
  }

  if (/change\s*(of\s*)?(course|department|faculty|programme|program)/i.test(raw)) {
    return hitIntent('missing-information', 0.88, ['missing'], 'Change of course', 'applying', entities, true)
  }

  if (/dem\s*(don\s*)?(reject|decline)|status\s*(na|is)\s*(reject|declin)|rejected\s*(application|loan)/i.test(raw)) {
    return hitIntent('rejected-application', 0.9, ['other'], 'Rejected application', 'rejected', entities, true)
  }

  if (/repay|after\s*nysc|nysc.*pay|scholarship|loan\s*or\s*scholarship|na\s*scholarship|na\s*grant|pay\s*back/i.test(raw) && !/pending|how\s*far|never\s*enter/i.test(raw)) {
    if (/scholarship|grant|free\s*money|loan\s*or\s*scholarship/i.test(raw)) {
      return hitIntent('loan-or-scholarship', 0.88, ['scholarship', 'loan'], 'Loan vs scholarship', 'exploring', entities)
    }
    return hitIntent('repayment', 0.88, ['repayment'], 'Repayment / NYSC', 'repaying', entities)
  }

  if (
    /how\s*far(\s*(my|na|now|abeg|my\s*own))?|alert\s*(never|no|not)\s*(come|enter|drop)|my\s*own\s*never\s*(enter|drop|show)|money\s*(never|no|go)\s*(enter|drop|show)|still\s*pending|status\s*(no|not|never)\s*(change|move)|under\s*review|i\s*don\s*apply|when\s*(dem|they|una)\s*(go|will)\s*pay|no\s*alert|approved.{0,24}(no|never|not).{0,16}(money|alert|upkeep)|una\s*no\s*pay\s*me|dem\s*no\s*pay\s*me|application\s*(dey|is)\s*processing|disburs(e|ement)|i\s*wan\s*check\s*(my\s*)?(loan|application)|name\s*(no|not|never)\s*dey\s*(the\s*)?(pay\s*)?list|nothing\s*don\s*drop|dem\s*don\s*pay\s*(others|my\s*mates)|my\s*mates\s*(don|have)\s*(collect|receive)|class\s*(don|have)\s*collect|total\s*loans?\s*(is\s*)?(0|zero)|dashboard\s*(empty|blank)|i\s*don\s*submit|wetin\s*(dey\s*)?(happen|sup)\s*(to\s*)?(my\s*)?(loan|application|file|own)|e\s*still\s*dey\s*(pending|review|same)|una\s*never\s*pay|dem\s*never\s*pay|never\s*see\s*(alert|money|credit)|application\s*never\s*(move|change)|status\s*still\s*(the\s*)?same|i\s*don\s*(finish|complete)\s*(apply|application)|no\s*money\s*enter\s*since|when\s*una\s*go\s*release|my\s*application\s*is\s*pending|status\s*still\s*processing|how\s*far\s*my\s*own|money\s*never\s*enter|waiting\s*for\s*(my\s*)?(loan|upkeep|disbursement)|any\s*update\s*on\s*my/i.test(
      raw,
    )
  ) {
    return hitIntent('pending-application', 0.9, ['pending-status'], 'Pending / payout wait', 'waiting', entities, true)
  }

  if (/create\s*(account|profile)|sign\s*up|how\s*(to|i\s*go|i\s*fit)\s*apply|i\s*wan(t)?\s*(to\s*)?apply|step\s*by\s*step|walk\s*me|guide\s*me\s*(to\s*)?apply/i.test(raw)) {
    return hitIntent('how-to-apply', 0.88, ['how-to-apply'], 'How to apply', 'preparing', entities)
  }

  if (/how\s*(do\s*i|to|i\s*go)\s*(check|see)\s*(my\s*)?(status|application)|where\s*(i|to)\s*(check|see)\s*(status|application)/i.test(raw)) {
    return hitIntent('pending-application', 0.88, ['pending-status'], 'Check application status', 'waiting', entities, true)
  }

  if (/documents?\s*(i\s*)?(need|required)|wetin\s*i\s*go\s*carry|requirements?\s*to\s*apply/i.test(raw)) {
    return hitIntent('documents-needed', 0.86, ['documents'], 'Documents needed', 'preparing', entities)
  }

  if (
    /email\s*(already\s*)?(used|exist|exists|registered)|already\s*(used|registered|exist).{0,20}(email|account)|registered\s*(last|last\s*year|before)|account\s*(already\s*)?(exist|exists)|forgot\s*(my\s*)?password|cannot\s*(login|sign\s*in)|portal\s*(no|not)\s*(open|load)|otp\s*(no|not|never|no\s*dey)|verification\s*code\s*(no|not|never)/i.test(
      raw,
    )
  ) {
    return hitIntent('portal-login', 0.9, ['login'], 'Login / email already used / OTP', 'applying', entities, true)
  }

  if (/change\s*(my\s*)?(phone|number|email)|update\s*(my\s*)?(phone|email|profile)/i.test(raw)) {
    return hitIntent('portal-login', 0.9, ['login'], 'Change phone / email / profile', 'applying', entities, true)
  }

  if (/customer\s*care|nelfund\s*(hotline|number)|who\s*(do\s*i|to)\s*call|office\s*address|phone\s*(number|no|line)\s*(for\s*)?(nelfund|support|customer)/i.test(raw)) {
    return hitIntent('contact-support', 0.88, ['other'], 'Phone / office / hotline', 'exploring', entities)
  }

  if (/(pay|paid)\s*(an?\s*)?agent|buy\s*(slot|form)|nelfund\s*agent/i.test(raw)) {
    return hitIntent('scam-safety', 0.92, ['other'], 'Agent / paid slot', 'exploring', entities)
  }

  if (/apply\s*(last\s*)?(year|session)|reapply|re-apply|this\s*(year|session)\s*again/i.test(raw) && !/email\s*(already|used)/i.test(raw)) {
    return hitIntent('reapplication', 0.86, ['other'], 'Last year apply / reapply', 'applying', entities)
  }

  if (/(100|200|300|400|500)\s*(l|level)|fresh(er|man)?\s*(fit|can)|final\s*year\s*(fit|can|apply)/i.test(raw)) {
    return hitIntent('eligibility', 0.88, ['eligibility', 'other'], 'Level / year apply', 'exploring', entities)
  }

  if (/(apply|request)\s*(button|btn)|i\s*(no|not)\s*see\s*(apply|request)|cannot\s*submit|portal\s*(no|not|never)\s*(load|gree)/i.test(raw)) {
    return hitIntent('how-to-apply', 0.88, ['how-to-apply', 'other'], 'Apply button / portal submit', 'applying', entities, true)
  }

  if (/how\s*much.{0,20}(loan|give|pay|nelfund)|loan\s*amount/i.test(raw) && !/upkeep\s*(amount|how\s*much)/i.test(raw)) {
    return hitIntent('how-to-apply', 0.84, ['how-to-apply', 'other'], 'How much loan', 'exploring', entities)
  }

  if (
    /^(abeg\s*)?(help|assist|guide)\s*(me)?\s*(abeg|pls|please|jare|jo|small)?\.?$|una\s*fit\s*(help|assist)|i\s*(just\s*)?(need|wan|want)\s*help|pls\s*assist|wetin\s*i\s*(suppose|go|fit)\s*(do|ask)(\s*(now|here|una))?\??$|i\s*dey\s*(lost|confused|stranded)|help\s*abeg|i\s*no\s*know\s*where\s*to\s*start|make\s*una\s*(guide|help|show)\s*me|can\s*(you|una)\s*help\s*me(\s*with\s*(this\s*)?nelfund)?\??$|i\s*need\s*assistance|i\s*no\s*sabi\s*(wetin|where|anything)|i\s*dey\s*confused|kindly\s*assist\s*me|give\s*me\s*(brief|short)\s*(guide|menu)|how\s*i\s*(go|fit)\s*(take\s*)?start|una\s*fit\s*show\s*me\s*(the\s*)?way|abeg\s*orientate\s*me|how\s*e\s*take\s*be|point\s*me\s*(to\s*)?(where|wetin)|direct\s*me|wetin\s*you\s*(fit|can)\s*do|show\s*me\s*(short\s*)?(menu|options?)|how\s*i\s*take\s*enter\s*(this\s*)?(thing|matter)|abeg\s*i\s*need\s*(una|your)\s*help/i.test(
      raw,
    )
  ) {
    return hitIntent('official-sources', 0.88, ['other', 'greeting-vague'], 'Vague help menu', 'exploring', entities)
  }

  const soft = residualSoftRoute(expanded || raw, entities)

  if (soft && soft.intent !== 'unknown') return soft

  const followish =
    raw.length < 120 &&
    /^(alright|okay|ok|so|and|then|now|please|abeg)?\s*(so\s+)?(what|wetin|how|where|which)?/i.test(raw) &&
    /(next|do|solution|first|should|will\s*i|i\s*go|wattin|wetin)/i.test(raw)
  if (prior && prior !== 'unknown' && (raw.length < 80 || followish)) {
    return hitIntent(prior, 0.72, ['follow-up'], 'Follow-up keeps prior intent', 'unknown', entities)
  }
  if (followish && history && history.length > 0) {
    const asstIntent = [...history].reverse().find((h) => h.role === 'assistant' && h.intent)?.intent
    if (asstIntent && asstIntent !== 'unknown') {
      return hitIntent(asstIntent, 0.7, ['follow-up'], 'Follow-up from assistant intent', 'unknown', entities)
    }
  }

  return hitIntent('official-sources', 0.4, ['other'], 'Unclassified residual', 'exploring', entities)
}
