import type { IntentId, IntentResult, StudentStage, ConversationTurn } from './types'

export function detectEntities(q: string): string[] {
  const entities: string[] = []
  const map: [RegExp, string][] = [
    [/\bjamb\b|utme|invalid\s*format|verification\s*fail/i, 'jamb'],
    [/\bnin\b|national\s*identity/i, 'nin'],
    [/\bbvn\b|bank\s*verification/i, 'bvn'],
    [/sign\s*up|create\s*(an?\s*)?account|register|i\s*wan(t)?\s*(to\s*)?apply/i, 'apply'],
    [/(\blogin\b|log\s*in|sign\s*in|password|session)/i, 'login'],
    [/pending|status|under\s*review|how\s*far|never\s*(pay|come|enter|see|collect|receive)|already\s*appl|i\s*don\s*apply|money\s*no\s*drop|no\s*alert/i, 'status'],
    [/upkeep|monthly\s*allowance|stipend|20,?000/i, 'upkeep'],
    [/school\s*fees?|institutional\s*charges|tuition/i, 'fees'],
    [/repay|gsi|pay\s*back|scholarship|after\s*nysc/i, 'repayment'],
    [/missing\s*info|school\s*not|not\s*on\s*(the\s*)?list|institution\s*not/i, 'school'],
    [/admission\s*letter|matric|documents?\s*need|requirements?/i, 'documents'],
    [/help|abeg|assist|guide|stuck|wahala/i, 'help'],
    [/portal|dashboard|nelf\.gov|nelfund/i, 'portal'],
    [/error|fail|invalid|reject|denied/i, 'error'],
    [/contact|support|ticket|esupport|email/i, 'contact'],
    [/disburse|payment|paid|credit/i, 'disbursement'],
  ]
  for (const [re, name] of map) {
    if (re.test(q)) entities.push(name)
  }
  return [...new Set(entities)]
}

export function expandWithContext(question: string, history?: ConversationTurn[]): string {
  const q = (question || '').trim()
  if (!history?.length) return q
  const lastUser = [...history].reverse().find((h) => h.role === 'user')
  if (lastUser?.text && q.length < 40 && !/nelfund|apply|portal|loan/i.test(q)) {
    return `${lastUser.text}\n${q}`
  }
  return q
}

export function isPortalDump(q: string): boolean {
  return (
    /total\s*loans|pending\s*loans|signed\s*in\s*as|dashboard|application\s*id\s*:/i.test(q) ||
    (q.length > 200 && /portal|nelfund|status/i.test(q))
  )
}

export function lastUserIntent(history?: ConversationTurn[]): IntentId | null {
  if (!history?.length) return null
  for (let i = history.length - 1; i >= 0; i--) {
    const h = history[i]
    if (h.role === 'assistant' && h.intent && h.intent !== 'unknown') return h.intent
  }
  return null
}

function hit(
  intent: IntentId,
  problem: string,
  stage: StudentStage,
  topics: string[],
  entities: string[],
  isTroubleshooting = false,
  confidence = 0.6,
): IntentResult {
  return { intent, confidence, topics, problem, stage, entities, isTroubleshooting }
}

function liveishOpen(text: string): boolean {
  return /is\s+(nelfund|it|portal|loan|application)\s+(still\s+)?(open|dey\s+open)|deadline|still\s+accept|can\s+i\s+still\s+apply/i.test(
    text,
  )
}

/** Soft map leftover / long / Pidgin / multi-issue text onto a real intent. Never returns unknown. */
export function residualSoftRoute(q: string, entities: string[]): IntentResult | null {
  const text = q.trim()
  if (!text) return hit('official-sources', 'Empty message, offer guidance', 'exploring', ['empty', 'guidance'], entities, false, 0.7)

  if (/^(hi|hii+|hello|hey|heyy+|yo|sup|wassup|whatsup|good\s*(morning|afternoon|evening|day)|how\s*you\s*dey|thanks?|thank\s*you|tenki)[.!? ]*$/i.test(text)) {
    return hit('official-sources', 'Greeting, offer menu', 'exploring', ['greeting', 'guidance'], entities, false, 0.65)
  }

  if (/how\s*far|pending|under\s*review|money\s*never|never\s*(see|enter|collect|receive|pay)|i\s*don\s*apply|already\s*appl|money\s*no\s*drop|no\s*alert|still\s*waiting|dem\s*never\s*pay|una\s*never\s*pay|next\s*batch|second\s*batch|declin|reject(ed|ion)|unsuccessful/i.test(text) && !liveishOpen(text)) {
    return hit('pending-application', 'Pending / declined / wait', 'waiting', ['pending-status', 'pending'], entities, true, 0.72)
  }
  if (/\bjamb\b|utme|invalid\s*format|verification\s*fail|wrong\s*jamb/i.test(text)) {
    return hit('jamb-verification', 'JAMB verification', 'applying', ['jamb'], entities, true, 0.7)
  }
  if (liveishOpen(text) || /deadline|closing\s+date|nelfund\s+(open|close)|dem\s+don\s+close|can\s+i\s+still\s+apply/i.test(text)) {
    return hit('current-information', 'Open status / is NELFUND open', 'exploring', ['open-status', 'current'], entities, false, 0.72)
  }
  if (/\brepay|repayment|pay\s*back|after\s*nysc|gsi\b|scholarship|grant/i.test(text)) {
    if (/scholarship|grant|free\s*money/i.test(text)) {
      return hit('loan-or-scholarship', 'Loan vs scholarship', 'exploring', ['loan'], entities, false, 0.7)
    }
    return hit('repayment', 'Repayment rules', 'repaying', ['repayment'], entities, false, 0.7)
  }
  if (/which\s*(website|site|link)|abeg\s*which\s*site|forgot\s*(my\s*)?password|cannot\s*login|otp|verification\s*code|portal\s*(no|not)\s*(load|open|work)/i.test(text)) {
    return hit('portal-login', 'Login / site / OTP', 'applying', ['login'], entities, true, 0.72)
  }
  if (/why\s+(was|is|dem|they|una)|purpose|wetin\s*(be|mean)|what\s*is\s*(this\s*)?nelfund|explain\s*(nelfund|this\s*loan)/i.test(text)) {
    return hit('what-is-nelfund', 'Why NELFUND was created / purpose', 'exploring', ['what is', 'purpose'], entities, false, 0.74)
  }
  if (/how\s*(to|do\s*i|i\s*go)\s*apply|i\s*wan(t)?\s*(to\s*)?apply|sign\s*up|create\s*(an?\s*)?account|step\s*by\s*step|guide\s*me|first\s*time|what\s*(do\s*i\s*do\s*)?next|e\s*no\s*(gree|work)|cannot\s*submit/i.test(text) && !liveishOpen(text)) {
    return hit('how-to-apply', 'How to apply / next step', 'preparing', ['how-to-apply'], entities, false, 0.7)
  }
  if (/refund|already\s*paid\s*(school|fees)|i\s*don\s*pay\s*(my\s*)?(school\s*)?fees/i.test(text)) {
    return hit('school-fees', 'Fees / refund', 'exploring', ['fees'], entities, true, 0.7)
  }
  if (/upkeep|monthly\s*allowance|20,?000|hostel|feeding|living\s*money/i.test(text) && !liveishOpen(text)) {
    return hit('upkeep', 'Upkeep allowance', 'exploring', ['upkeep'], entities, false, 0.7)
  }
  if (/missing\s*information|school\s*not|not\s*on\s*(the\s*)?list|transfer\s*student|change\s*(of\s*)?(course|school)/i.test(text) || entities.includes('school')) {
    return hit('missing-information', 'School / missing information', 'applying', ['missing-info', 'school'], entities, true, 0.68)
  }
  if (/(name|details?).{0,24}(no|not|never)\s*(match|gree)|mismatch|\bbvn\b|\bnin\b/i.test(text) && !/\bjamb\b/i.test(text)) {
    return hit('documents-needed', 'Documents / mismatch', 'preparing', ['documents'], entities, true, 0.7)
  }
  if (/private\s*(uni|university)|part[\s-]*time|\bnoun\b|masters?\b|\bphd\b|foreign\s*student|not\s*a\s*nigerian|400\s*level|final\s*year|who\s*can\s*apply|eligib/i.test(text)) {
    return hit('eligibility', 'Eligibility', 'exploring', ['eligibility'], entities, false, 0.7)
  }
  if (/\b(scam|fake\s*agent|whatsapp\s*agent)\b/i.test(text)) {
    return hit('scam-safety', 'Scam / fake agent warning', 'exploring', ['scam'], entities, true, 0.7)
  }
  if (/official\s*(email|contact)|how\s*(do\s*i|i\s*go)\s*contact|esupport|nelfund\s*(email|phone)/i.test(text) || entities.includes('contact')) {
    return hit('contact-support', 'Official contact', 'exploring', ['contact'], entities, false, 0.7)
  }
  if (entities.includes('login')) return hit('portal-login', 'Sign in / login', 'applying', ['login'], entities, false, 0.7)
  if (entities.includes('apply') || entities.includes('documents')) {
    return hit(entities.includes('documents') ? 'documents-needed' : 'how-to-apply', entities.includes('documents') ? 'Documents needed' : 'How to apply', 'preparing', entities.includes('documents') ? ['documents'] : ['apply'], entities)
  }
  if (entities.includes('status') || entities.includes('disbursement')) {
    return hit('pending-application', 'Status / disbursement leftover', 'waiting', ['pending-status'], entities, true, 0.5)
  }
  return hit('official-sources', 'Official NELFUND links', 'exploring', ['guidance'], entities, false, 0.42)
}
