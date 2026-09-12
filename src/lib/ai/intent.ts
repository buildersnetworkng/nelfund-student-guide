import type { IntentResult, ConversationTurn } from './types'
import {
  detectEntities,
  expandWithContext,
  isPortalDump,
  lastUserIntent,
  residualSoftRoute,
} from './residualRoute'

/** Purpose / what-is. Must beat live-status and catch-all "why" routes. */
export const PURPOSE_RE =
  /what\s*(is|are)\s*(the\s+)?(purpose|aim|point|goal|meaning|reason)\s*(of\s+)?(this\s+)?(nelfund|loan|scheme)|what\s*is\s*(this\s+)?nelfund|what\s+does\s+(nelfund|it|this)\s+do|explain\s+(this\s+)?nelfund|overview\s+of\s+nelfund|origin\s+of\s+nelfund|wetin\s*(be|mean)\s*(this\s+)?(nelfund|loan|scheme)|wetin\s+nelfund\s+(be|mean|dey\s+do|for)|nelfund\s+dey\s+do\s+wetin|about\s+(this\s+)?nelfund|tell\s*me\s*(about|everything|why).{0,40}(nelfund|this\s+loan|dis\s+loan)|why\s+(was|is|were|did|do|dem|they|una|we|fg|government)\s+.{0,48}(nelfund|nelfund|it|dis|this|loan|scheme)?.{0,24}(created|create|establish|established|started|start|begin|form|formed|set\s*up|make|made|bring|brought)|why\s+(dem|they|una|fg|government)\s+(take\s+)?(create|make|start|form|bring|introduce|set\s*up)\s+(nelfund|am|it|this\s+loan|dis\s+loan|the\s+loan)|why\s+(they|dem)\s+(created|formed|started|introduced)\s+(nelfund|this\s+loan)|why\s+nelfund\s+(was|is|dey|come|exist|existed)|why\s+(was|is)\s+nelfund|why\s+nelfund\b|purpose\s+(of\s+)?(nelfund|the\s+(student\s+)?loan)|reason\s+(for|dem|they|una)\s+.{0,24}(nelfund|this\s+loan|dis\s+loan)|mission\s+of\s+nelfund|nelfund\s+(purpose|mission|aim|objective|mean|meaning)|who\s+(created|established|started|signed)\s+nelfund|wetin\s+(make|cause|make\s+una)\s+(dem|them|una|government|fg)?\s*(create|start|bring)|how\s+come\s+.{0,28}(nelfund|dis\s+loan|this\s+loan)|na\s+why\s+.{0,24}(nelfund|dem\s+form|this\s+loan)|wetin\s+be\s+the\s+(purpose|reason)|why\s+dem\s+create\s+nelfund|why\s+una\s+create|wetin\s+be\s+nelfund|why\s+dem\s+take\s+create|point\s+of\s+nelfund|wetin\s+dem\s+(take\s+)?(create|start|make)\s+(nelfund|am|dis\s+loan|this\s+loan)|how\s+nelfund\s+come\s+about|wetin\s+make\s+(government|fg|dem)\s+start|^nelfund\??$|what'?s\s+nelfund(\s+for)?|nelfund\s+for\s+wetin|na\s+wetin\s+(be\s+)?nelfund|why\s+(they|dem|una)\s+bring\s+(nelfund|this\s+loan|am)|wetin\s+nelfund\s+dey\s+mean|who\s+bring\s+nelfund|why\s+(this|dis)\s+(student\s+)?loan\s+(scheme\s+)?(dey|exist)|tell\s+me\s+why\s+nelfund|what\s+nelfund\s+mean|nelfund\s+meaning|reason\s+behind\s+(nelfund|the\s+(student\s+)?loan)|why\s+(fg|the\s+government|government|una)\s+(introduce|introduced|bring|brought|set\s*up)|why\s+(this|dis)\s+nelfund|una\s+create\s+nelfund\s+for\s+wetin|wetin\s+make\s+dem\s+form|introduce[d]?\s+nelfund|student\s+loans?\s+act|why\s+dem\s+form\s+nelfund|wetin\s+be\s+dis\s+nelfund|na\s+why\s+dem\s+create|why\s+they\s+create\s+nelfund|wetin\s+be\s+dis\s+loan|what\s+nelfund\s+is\s+for|why\s+this\s+scheme|nelfund\s+na\s+wetin|reason\s+they\s+(start|create|bring)|na\s+wetin\s+nelfund\s+dey\s+do|wetin\s+nelfund\s+dey\s+do|why\s+dem\s+bring\s+nelfund|why\s+they\s+form\s+nelfund|purpose\s+of\s+this\s+(student\s+)?loan|why\s+introduce\s+nelfund|wetin\s+be\s+the\s+aim|nelfund\s+dey\s+mean\s+wetin|explain\s+why\s+nelfund|why\s+they\s+form\s+this\s+loan|explain\s+this\s+student\s+loan|na\s+wetin\s+be\s+(dis|this)\s+(loan|scheme)|wetin\s+make\s+una\s+start|what\s+is\s+the\s+student\s+loan|why\s+they\s+introduce\s+nelfund/i

export function liveOpenRe(): RegExp {
  return /is\s+(nelfund|it|portal|application|loan)\s+(still\s+)?(open|dey\s+open|closed)|deadline|as\s+of\s+today|still\s+accept|can\s+i\s+still\s+apply|dem\s+still\s+dey\s+(collect|accept|open)|una\s+still\s+dey\s+(collect|open|accept)|nelfund\s+dey\s+(still\s+)?open|portal\s+(still\s+)?(dey\s+)?open|application\s+dey\s+open|closing\s+date|opening\s+date|open\s*status|loan\s*window|nelfund\s+(still\s+)?(open|closed)|application\s+(still\s+)?open|dem\s+don\s+close\s+(nelfund|am|portal)|una\s+don\s+close/i
}

/** Last user utterance only — never classify from concatenated history. */
export function lastUtterance(text: string): string {
  const q = (text || '').trim()
  if (!q) return ''
  const parts = q.split(/\n+/).map((s) => s.trim()).filter(Boolean)
  return parts[parts.length - 1] || q
}

const PURPOSE_PHRASES = [
  'why was nelfund created',
  'why is nelfund created',
  'why they create nelfund',
  'why they created nelfund',
  'why they introduce nelfund',
  'why e dey exist',
  'why e exist',
  'why una start am',
  'why una bring am',
  'wetin una dey try do',
  'wetin una wan solve',
  'what problem nelfund dey solve',
  'what problem does nelfund solve',
  'why they set up nelfund',
  'why they set up the loan',
  'why they set up this loan',
  'why fg set up nelfund',
  'why government set up nelfund',
  'whats nelfund all about',
  'what is nelfund all about',
  'nelfund all about',
  'all about nelfund',
  'why we get nelfund',
  'why we get this loan',
  'wetin nelfund stand for',
  'what nelfund stand for',
  'nelfund stand for wetin',
  'why this fund dey',
  'why this fund exist',
  'nelfund na wetin exactly',
  'student loan fund na wetin',
  'wetin be nigeria education loan',
  'what is nigeria education loan fund',
  'why this nelfund dey',
  'why una create am',
  'wetin una create nelfund for',
  'what is the reason for nelfund',
  'reason they introduced student loan',
  'why dem set up nelfund',
  'why government start student loan',
  'reason dem start nelfund',
  'why student loan scheme',
  'why they introduced nelfund',
  'why this loan',
  'why the student loan',
  'why student loan',
  'wetin make nelfund',
  'na why nelfund',
  'what nelfund is',
  'nelfund explanation',
  'why nelfund start',
  'wetin be dis loan',
  'una bring nelfund',
  'why dem create nelfund',
  'why dem created nelfund',
  'why dem take create nelfund',
  'why dem form nelfund',
  'why dem bring nelfund',
  'why una create nelfund',
  'why they form nelfund',
  'why they bring nelfund',
  'why nelfund was created',
  'why nelfund exist',
  'why nelfund dey',
  'wetin be nelfund',
  'wetin be this nelfund',
  'wetin be dis nelfund',
  'wetin nelfund dey do',
  'na wetin nelfund dey do',
  'what is nelfund',
  'what is this nelfund',
  'what is the student loan',
  'what does nelfund do',
  'purpose of nelfund',
  'reason for nelfund',
  'nelfund meaning',
  'what nelfund mean',
  'tell me about nelfund',
  'explain nelfund',
  'why this student loan',
  'why this scheme',
  'who created nelfund',
  'how nelfund come about',
  'nelfund na wetin',
  'na wetin nelfund',
]

export function isPurposeAsk(text: string): boolean {
  const q = lastUtterance(text)
  if (!q.trim()) return false
  const compact = q.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
  if (liveOpenRe().test(q) && !/why|purpose|wetin|what\s*is|meaning|created|create|establish|mission|aim|introduce|exist/i.test(q)) {
    return false
  }
  if (PURPOSE_PHRASES.some((p) => compact.includes(p) || compact === p)) {
    return true
  }
  if (PURPOSE_RE.test(q)) return true
  if (
    /\b(why|wetin|purpose|meaning|aim|mission|reason|explain)\b/i.test(q) &&
    /\b(nelfund|student\s+loan|dis\s+loan|this\s+loan|this\s+scheme|education\s+loan)\b/i.test(q) &&
    !liveOpenRe().test(q) &&
    !/\b(pending|missing|jamb|apply|login|upkeep|fees|deadline|open)\b/i.test(q)
  ) {
    return true
  }
  if (
    /\bnelfund\b/i.test(q) &&
    /\b(why|wetin|purpose|meaning|na\s+wetin|for\s+wetin)\b/i.test(q) &&
    !liveOpenRe().test(q) &&
    !/\b(pending|missing|jamb|deadline|still\s+open)\b/i.test(q)
  ) {
    return true
  }
  return false
}

function isContrastFeesUpkeep(q: string): boolean {
  const fees = /school\s*fees|institutional\s*charges|tuition|school\s*money/i.test(q)
  const upkeep = /\bupkeep\b|monthly\s*allowance|stipend|20,?000/i.test(q)
  const contrast = /\bvs\b|versus|difference|between|or\s+the\s+|and\s+upkeep|upkeep\s+and|fees\s+and/i.test(q)
  return fees && upkeep && contrast
}

function isContrastLoginSignup(q: string): boolean {
  const login = /(\blogin\b|log\s*in|sign\s*in)/i.test(q)
  const signup = /sign\s*up|create\s*(an?\s*)?account|register/i.test(q)
  const contrast = /\bvs\b|versus|difference|between|or\s+|and\s+/i.test(q)
  return login && signup && contrast
}

export function classifyIntent(question: string, history?: ConversationTurn[]): IntentResult {
  const raw = lastUtterance(question || '')
  const q = expandWithContext(question, history).trim()
  const entities = detectEntities(raw || q)

  if (isPurposeAsk(raw) || (PURPOSE_RE.test(raw) && !liveOpenRe().test(raw))) {
    return { intent: 'what-is-nelfund', confidence: 0.94, topics: ['what is', 'purpose'], problem: 'What NELFUND is / why it was created', stage: 'exploring', entities, isTroubleshooting: false }
  }

  if (isContrastFeesUpkeep(raw) || isContrastFeesUpkeep(q)) {
    return { intent: 'school-fees', confidence: 0.91, topics: ['fees', 'upkeep', 'contrast'], problem: 'School fees vs upkeep', stage: 'exploring', entities, isTroubleshooting: false }
  }
  if (isContrastLoginSignup(raw) || isContrastLoginSignup(q)) {
    return { intent: 'portal-login', confidence: 0.91, topics: ['login', 'signup', 'contrast'], problem: 'Login vs sign up', stage: 'preparing', entities, isTroubleshooting: false }
  }

  if (/\bupkeep\b|monthly\s*allowance|20,?000/i.test(q) && !/school\s*fees|institutional\s*charges|tuition/i.test(q) && !/never\s*see|pending|how\s*far|dem\s*never/i.test(q)) {
    return { intent: 'upkeep', confidence: 0.9, topics: ['upkeep'], problem: 'Upkeep allowance', stage: 'exploring', entities, isTroubleshooting: false }
  }
  if (/school\s*fees|institutional\s*charges|tuition/i.test(q) && !/\bupkeep\b/i.test(q)) {
    return { intent: 'school-fees', confidence: 0.9, topics: ['fees'], problem: 'School fees / institutional charges', stage: 'exploring', entities, isTroubleshooting: false }
  }
  if (
    /sign\s*up|create\s*(an?\s*)?account|register(\s|$)|how\s*(do\s*i|to)\s*apply|i\s*wan\s*apply|step\s*by\s*step|guide\s*me\s*(step|through|with)?|walk\s*me\s*through|one\s*by\s*one|creating\s*(it|account|profile)|help\s*me\s*(create|apply|register)/i.test(
      q,
    ) && !/sign\s*in|\blogin\b|log\s*in|password/i.test(q)
  ) {
    return { intent: 'how-to-apply', confidence: 0.9, topics: ['apply', 'signup'], problem: 'Create account / sign up', stage: 'preparing', entities, isTroubleshooting: false }
  }
  if (/(\blogin\b|log\s*in|sign\s*in|password|session\s*expired)/i.test(q) && !/sign\s*up|create\s*(an?\s*)?account/i.test(q)) {
    return { intent: 'portal-login', confidence: 0.9, topics: ['login'], problem: 'Sign in / login', stage: 'applying', entities, isTroubleshooting: false }
  }
  if (/invalid\s*jamb|jamb\s*invalid|jamb.*(invalid|fail|verif|format)|jamb\s*no\s*(gree|work)|utme\s*(number|verif)/i.test(q)) {
    return { intent: 'jamb-verification', confidence: 0.88, topics: ['jamb'], problem: 'JAMB verification', stage: 'applying', entities, isTroubleshooting: true }
  }
  if (/missing\s*information|school\s*not\s*(on\s*)?(the\s*)?(list|showing)|institution\s*not\s*found|school\s*no\s*(dey|gree)\s*show|my\s*school\s*no\s*dey|school\s*no\s*upload|data\s*no\s*dey|dem\s*never\s*upload/i.test(raw) || /missing\s*information|school\s*not\s*(on\s*)?(the\s*)?(list|showing)/i.test(q)) {
    return { intent: 'missing-information', confidence: 0.88, topics: ['missing'], problem: 'Missing information on portal', stage: 'applying', entities, isTroubleshooting: true }
  }
  if (/una\s+never\s+pay|money\s+never\s+enter|application\s+no\s+move|status\s+no\s+change|dem\s+never\s+approve|how\s+far\s+(my|with\s+my)|e\s+never\s+drop|i\s+don\s+apply|pending\s*status/i.test(raw) && !liveOpenRe().test(raw)) {
    return { intent: 'pending-application', confidence: 0.86, topics: ['pending'], problem: 'Application still pending', stage: 'waiting', entities, isTroubleshooting: true }
  }
  if (/\bpending\b|under\s*review|check\s*(my\s*)?(application\s*)?status|how\s*far\s*(with)?/i.test(q) && !liveOpenRe().test(raw)) {
    return { intent: 'pending-application', confidence: 0.86, topics: ['pending'], problem: 'Application still pending', stage: 'waiting', entities, isTroubleshooting: true }
  }
  if ((liveOpenRe().test(raw) || /current\s*(status|info|information|update)|latest\s*(update|news)/i.test(raw)) && !isPurposeAsk(raw)) {
    return { intent: 'current-information', confidence: 0.86, topics: ['current'], problem: 'Current or time-sensitive information', stage: 'exploring', entities, isTroubleshooting: false }
  }

  if (isPortalDump(q)) {
    if (/\bpending\b|under\s*review/i.test(q) || entities.includes('status')) {
      return { intent: 'pending-application', confidence: 0.72, topics: ['pending', 'portal-dump'], problem: 'Portal dump, pending', stage: 'waiting', entities, isTroubleshooting: true }
    }
    return { intent: 'current-information', confidence: 0.68, topics: ['current', 'portal-dump'], problem: 'Portal dashboard dump', stage: 'waiting', entities, isTroubleshooting: false }
  }

  const prior = lastUserIntent(history)
  const priorOverrideBlocked =
    PURPOSE_RE.test(raw) ||
    isPurposeAsk(raw) ||
    /\b(repay|repayment|pay\s*back|after\s*nysc)\b/i.test(raw) ||
    /invalid\s*jamb|jamb\s*invalid|\bjamb\b/i.test(raw) ||
    /missing\s*information|school\s*not\s*(on\s*)?(the\s*)?(list|showing)/i.test(raw) ||
    /\bpending\b|under\s*review/i.test(raw) ||
    liveOpenRe().test(raw)
  if (prior && prior !== 'unknown' && raw.length < 60 && !priorOverrideBlocked) {
    return { intent: prior, confidence: 0.55, topics: [], problem: null, stage: 'unknown', entities, isTroubleshooting: false }
  }

  if (/\b(scam|fake\s*agent|whatsapp\s*agent|pay\s*(me|us)\s*to\s*apply)\b/i.test(q)) {
    return { intent: 'scam-safety', confidence: 0.88, topics: ['scam'], problem: 'Scam warning', stage: 'exploring', entities, isTroubleshooting: true }
  }
  if (/\b(document|admission\s*letter|what\s*do\s*i\s*need|requirements?)\b/i.test(q) && !/school\s*not/i.test(q)) {
    return { intent: 'documents-needed', confidence: 0.8, topics: ['documents'], problem: 'Documents needed', stage: 'preparing', entities, isTroubleshooting: false }
  }
  if (/\b(repay|repayment|pay\s*back|after\s*nysc|when\s*(i|we)\s*go\s*pay|10\s*%\s*(of\s*)?(salary|profit))\b/i.test(q)) {
    return { intent: 'repayment', confidence: 0.86, topics: ['repayment'], problem: 'Repayment', stage: 'repaying', entities, isTroubleshooting: false }
  }
  if (/\b(eligib|who\s*can\s*apply|do\s*i\s*qualify|am\s*i\s*eligible)\b/i.test(q)) {
    return { intent: 'eligibility', confidence: 0.86, topics: ['eligibility'], problem: 'Eligibility', stage: 'exploring', entities, isTroubleshooting: false }
  }
  if (/^(hi|hello|hey|how\s*far|good\s*(morning|afternoon|evening))[.!? ]*$/i.test(raw)) {
    return { intent: 'official-sources', confidence: 0.7, topics: ['greeting'], problem: 'Greeting', stage: 'exploring', entities, isTroubleshooting: false }
  }

  const residual = residualSoftRoute(raw || q, entities)
  if (residual) return residual

  return { intent: 'official-sources', confidence: 0.4, topics: ['official'], problem: 'Official NELFUND links', stage: 'exploring', entities, isTroubleshooting: false }
}
