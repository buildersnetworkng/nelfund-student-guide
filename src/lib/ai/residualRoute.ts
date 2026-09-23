/**
 * Minimal residual routing helpers for intent classification.
 * Keeps classifyIntent working without the long hourly residual chain.
 */
import type { ConversationTurn, IntentId, IntentResult } from './types'
import { officialFaqIntent } from './officialFaq'
import { residualOtherHourly144 } from './residualOtherHourly144'
import { residualOtherHourly146 } from './residualOtherHourly146'

const SCHOOL_HINTS = [
  'unilag',
  'lasu',
  'oou',
  'yabatech',
  'unilorin',
  'ui',
  'oau',
  'uniben',
  'abu',
  'unijos',
  'futo',
  'noun',
]

export function lastUserIntent(history?: ConversationTurn[]): IntentId | null {
  if (!history?.length) return null
  for (let i = history.length - 1; i >= 0; i--) {
    const h = history[i]
    if (h.intent && h.intent !== 'unknown') return h.intent
  }
  for (let i = history.length - 1; i >= 0; i--) {
    const h = history[i]
    if (h.role === 'user' && h.intent) return h.intent
  }
  return null
}

export function expandWithContext(question: string, history?: ConversationTurn[]): string {
  const q = (question || '').trim()
  if (!history?.length) return q
  const priorUsers = history
    .filter((h) => h.role === 'user')
    .slice(-3)
    .map((h) => h.text)
    .join(' ')
  const lastAsst = [...history].reverse().find((h) => h.role === 'assistant')?.text || ''
  const followUp =
    q.length < 90 &&
    /^(alright|okay|ok|so|and|then|now|please|abeg|pls)?\s*(what|wetin|how|where|which|who)?\s*(should|will|can|do|go)?\s*(i|we)?\s*(do|take|try)?\s*(next|now|first)?/i.test(
      q,
    )
  if ((q.length < 12 || followUp) && priorUsers) {
    const asstSnippet = lastAsst ? lastAsst.slice(0, 180) : ''
    return `${priorUsers} ${asstSnippet} ${q}`.trim()
  }
  return q
}

export function detectEntities(text: string): string[] {
  const t = (text || '').toLowerCase()
  const out: string[] = []
  if (/\bjamb\b|utme/.test(t)) out.push('jamb')
  if (/\bnin\b|national\s*id/.test(t)) out.push('nin')
  if (/\bbvn\b/.test(t)) out.push('bvn')
  if (/upkeep|stipend|allowance/.test(t)) out.push('upkeep')
  if (/school\s*fees?|tuition|institutional\s*charges?/.test(t)) out.push('fees')
  if (/pending|under\s*review|how\s*far|never\s*enter|processing|alert\s*never|money\s*never|mates?\s*don|dashboard\s*(0|zero)|\bbatch\b/.test(t))
    out.push('pending')
  if (SCHOOL_HINTS.some((s) => t.includes(s))) out.push('school')
  return out
}

export function isPortalDump(text: string): boolean {
  const t = text || ''
  return t.length > 280 && /(portal\.nelf|nelf\.gov|status|pending|invalid)/i.test(t)
}

function hit(
  intent: IntentId,
  confidence: number,
  topics: string[],
  problem: string | null,
  stage: IntentResult['stage'],
  entities: string[],
  isTroubleshooting = false,
): IntentResult {
  return { intent, confidence, topics, problem, stage, entities, isTroubleshooting }
}

/** Extra residual shapes for the live other unknown bucket. */
export function residualOtherRoute(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null

  if (
    /email\s*(already|don|has|is)\s*(used|exist|registered)|registered\s*(last\s*)?year|last\s*year\s*(i\s*)?(register|apply)|account\s*already|forgot\s*(my\s*)?password|cannot\s*(log\s*in|login)|otp\s*(no|not|never)|mail\s*(don|already)\s*(use|exist)|i\s*use\s*(this\s*)?mail\s*before|old\s*email|email\s*wahala|password\s*(no|not)\s*(gree|work)|reset\s*password|login\s*no\s*gree|sign\s*in\s*no\s*work|i\s*don\s*register\s*before|account\s*dey\s*already|mail\s*don\s*register/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.9, ['login'], 'Email used / last year register', 'applying', entities, true)
  }

  if (
    /invalid\s*jamb|jamb\s*(number\s*)?(no|not|never|invalid|wrong|fail|reject)|utme\s*(no|not|invalid)|jamb\s*(verification|verify|caps|reg)|jamb\s*(no|not)\s*(gree|match|work)|my\s*jamb\s*(dey|is)\s*(wrong|invalid)|jamb\s*wahala|cannot\s*verify\s*jamb|jamb\s*no\s*dey\s*work|utme\s*number\s*(wrong|invalid)|jamb\s*reg\s*(no|not)/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.9, ['jamb'], 'JAMB verification residual', 'applying', entities, true)
  }

  if (
    /school\s*(no|not|never)\s*(dey|show|appear|list)|institution\s*(no|not)\s*(dey|on|in)|cannot\s*(see|find)\s*(my\s*)?school|school\s*wahala\s*(list|dropdown)|school\s*no\s*show\s*for\s*portal|my\s*uni\s*no\s*dey|school\s*missing|dropdown\s*(empty|blank)|list\s*of\s*school\s*(no|not)|institution\s*list\s*(empty|no)/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.9, ['school-list'], 'School list residual', 'applying', entities, true)
  }

  if (
    /when\s*(do\s*i|to|i\s*(go|fit))\s*(start\s*)?repay|pay\s*back|after\s*nysc|gsi|how\s*(will|go)\s*i\s*pay|repayment\s*(start|begin|plan)|when\s*(dem|they)\s*(go|will)\s*(collect|deduct)|how\s*(e|i)\s*take\s*pay\s*back|loan\s*repay|i\s*go\s*pay\s*how|salary\s*deduct|how\s*long\s*(to\s*)?pay/i.test(
      q,
    )
  ) {
    return hit('repayment', 0.88, ['repayment'], 'Repayment residual', 'repaying', entities)
  }

  if (
    /how\s*far|still\s*pending|application\s*(is\s*)?pending|wetin\s*dey\s*hold|money\s*never|e\s*never\s*(drop|enter|credit)|status\s*(na|is|still)\s*pending|una\s*never\s*pay|dem\s*never\s*pay|waiting\s*for\s*(loan|upkeep|alert)|any\s*update|track\s*(my\s*)?(loan|file)|my\s*own\s*never\s*(show|move)|processing\s*since|under\s*review\s*(still|since)|alert\s*never\s*come|mates?\s*(don|have)\s*(collect|receive)|dashboard\s*(still\s*)?(0|zero)|approved\s*(but|and)\s*(no|never)\s*(money|alert)|\bbatch\s*[1-9]\b/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.88, ['pending-status'], 'Pending residual', 'waiting', entities, true)
  }

  if (
    /^(hi|hello|hey|how\s*far|good\s*(morning|afternoon|evening)|yo|sup|gm|evening)\s*(una|there|boss|sir|ma)?[.!? ]*$/i.test(q) ||
    /^(please|pls|abeg)?\s*(help|assist|guide)\s*(me)?\s*(out)?[.!? ]*$/i.test(q) ||
    /^(nelfund|loan|help|pls|abeg|info|information|guide)\s*[.!?]*$/i.test(q)
  ) {
    return hit('official-sources', 0.72, ['greeting-vague'], 'Greeting / vague help', 'exploring', entities)
  }

  if (
    /i\s*(just\s*)?(need|wan|want)\s*(help|info|information|guidance)|abeg\s*(help|assist)|una\s*fit\s*help|i\s*dey\s*(lost|confused|stranded)|i\s*no\s*(sabi|know)\s*(wetin|where|anything)|portal\s*wahala|i\s*get\s*(issue|problem|wahala)|something\s*dey\s*wrong|help\s*me\s*(with\s*)?(this\s*)?(nelfund|loan|thing|matter)|assist\s*me\s*(on|with)\s*(this\s*)?(loan|nelfund)|i\s*just\s*land|e\s*no\s*clear|make\s*una\s*(guide|help|show)\s*me|gimme\s*(menu|options|list)|short\s*menu|wetin\s*una\s*fit\s*do|how\s*(this|dis)\s*(thing|matter)\s*dey\s*work|i\s*need\s*assistance|kindly\s*assist|orientate\s*me|point\s*me|direct\s*me|nelfund\s*help|loan\s*help\s*abeg|i\s*no\s*understand\s*(anything|am)|how\s*i\s*(go|fit)\s*start|any\s*(info|information|guide)\s*(abeg|pls)?|tell\s*me\s*something|wetin\s*una\s*dey\s*do|i\s*just\s*wan\s*yarn|e\s*dey\s*hard|i\s*no\s*get\s*direction|show\s*me\s*where\s*to\s*start|i\s*need\s*una|help\s*small|abeg\s*yarn|make\s*una\s*clear\s*am|i\s*dey\s*blank|wetin\s*i\s*suppose\s*ask|can\s*you\s*help\s*with\s*nelfund|please\s*i\s*need\s*(direction|clarity)|kindly\s*guide\s*me|i\s*wan\s*ask\s*something|una\s*dey\s*there/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.86, ['other', 'greeting-vague'], 'Vague Pidgin / help menu', 'exploring', entities)
  }

  if (
    /pls\s*help|plz\s*help|helep\s*me|help\s*me\s*na|abeg\s*oo+|una\s*dey\?|who\s*dey\s*there|anybody\s*(dey|there)|i\s*wan\s*yarn\s*(small|now)|make\s*we\s*yarn|talk\s*to\s*me|i\s*no\s*know\s*wetin\s*to\s*type|wetin\s*i\s*fit\s*ask|i\s*just\s*dey\s*here|e\s*no\s*make\s*sense|i\s*confused\s*(ooo+|well)|confused\s*pass|i\s*lost\s*(ooo+|well)|guide\s*abeg|menu\s*abeg|options\s*abeg|wetin\s*una\s*sabi|una\s*fit\s*yarn|explain\s*small|break\s*am\s*down|keep\s*am\s*short|short\s*guide|brief\s*me|brief\s*am|i\s*need\s*direction|where\s*i\s*go\s*start|how\s*i\s*take\s*enter|i\s*never\s*start|i\s*wan\s*begin|first\s*thing\s*first|wetin\s*come\s*first|start\s*from\s*where|how\s*to\s*begin|i\s*no\s*get\s*idea|no\s*idea\s*abeg|anything\s*to\s*know|tell\s*me\s*how|show\s*road|show\s*me\s*road|nelfund\s*abeg|loan\s*abeg|help\s*on\s*nelfund|need\s*nelfund\s*help|student\s*loan\s*help|i\s*be\s*student\s*(abeg|ooo+)?|una\s*fit\s*assist\s*me|please\s*i\s*need\s*help\s*with\s*(this|dis)|kindly\s*help\s*out|i\s*need\s*someone\s*to\s*guide|talk\s*am\s*simple|use\s*simple\s*english|no\s*long\s*thing|make\s*e\s*simple|i\s*dey\s*see\s*shege|wahala\s*dey|e\s*plenty\s*me|too\s*much\s*wahala|i\s*no\s*fit\s*understand\s*portal|portal\s*confusing|site\s*confusing|app\s*confusing|wetin\s*be\s*next\s*step|next\s*action|what\s*should\s*i\s*ask/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.84, ['other', 'greeting-vague'], 'Vague residual menu', 'exploring', entities)
  }

  if (
    /^(pls|plz|please|abeg|help|assist|guide|info|information|nelfund\s*loan|student\s*loan|loan\s*matter|matter|issue|wahala|question|ask)\s*[.!?]*$/i.test(q) ||
    /^(wetin|how|what)\s*(now|next|be|happen)\s*[.!?]*$/i.test(q)
  ) {
    return hit('official-sources', 0.8, ['other', 'greeting-vague'], 'One-word / fragment help', 'exploring', entities)
  }

  if (
    /i\s*(wan|want|wanna|go)\s*(to\s*)?(apply|register|enroll)|how\s*(i\s*)?(go|fit|can|do)\s*(apply|register)|abeg\s*how\s*(i\s*)?(go\s*)?apply|make\s*i\s*apply|steps?\s*(to\s*)?apply|i\s*wan\s*start\s*(the\s*)?(application|apply)|how\s*to\s*apply\s*(abeg|pls|na)?|apply\s*(na|abeg|pls)\s*(how|now)?|i\s*no\s*sabi\s*how\s*(to\s*)?apply|teach\s*me\s*how\s*to\s*apply|show\s*me\s*how\s*(to\s*)?apply|application\s*steps?|wetin\s*i\s*(go|suppose)\s*do\s*to\s*apply|i\s*just\s*wan\s*apply|una\s*fit\s*show\s*me\s*apply/i.test(
      q,
    )
  ) {
    return hit('how-to-apply', 0.88, ['other', 'apply'], 'Vague apply start residual', 'applying', entities)
  }

  if (
    /who\s*fit\s*help|i\s*dey\s*find\s*(nelfund|help|loan)|nelfund\s*matter|loan\s*matter\s*(abeg|pls)?|i\s*just\s*wan\s*know|make\s*una\s*help\s*me|abeg\s*i\s*get\s*wahala|e\s*no\s*dey\s*work(\s*abeg)?$|portal\s*no\s*gree|site\s*no\s*gree|i\s*dey\s*try\s*(since|tire)|i\s*don\s*tire\s*(of\s*)?(this|dis)|una\s*fit\s*yarn\s*me|talk\s*nelfund|explain\s*nelfund\s*small|i\s*need\s*una\s*help|help\s*me\s*joor|help\s*me\s*jare|abeg\s*joor|i\s*wan\s*ask\s*una|can\s*somebody\s*help|is\s*anybody\s*there|human\s*help|real\s*person|i\s*no\s*see\s*road|show\s*me\s*light|i\s*dey\s*manage|i\s*just\s*enter\s*here|first\s*time\s*here|new\s*here\s*(abeg|pls)?|orient\s*me|walk\s*me\s*through|hold\s*my\s*hand|from\s*scratch|start\s*afresh|i\s*no\s*know\s*where\s*to\s*begin|beginner\s*(abeg|pls)?|simple\s*steps?\s*(abeg|pls)?|keep\s*am\s*simple\s*abeg|no\s*grammar|use\s*pidgin|yarn\s*pidgin|i\s*no\s*too\s*sabi\s*english/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.85, ['other', 'greeting-vague'], 'Hourly other Pidgin menu', 'exploring', entities)
  }

  if (
    /helep|helpp+|plsss+|abeggg+|nelfnd|nelfun|nel fund|student\s*lon|lon\s*help|i\s*nid\s*help|i\s*nd\s*help|asist\s*me|guied\s*me|infomation|informatn|pls\s*una|una\s*pls/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.82, ['other', 'greeting-vague'], 'Typo vague help', 'exploring', entities)
  }

  return null
}

/**
 * Soft residual route: official FAQ first, then a few high-value patterns.
 * Returns null when nothing matches so classifyIntent can fall through.
 */
export function residualSoftRoute(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return hit('official-sources', 0.45, ['empty'], 'Empty or unclear message', 'unknown', entities)

  try {
    const faqIntent = officialFaqIntent(q)
    if (faqIntent) {
      return hit(faqIntent, 0.92, ['official-faq'], 'Official FAQ topic', 'exploring', entities)
    }
  } catch {
    /* officialFaq optional */
  }

  if (
    /how\s*(do\s*i|to|i\s*(go|fit|can)|can\s*i)\s*(log\s*in|login|sign\s*in|sign\s*up)|log\s*in\s*(to|into|for)?\s*(the\s*)?(portal|nelfund)|sign\s*in\s*(to|into)?\s*(the\s*)?(portal|nelfund)|portal\s*(log\s*in|login|sign\s*in)/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.9, ['login'], 'How to log in / sign in', 'applying', entities, true)
  }

  if (
    /(difference|diff|vs|versus|between).{0,40}(upkeep|stipend).{0,40}(fee|fees|tuition|charges)|((fee|fees|tuition|charges).{0,40}(upkeep|stipend)|(upkeep|stipend).{0,40}(fee|fees|tuition|charges))/i.test(
      q,
    )
  ) {
    return hit('upkeep', 0.9, ['upkeep', 'fees'], 'Upkeep vs school fees', 'exploring', entities)
  }

  if (/who\s*(built|founded|created|started|own|owns|establish)\s*(nelfund|the\s*loan)|nelfund\s*(founder|builder|creator)/i.test(q)) {
    return hit('what-is-nelfund', 0.9, ['what-is'], 'Who built / founded NELFUND', 'exploring', entities)
  }

  if (
    /how\s+(does\s+)?(nelfund|it|this)\s+work|how\s+nelfund\s+works|everything\s+(on|about)\s+(how\s+)?nelfund|know\s+everything/i.test(
      q,
    )
  ) {
    return hit('what-is-nelfund', 0.92, ['what-is', 'how-it-works'], 'How NELFUND works', 'exploring', entities)
  }

  if (
    /school\s*(not|no|never)\s*(showing|show|appear|dey|listed)|institution\s*(missing|not\s*(on|in)\s*(the\s*)?(list|portal))|cannot\s*find\s*(my\s*)?school|school\s*no\s*dey\s*list/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.9, ['school-list'], 'School missing on list', 'applying', entities, true)
  }

  if (
    /status\s*(na|is|still)\s*(pending|processing)|application\s*(still\s*)?(pending|processing)|money\s*never|how\s*far\s*(my|na)|wetin\s*dey\s*hold/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.88, ['pending-status'], 'Residual pending / how far', 'waiting', entities, true)
  }

  if (
    /pendin[g]?|pendng|still\s*pend|e\s*never\s*move|e\s*no\s*move|status\s*no\s*change|no\s*update\s*since|i\s*check\s*am\s*still|dashboard\s*still\s*(0|zero|pending)|batch\s*(no|not|never)|dem\s*pay\s*my\s*mate|mates?\s*don\s*(collect|receive|see)|una\s*pay\s*others|when\s*my\s*own\s*go\s*(enter|drop|show)|approved\s*(but|and)\s*(no|never|not)\s*(money|alert)|total\s*loans?\s*(is\s*|still\s*)?(0|zero)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.86, ['pending-status'], 'Pending typo / mates paid', 'waiting', entities, true)
  }

  if (
    /jam[b]?\s*(no|not|invalid|wrong)|utme\s*(no|not)|caps\s*(no|not|fail)|jamb\s*reg\s*(no|not|invalid)|verify\s*my\s*jamb|jamb\s*details?\s*(wrong|invalid)|admission\s*letter\s*(jamb|utme)/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.86, ['jamb'], 'JAMB typo residual', 'applying', entities, true)
  }

  if (
    /is\s*(it|nelfund|portal|loan|application)\s*(still\s*)?(open|on|close[d]?)|deadline|closing\s*date|can\s*i\s*still\s*apply|dem\s*still\s*dey\s*(open|collect|accept)|una\s*still\s*dey\s*(open|collect)|window\s*(still\s*)?(open|close)/i.test(
      q,
    )
  ) {
    return hit('current-information', 0.9, ['open-status'], 'Open / deadline residual', 'exploring', entities)
  }

  try {
    const h146 = residualOtherHourly146(q, entities)
    if (h146 && h146.intent !== 'unknown') return h146
  } catch {
    /* hourly optional */
  }

  try {
    const h144 = residualOtherHourly144(q, entities)
    if (h144 && h144.intent !== 'unknown') return h144
  } catch {
    /* hourly optional */
  }

  const extra = residualOtherRoute(q, entities)
  if (extra) return extra

  return null
}
