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
  /what\s*is\s*(the\s+)?(purpose\s+of\s+|aim\s+of\s+|meaning\s+of\s+)?(this\s+)?nelfund|wetin\s*(be|mean)\s*(this\s+)?nelfund|about\s+(this\s+)?nelfund|tell\s*me\s*(about|everything).{0,40}nelfund|why\s+(was|is|were|did|do|dem|they|una|we)\s+.{0,40}(nelfund|nel\s*fund|it|dis|this)?.{0,20}(created|create|establish|established|started|start|begin|form|formed|set\s*up|make|made)|why\s+(dem|they|una)\s+(take\s+)?(create|make|start|form)\s+(nelfund|am|it)|why\s+(they|dem)\s+(created|formed|started)\s+nelfund|why\s+nelfund\s+(was|is|dey|come|exist)|why\s+(was|is)\s+nelfund|why\s+nelfund\b|purpose\s+(of\s+)?nelfund|reason\s+(for|dem|they|una)\s+.{0,24}nelfund|mission\s+of\s+nelfund|nelfund\s+(purpose|mission|aim|objective|mean)|who\s+(created|established|started)\s+nelfund|wetin\s+(make|cause|make\s+una)\s+(dem|them|una)?\s*(create|start)|wetin\s+nelfund\s+dey\s+(do|mean)|how\s+come\s+.{0,20}nelfund|na\s+why\s+.{0,20}nelfund|wetin\s+be\s+the\s+(purpose|reason)|why\s+dem\s+create\s+nelfund|why\s+una\s+create|wetin\s+be\s+nelfund|^nelfund\??$/i

function liveOpenRe(): RegExp {
  return /is\s+(nelfund|it|portal|application|loan)\s+(still\s+)?(open|dey\s+open)|deadline|as\s+of\s+today|still\s+accept|can\s+i\s+still\s+apply|dem\s+still\s+dey\s+(collect|accept|open)|una\s+still\s+dey\s+(collect|open)|closing\s+date|opening\s+date|open\s*status|loan\s*window/i
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
  const raw = (question || '').trim()
  const q = expandWithContext(question, history).trim()
  const entities = detectEntities(q || raw)

  // Purpose on RAW text first so prior "is it open" turns cannot leak into live-status.
  if (PURPOSE_RE.test(raw) && !liveOpenRe().test(raw)) {
    return { intent: 'what-is-nelfund', confidence: 0.94, topics: ['what is', 'purpose'], problem: 'What NELFUND is / why it was created', stage: 'exploring', entities, isTroubleshooting: false }
  }
  if (PURPOSE_RE.test(q) && !liveOpenRe().test(raw)) {
    return { intent: 'what-is-nelfund', confidence: 0.93, topics: ['what is', 'purpose'], problem: 'What NELFUND is / why it was created', stage: 'exploring', entities, isTroubleshooting: false }
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
  if (/sign\s*up|create\s*(an?\s*)?account|register(\s|$)|how\s*(do\s*i|to)\s*apply|i\s*wan\s*apply/i.test(q) && !/sign\s*in|\blogin\b|log\s*in|password/i.test(q)) {
    return { intent: 'how-to-apply', confidence: 0.9, topics: ['apply', 'signup'], problem: 'Create account / sign up', stage: 'preparing', entities, isTroubleshooting: false }
  }
  if (/(\blogin\b|log\s*in|sign\s*in|password|session\s*expired)/i.test(q) && !/sign\s*up|create\s*(an?\s*)?account/i.test(q)) {
    return { intent: 'portal-login', confidence: 0.9, topics: ['login'], problem: 'Sign in / login', stage: 'applying', entities, isTroubleshooting: false }
  }
  if (/invalid\s*jamb|jamb.*(invalid|fail|verif|format)|jamb\s*no\s*(gree|work)|utme\s*(number|verif)/i.test(q)) {
    return { intent: 'jamb-verification', confidence: 0.88, topics: ['jamb'], problem: 'JAMB verification', stage: 'applying', entities, isTroubleshooting: true }
  }
  if (/missing\s*information|school\s*not\s*(on\s*)?(the\s*)?(list|showing)|institution\s*not\s*found/i.test(q)) {
    return { intent: 'missing-information', confidence: 0.88, topics: ['missing'], problem: 'Missing information on portal', stage: 'applying', entities, isTroubleshooting: true }
  }
  if (/\bpending\b|under\s*review|check\s*(my\s*)?(application\s*)?status|how\s*far\s*(with)?/i.test(q) && !liveOpenRe().test(raw)) {
    return { intent: 'pending-application', confidence: 0.86, topics: ['pending'], problem: 'Application still pending', stage: 'waiting', entities, isTroubleshooting: true }
  }
  if (liveOpenRe().test(raw) || liveOpenRe().test(q) || /current\s*(status|info|information|update)|latest\s*(update|news)/i.test(raw)) {
    return { intent: 'current-information', confidence: 0.86, topics: ['current'], problem: 'Current or time-sensitive information', stage: 'exploring', entities, isTroubleshooting: false }
  }

  if (isPortalDump(q)) {
    if (/\bpending\b|under\s*review/i.test(q) || entities.includes('status')) {
      return { intent: 'pending-application', confidence: 0.72, topics: ['pending', 'portal-dump'], problem: 'Portal dump, pending', stage: 'waiting', entities, isTroubleshooting: true }
    }
    return { intent: 'current-information', confidence: 0.68, topics: ['current', 'portal-dump'], problem: 'Portal dashboard dump', stage: 'waiting', entities, isTroubleshooting: false }
  }

  const prior = lastUserIntent(history)
  if (prior && prior !== 'unknown' && raw.length < 60 && !PURPOSE_RE.test(raw)) {
    return { intent: prior, confidence: 0.55, topics: [], problem: null, stage: 'unknown', entities, isTroubleshooting: false }
  }

  if (/\b(scam|fake\s*agent|whatsapp\s*agent|pay\s*(me|us)\s*to\s*apply)\b/i.test(q)) {
    return { intent: 'scam-safety', confidence: 0.88, topics: ['scam'], problem: 'Scam warning', stage: 'exploring', entities, isTroubleshooting: true }
  }
  if (/\b(document|admission\s*letter|what\s*do\s*i\s*need|requirements?)\b/i.test(q) && !/school\s*not/i.test(q)) {
    return { intent: 'documents-needed', confidence: 0.8, topics: ['documents'], problem: 'Documents needed', stage: 'preparing', entities, isTroubleshooting: false }
  }
  if (/\b(repay|repayment|pay\s*back|after\s*nysc)\b/i.test(q)) {
    return { intent: 'repayment', confidence: 0.86, topics: ['repayment'], problem: 'Repayment', stage: 'repaying', entities, isTroubleshooting: false }
  }
  if (/\b(eligib|who\s*can\s*apply|do\s*i\s*qualify|am\s*i\s*eligible)\b/i.test(q)) {
    return { intent: 'eligibility', confidence: 0.86, topics: ['eligibility'], problem: 'Eligibility', stage: 'exploring', entities, isTroubleshooting: false }
  }
  if (/^(hi|hello|hey|how\s*far|good\s*(morning|afternoon|evening))[.!? ]*$/i.test(raw)) {
    return { intent: 'current-information', confidence: 0.7, topics: ['greeting'], problem: 'Greeting', stage: 'exploring', entities, isTroubleshooting: false }
  }

  const residual = residualSoftRoute(raw || q, entities)
  if (residual) return residual

  // Never emit unknown: always a real intent so analytics stop inflating unknown rate
  return { intent: 'official-sources', confidence: 0.4, topics: ['official'], problem: 'Official NELFUND links', stage: 'exploring', entities, isTroubleshooting: false }
}
