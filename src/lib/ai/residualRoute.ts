import type { IntentId, IntentResult, StudentStage, ConversationTurn } from './types'

export function detectEntities(q: string): string[] {
  const entities: string[] = []
  const map: [RegExp, string][] = [
    [/\bjamb\b|utme|invalid\s*format|verification\s*fail/i, 'jamb'],
    [/\bnin\b|national\s*identity/i, 'nin'],
    [/\bbvn\b|bank\s*verification/i, 'bvn'],
    [/sign\s*up|create\s*(an?\s*)?account|register|i\s*wan(t)?\s*(to\s*)?apply/i, 'apply'],
    [/(\blogin\b|log\s*in|sign\s*in|password|session)/i, 'login'],
    [/email\s*(already\s*)?(used|taken|exist)|used\s*email|already\s*register|registered\s*last\s*year/i, 'login'],
    [/pending|status|under\s*review|how\s*far|never\s*(pay|come|enter|see|collect|receive)|already\s*appl|i\s*don\s*apply|money\s*no\s*drop|no\s*alert/i, 'status'],
    [/upkeep|monthly\s*allowance|stipend|20,?000/i, 'upkeep'],
    [/school\s*fees?|institutional\s*charges|tuition/i, 'fees'],
    [/repay|gsi|pay\s*back|scholarship|after\s*nysc/i, 'repayment'],
    [/missing\s*info|school\s*not|not\s*on\s*(the\s*)?list|institution\s*not|unilag|lasu|\boou\b|yabatech|unilorin|my\s*school/i, 'school'],
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

  // Email already registered → sign in (not another sign-up)
  if (/email\s*(already\s*)?(used|taken|exist)|used\s*email|already\s*(used|taken|registered|register)|registered\s*last\s*year|account\s*already\s*(exist|dey)|i\s*(don|already)\s*register/i.test(text)) {
    return hit('portal-login', 'Email already used, sign in not sign up', 'applying', ['login', 'email-used', 'existing-account'], entities, true, 0.92)
  }

  if (/how\s*far|pending|under\s*review|money\s*never|never\s*(see|enter|collect|receive|pay|send)|i\s*don\s*apply|already\s*appl|money\s*no\s*drop|no\s*alert|no\s*credit|alert\s*(no|not|never)|still\s*waiting|dem\s*never\s*(pay|send)|una\s*never\s*pay|next\s*batch|second\s*batch|declin|reject(ed|ion)|unsuccessful|check\s*(my\s*)?(loan|application|status)|when\s*(will|go)\s*(they|dem|una)\s*(pay|send)|application\s*(no|not)\s*move|approv(ed|al).{0,40}(no|never|not).{0,20}(money|alert|upkeep|enter)|e\s*no\s*(dey\s*)?(show|drop|enter|change)|nothing\s*dey\s*happen|status\s*(no|not|never)\s*(change|move)|they\s*(don|have)\s*pay(ed)?\s*(my\s*)?school|school\s*(don|has)\s*(collect|receive).{0,24}(me|i|upkeep|alert)|when\s*(will|go)\s*(they|dem)\s*pay\s*(my\s*)?(school\s*)?fees|dem\s*don\s*pay\s*(the\s*)?school|school\s*don\s*collect|i\s*no\s*see\s*(alert|money|credit)|my\s*(account|bank)\s*(no|not|never)\s*(credit|alert)|nothing\s*enter|loan\s*(no|not)\s*(pay|drop)|una\s*don\s*forget\s*me|dem\s*forget\s*me|why\s*(dem|they)\s*no\s*pay|why\s*no\s*(alert|credit|money)|batch\s*(no|not)\s*(come|drop)|disburs(e|ement).{0,20}(no|not|never)|i\s*still\s*dey\s*wait/i.test(text) && !liveishOpen(text)) {
    return hit('pending-application', 'Pending / declined / wait', 'waiting', ['pending-status', 'pending'], entities, true, 0.72)
  }
  if (/\bjamb\b|utme|invalid\s*format|verification\s*fail|wrong\s*jamb/i.test(text)) {
    return hit('jamb-verification', 'JAMB verification', 'applying', ['jamb'], entities, true, 0.7)
  }
  if (liveishOpen(text) || /deadline|closing\s+date|nelfund\s+(open|close)|dem\s+don\s+close|can\s+i\s+still\s+apply/i.test(text)) {
    return hit('current-information', 'Open status / is NELFUND open', 'exploring', ['open-status', 'current'], entities, false, 0.72)
  }
  if (/\brepay|repayment|pay\s*back|after\s*nysc|gsi\b|scholarship|grant|free\s*money|interest[\s-]*free|na\s+(loan|scholarship)|is\s+(nelfund|it|this)\s+(a\s+)?(loan|scholarship|grant)/i.test(text)) {
    if (/scholarship|grant|free\s*money|is\s+(nelfund|it|this)\s+(a\s+)?(loan|scholarship)/i.test(text)) {
      return hit('loan-or-scholarship', 'Loan vs scholarship', 'exploring', ['loan'], entities, false, 0.7)
    }
    if (/interest[\s-]*free/i.test(text)) {
      return hit('what-is-nelfund', 'Interest-free loan purpose', 'exploring', ['what is', 'purpose'], entities, false, 0.7)
    }
    return hit('repayment', 'Repayment rules', 'repaying', ['repayment'], entities, false, 0.7)
  }
  if (/which\s*(website|site|link)|abeg\s*which\s*site|forgot\s*(my\s*)?password|cannot\s*login|otp|verification\s*code|portal\s*(no|not)\s*(load|open|work|gree)|e\s*no\s*(gree|work)|site\s*(no|not)\s*(open|load)/i.test(text)) {
    return hit('portal-login', 'Login / site / OTP', 'applying', ['login'], entities, true, 0.72)
  }
  if (/why\s+(was|is|dem|they|una)|purpose|wetin\s*(be|mean)|what\s*is\s*(this\s*)?nelfund|explain\s*(nelfund|this\s*loan)/i.test(text)) {
    return hit('what-is-nelfund', 'Why NELFUND was created / purpose', 'exploring', ['what is', 'purpose'], entities, false, 0.74)
  }
  if (/how\s*(to|do\s*i|i\s*go)\s*apply|i\s*wan(t)?\s*(to\s*)?apply|sign\s*up|create\s*(an?\s*)?account|step\s*by\s*step|guide\s*me|first\s*time|what\s*(do\s*i\s*do\s*)?next|cannot\s*submit/i.test(text) && !liveishOpen(text) && !/email\s*(already\s*)?(used|taken)|already\s*register|registered\s*last\s*year/i.test(text)) {
    return hit('how-to-apply', 'How to apply / next step', 'preparing', ['how-to-apply'], entities, false, 0.7)
  }
  if (/refund|already\s*paid\s*(school|fees)|i\s*don\s*pay\s*(my\s*)?(school\s*)?fees/i.test(text)) {
    return hit('school-fees', 'Fees / refund', 'exploring', ['fees'], entities, true, 0.7)
  }
  if (/upkeep|monthly\s*allowance|20,?000|hostel|feeding|living\s*money/i.test(text) && !liveishOpen(text)) {
    return hit('upkeep', 'Upkeep allowance', 'exploring', ['upkeep'], entities, false, 0.7)
  }
  if (/institution(al)?\s*(fee|charge|pay).{0,28}(paid|pay|done)|school\s*(don|has|have)\s*(receive|collect|get)|pay(ment)?\s*(to\s*)?(my\s*)?school.{0,24}(me|upkeep|alert|student)/i.test(text)) {
    return hit('pending-application', 'School paid, student still waiting', 'waiting', ['pending-status', 'disbursement'], entities, true, 0.7)
  }
  if (/change\s*(my\s*)?(bank|account)|wrong\s*(bank\s*)?account|update\s*(my\s*)?(bank|account|profile)|account\s*number\s*(no|not|wrong)|\b(opay|palmpay|moniepoint|wallet)\b/i.test(text)) {
    return hit('documents-needed', 'Bank / profile update', 'preparing', ['documents', 'bank'], entities, true, 0.7)
  }
  if (/^(unilag|lasu|oou|yabatech|unilorin|uniben|oau|unijos|noun|futo|futa|abu|my\s*school)[.!? ]*$/i.test(text)) {
    return hit('missing-information', 'School name only', 'applying', ['school-list', 'school'], entities, true, 0.62)
  }
  if (/missing\s*information|school\s*not|not\s*on\s*(the\s*)?list|transfer\s*student|change\s*(of\s*)?(course|school)|school\s*(no|not|never)\s*(upload|show)|dem\s*never\s*upload/i.test(text) || entities.includes('school')) {
    return hit('missing-information', 'School / missing information', 'applying', ['missing-info', 'school'], entities, true, 0.68)
  }
  if (/(name|details?).{0,24}(no|not|never)\s*(match|gree)|mismatch|\bbvn\b|\bnin\b/i.test(text) && !/\bjamb\b/i.test(text)) {
    return hit('documents-needed', 'Documents / mismatch', 'preparing', ['documents'], entities, true, 0.7)
  }
  if (
    /private\s*(uni|university)|part[\s-]*time|\bnoun\b|masters?\b|\bphd\b|foreign\s*student|not\s*a\s*nigerian|400\s*level|final\s*year|who\s*can\s*apply|eligib|vocational|nursing\s*student|polytechnic|\bpoly\b|\bcoe\b|college\s*of\s*education|\bnd\b|\bhnd\b|i\s*don\s*graduate|already\s*graduate|i\s*dey\s*nysc/i.test(
      text,
    )
  ) {
    return hit('eligibility', 'Eligibility', 'exploring', ['eligibility'], entities, false, 0.7)
  }
  if (/how\s*many\s*(students?|people|applications?)|total\s*(disburse|loan|beneficiar)|n355|355\s*billion|disbursement\s*report/i.test(text)) {
    return hit('current-information', 'Programme scale / latest figures', 'exploring', ['current'], entities, false, 0.7)
  }
  if (/\b(scam|fake\s*agent|whatsapp\s*agent)\b/i.test(text)) {
    return hit('scam-safety', 'Scam / fake agent warning', 'exploring', ['scam'], entities, true, 0.7)
  }
  if (/official\s*(email|contact)|how\s*(do\s*i|i\s*go)\s*contact|esupport|nelfund\s*(email|phone)/i.test(text) || entities.includes('contact')) {
    return hit('contact-support', 'Official contact', 'exploring', ['contact'], entities, false, 0.7)
  }
  if (/^(help|please\s*help|i\s*(need|wan(t)?)\s*help|abeg\s*help|i\s*get\s*(issue|problem|wahala)|there\s*is\s*(an?\s*)?(issue|problem))[.!? ]*$/i.test(text)) {
    return hit('official-sources', 'Vague help, offer lanes', 'exploring', ['guidance'], entities, false, 0.62)
  }
  if (/help\s*me|i\s*(need|wan(t)?)\s*help|i\s*get\s*(issue|problem|wahala)|problem\s*with|issue\s*with/i.test(text) && /nelfund|loan|portal|apply/i.test(text) && !liveishOpen(text)) {
    return hit('how-to-apply', 'Help applying / issue with process', 'preparing', ['how-to-apply', 'guidance'], entities, false, 0.6)
  }
  if (entities.includes('login')) return hit('portal-login', 'Sign in / login', 'applying', ['login'], entities, false, 0.7)
  if (entities.includes('apply') || entities.includes('documents')) {
    return hit(entities.includes('documents') ? 'documents-needed' : 'how-to-apply', entities.includes('documents') ? 'Documents needed' : 'How to apply', 'preparing', entities.includes('documents') ? ['documents'] : ['apply'], entities)
  }
  if (entities.includes('status') || entities.includes('disbursement')) {
    return hit('pending-application', 'Status / disbursement leftover', 'waiting', ['pending-status'], entities, true, 0.5)
  }
  if (/e\s*no\s*dey|nothing\s*happen|still\s*the\s*same|no\s*update|silent|dem\s*forget\s*me/i.test(text)) {
    return hit('pending-application', 'No update leftover', 'waiting', ['pending-status'], entities, true, 0.55)
  }
  if (/create|account|register|apply|profile|submit|step/i.test(text) && !/email\s*(already\s*)?(used|taken)|already\s*register|registered\s*last\s*year/i.test(text)) {
    return hit('how-to-apply', 'Apply leftover', 'preparing', ['how-to-apply'], entities, false, 0.5)
  }
  return hit('official-sources', 'Official NELFUND links', 'exploring', ['guidance'], entities, false, 0.42)
}
