import type { IntentId, IntentResult, StudentStage, ConversationTurn } from './types'

export function detectEntities(q: string): string[] {
  const entities: string[] = []
  const map: [RegExp, string][] = [
    [/\bjamb\b|utme|jamb\s*(reg|no|number|id)|direct\s*entry|invalid\s*format|verification\s*fail/i, 'jamb'],
    [/\bnin\b|national\s*identity/i, 'nin'],
    [/\bbvn\b|bank\s*verification/i, 'bvn'],
    [/sign\s*up|create\s*(an?\s*)?account|register|i\s*wan(t)?\s*(to\s*)?apply|first\s*time\s*apply/i, 'apply'],
    [/(\blogin\b|log\s*in|sign\s*in|password|session)/i, 'login'],
    [/pending|status|under\s*review|how\s*far|never\s*(pay|come|enter|see|collect|receive)|nothing\s*dey\s*happen|wetin\s*dey\s*happen|application\s*(id|number)|still\s*waiting|no\s*update|haven'?t\s*(got|gotten|received)|no\s*see\s*(my\s*)?(upkeep|money|loan)|my\s*own\s*never|dem\s*don\s*pay|others\s*don\s*(collect|receive|see)|check\s*am|already\s*appl|i\s*don\s*apply|money\s*no\s*drop|alert\s*no\s*(dey|enter)|no\s*alert|application\s*don\s*tey|since\s*(last|january|february|march)/i, 'status'],
    [/upkeep|monthly\s*allowance|stipend|20,?000/i, 'upkeep'],
    [/school\s*fees?|institutional\s*charges|tuition/i, 'fees'],
    [/repay|gsi|pay\s*back|imprison|jail|prison|scholarship|when\s*i\s*go\s*pay|after\s*nysc/i, 'repayment'],
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

  if (/^(how\s*far|howfar)[.!? ]*$/i.test(text) || /how\s*far\s*(with|about|on)?\s*(my\s*)?(loan|application|nelfund|status|upkeep|money)?/i.test(text)) {
    return hit('pending-application', 'How far / pending status', 'waiting', ['pending-status', 'pending'], entities, true, 0.72)
  }
  if (/\bpending\b|under\s*review|still\s*waiting|no\s*update|money\s*never|never\s*(see|enter|collect|receive|pay)|una\s*never\s*pay|dem\s*never\s*pay|check\s*(my\s*)?(status|application|loan)|application\s*status|alert\s*(never|no)\s*(enter|come|drop)|no\s*alert|application\s*don\s*tey|e\s*don\s*tey|since\s*(last\s*)?(month|year|january|february|march|april|may|june|july|august|september)/i.test(text)) {
    return hit('pending-application', 'Pending / under review status', 'waiting', ['pending-status', 'pending'], entities, true, 0.7)
  }
  if (
    /i\s*don\s*apply|already\s*appl(y|ied)|i\s*have\s*(already\s*)?appl(y|ied)|submitted\s*(already|my)|i\s*don\s*submit|application\s*don\s*go|when\s*(will|go)\s*(they|dem|una)\s*(pay|disburse)|dem\s*go\s*pay|money\s*no\s*drop|e\s*never\s*drop|nothing\s*don\s*enter|no\s*alert|una\s*never\s*pay\s*me|my\s*own\s*never\s*(enter|come|drop)|others?\s*don\s*(collect|receive|see)|check\s*(am|my\s*loan)/i.test(
      text,
    ) && !liveishOpen(text)
  ) {
    return hit('pending-application', 'Already applied / waiting for pay', 'waiting', ['pending-status', 'guidance'], entities, true, 0.7)
  }
  if (/\bjamb\b|utme|invalid\s*format|verification\s*fail|could\s*not\s*verify|jamb\s*(no|number|id)\s*(no|never|dey)\s*(gree|work|enter)|portal\s*(no|never)\s*(gree|accept)\s*(my\s*)?jamb|jamb\s*dey\s*reject/i.test(text)) {
    return hit('jamb-verification', 'JAMB verification', 'applying', ['jamb'], entities, true, 0.7)
  }
  if (/is\s+(nelfund|it|portal|loan|application)\s+(still\s+)?(open|dey\s+open)|still\s+accept|can\s+i\s+still\s+apply|deadline|closing\s+date|opening\s+date|loan\s*window/i.test(text)) {
    return hit('current-information', 'Open status / is NELFUND open', 'exploring', ['open-status', 'current'], entities, false, 0.72)
  }
  if (/\brepay|repayment|pay\s*back|after\s*nysc|10\s*%|gsi\b|loan\s*or\s*scholarship|is\s*(it|this)\s*(a\s*)?(scholarship|grant)/i.test(text)) {
    if (/scholarship|grant|free\s*money/i.test(text)) {
      return hit('loan-or-scholarship', 'Loan vs scholarship', 'exploring', ['loan'], entities, false, 0.7)
    }
    return hit('repayment', 'Repayment rules', 'repaying', ['repayment'], entities, false, 0.7)
  }
  if (/which\s*(website|site|link|url)|where\s*(do\s*i|i\s*go)\s*(go\s*)?(login|sign|apply|register)|abeg\s*which\s*site/i.test(text)) {
    return hit('portal-login', 'Which official website', 'preparing', ['login', 'guidance'], entities, false, 0.72)
  }
  if (/forgot\s*(my\s*)?password|reset\s*(my\s*)?password|password\s*(no|never|not)\s*(gree|work)|cannot\s*login|can\s*not\s*login/i.test(text)) {
    return hit('portal-login', 'Password reset / cannot login', 'applying', ['login', 'password-reset'], entities, true, 0.74)
  }
  if (/how\s*long\s*(does|do|go)\s*(approval|pending|it)|when\s*(will|go)\s*(money|upkeep|loan|alert)\s*(enter|come|drop|pay)|when\s*(dem|they|una)\s*(go\s*)?pay/i.test(text) && !liveishOpen(text)) {
    return hit('pending-application', 'How long / when will money enter', 'waiting', ['pending-status', 'pending'], entities, true, 0.74)
  }
  if (/official\s*(email|mail|contact)|how\s*(do\s*i|i\s*go)\s*contact|nelfund\s*(email|phone|hotline)/i.test(text)) {
    return hit('contact-support', 'Official contact / email', 'exploring', ['contact'], entities, false, 0.72)
  }
  if (/help\s*me\s*understand|i\s*want\s*to\s*understand|explain\s*(nelfund|this\s*loan|the\s*loan)/i.test(text) && !liveishOpen(text) && !/\bpending\b|how\s*far/i.test(text)) {
    return hit('what-is-nelfund', 'Help understand NELFUND', 'exploring', ['what is', 'purpose'], entities, false, 0.74)
  }
  if (/list\s*of\s*schools|which\s*schools|school\s*list|schools\s*(that\s*)?(dey|are)\s*(on|for)\s*nelfund/i.test(text)) {
    return hit('school-not-found', 'School list question', 'applying', ['school-list', 'school'], entities, true, 0.65)
  }
  if (/private\s*(uni|university|school|poly)|part[\s-]*time|\bnoun\b|national\s*open\s*university|post\s*grad|masters?\b|\bphd\b/i.test(text) && !/\bpending\b|how\s*far/i.test(text)) {
    return hit('eligibility', 'Private / part-time / NOUN eligibility', 'exploring', ['eligibility', 'guidance'], entities, false, 0.7)
  }
  if (/no\s*matric|don'?t\s*have\s*(a\s*)?matric|matric\s*(never|no\s*dey|not\s*ready)|fresher|just\s*admit/i.test(text) && !/\bpending\b|how\s*far|money\s*never/i.test(text)) {
    return hit('how-to-apply', 'Fresher / no matric yet', 'preparing', ['how-to-apply', 'documents'], entities, false, 0.7)
  }
  if (
    /\b(approv(ed|al)|successful)\b/i.test(text) &&
    /(no|never|not|no\s*see|no\s*collect|no\s*drop|no\s*alert|nothing).{0,24}(money|upkeep|alert|pay|enter|drop)|but\s*(no|never|nothing)|money\s*(never|no)/i.test(text) &&
    !liveishOpen(text)
  ) {
    return hit('pending-application', 'Approved / successful but no money', 'waiting', ['pending-status', 'approval'], entities, true, 0.74)
  }
  if (
    /(no|never|not|cannot|can\s*not|e\s*no)\s*(gree\s*)?(submit|go\s*submit|send\s*(the\s*)?application)|cannot\s*submit|submit\s*(button\s*)?(no|not|never)\s*(gree|work)|form\s*(no|not)\s*(gree|submit)/i.test(
      text,
    ) && !/\bjamb\b|invalid\s*format/i.test(text)
  ) {
    return hit('how-to-apply', 'Cannot submit application form', 'applying', ['how-to-apply', 'submit'], entities, true, 0.7)
  }
  if (
    /re-?apply|apply\s*(again|twice|two\s*times)|second\s*application|two\s*applications|another\s*application|i\s*(wan|want)\s*(to\s*)?apply\s*again/i.test(
      text,
    ) && !liveishOpen(text)
  ) {
    if (/\bpending\b|how\s*far|money\s*never|still\s*waiting|under\s*review/i.test(text)) {
      return hit('pending-application', 'Reapply while still pending', 'waiting', ['pending-status', 'reapply'], entities, true, 0.72)
    }
    return hit('how-to-apply', 'Reapply / apply again', 'preparing', ['how-to-apply', 'reapply'], entities, false, 0.7)
  }
  if (
    /next\s*(academic\s*)?(session|semester|year)|apply\s*(next|again)\s*(year|session)|when\s*(is|go)\s*(the\s*)?next\s*(window|cycle|application)/i.test(
      text,
    ) && !/\bpending\b|how\s*far|money\s*never/i.test(text)
  ) {
    return hit('current-information', 'Next window / next session', 'exploring', ['open-status', 'current'], entities, false, 0.7)
  }
  if (
    /(hostel|accommodation|feeding|transport|living)\s*(allowance|money|loan)|only\s*(hostel|upkeep|feeding)|i\s*(just|only)\s*need\s*(hostel|feeding|accommodation)|i\s*need\s*money\s*for\s*(accommodation|feeding|hostel|transport)/i.test(
      text,
    ) && !liveishOpen(text) && !/\bpending\b|how\s*far/i.test(text)
  ) {
    return hit('upkeep', 'Hostel / feeding / living money only', 'exploring', ['upkeep', 'guidance'], entities, false, 0.7)
  }
  if (
    /i\s*(don|have|just)\s*(graduate|graduated|finish|finished)|i\s*(don|have)\s*done\s*nysc|after\s*i\s*(graduate|finish)|i\s*no\s*dey\s*school\s*again/i.test(
      text,
    ) && !/\bpending\b|how\s*far|money\s*never/i.test(text)
  ) {
    return hit('eligibility', 'Graduate / finished school eligibility', 'exploring', ['eligibility', 'guidance'], entities, false, 0.72)
  }
  if (
    /\b(coe|college\s*of\s*education|vocational|nce|nd\b|hnd\b|polytechnic)\b/i.test(text) &&
    /qualif|eligib|fit\s*apply|can\s*i\s*apply|dey\s*cover|include/i.test(text) &&
    !/\bpending\b|how\s*far/i.test(text)
  ) {
    return hit('eligibility', 'COE / poly / vocational eligibility', 'exploring', ['eligibility', 'guidance'], entities, false, 0.7)
  }
  if (/screenshot|screen\s*shot|i\s*(send|sent|wan\s*send)\s*(photo|picture|image|pic)|look\s*(this|dis)\s*(picture|photo|image)/i.test(text)) {
    if (/\bpending\b|under\s*review|approved|how\s*far|money\s*never/i.test(text)) {
      return hit('pending-application', 'Screenshot of pending / status', 'waiting', ['pending-status', 'screenshot'], entities, true, 0.68)
    }
    if (/jamb|invalid\s*format/i.test(text)) {
      return hit('jamb-verification', 'Screenshot of JAMB error', 'applying', ['jamb', 'screenshot'], entities, true, 0.68)
    }
    return hit('how-to-apply', 'Screenshot / picture of portal', 'applying', ['how-to-apply', 'screenshot'], entities, true, 0.6)
  }
  if (
    /i\s*wan(t)?\s*(to\s*)?apply|how\s*i\s*(go|take|fit)\s*(apply|start|register)|first\s*time|how\s*i\s*(go|fit)\s*start|start\s*(the\s*)?(application|process)|begin\s*(the\s*)?application|i\s*never\s*apply|i\s*no\s*apply\s*yet|new\s*applicant|how\s*i\s*go\s*do\s*am|how\s*to\s*start\s*(nelfund|the\s*loan)|i\s*wan\s*register|sign\s*up|create\s*(an?\s*)?account|how\s*(to|do\s*i)\s*apply|step\s*by\s*step|guide\s*me|one\s*by\s*one|what\s*(do\s*i\s*do\s*)?next|wetin\s*(i\s*)?go\s*do\s*(next|now)|after\s*(i\s*)?(register|sign\s*up|create)/i.test(
      text,
    ) && !/\bpending\b|how\s*far|still\s*open|deadline|money\s*never|sign\s*in|\blogin\b/i.test(text)
  ) {
    return hit('how-to-apply', 'How to apply / next step', 'preparing', ['how-to-apply', 'account-create'], entities, false, 0.7)
  }
  if (/why\s+(was|is|dem|they|una)|purpose|wetin\s*(be|mean)|what\s*is\s*(this\s*)?nelfund|why\s+dem\s+create/i.test(text)) {
    return hit('what-is-nelfund', 'Why NELFUND was created / purpose', 'exploring', ['what is', 'purpose'], entities, false, 0.72)
  }
  if (/(\blogin\b|log\s*in|sign\s*in|password|session\s*expired)/i.test(text) || entities.includes('login')) {
    return hit('portal-login', 'Sign in / login', 'applying', ['login'], entities, false, 0.7)
  }
  if (/missing\s*information|school\s*not\s*(on\s*)?(the\s*)?(list|showing)|institution\s*not\s*found/i.test(text) || entities.includes('school')) {
    return hit('school-not-found', 'School list / school not found', 'applying', ['school'], entities, true, 0.65)
  }
  if (/\bupkeep\b|monthly\s*allowance/i.test(text)) {
    return hit('upkeep', 'Upkeep allowance', 'exploring', ['upkeep'], entities, false, 0.65)
  }
  if (/school\s*fees|institutional\s*charges|tuition/i.test(text)) {
    return hit('school-fees', 'School fees / institutional charges', 'exploring', ['fees'], entities, false, 0.65)
  }
  if (/\b(scam|fake\s*agent|whatsapp\s*agent)\b/i.test(text)) {
    return hit('scam-safety', 'Scam / fake agent warning', 'exploring', ['scam'], entities, true, 0.7)
  }
  if (/\b(eligib|who\s*can\s*apply|do\s*i\s*qualify)\b/i.test(text)) {
    return hit('eligibility', 'Eligibility question', 'exploring', ['eligibility'], entities, false, 0.6)
  }
  if (entities.includes('apply') || entities.includes('documents')) {
    return hit(entities.includes('documents') ? 'documents-needed' : 'how-to-apply', entities.includes('documents') ? 'Documents needed' : 'How to apply', 'preparing', entities.includes('documents') ? ['documents'] : ['apply'], entities)
  }
  if (entities.includes('contact')) {
    return hit('contact-support', 'Contact NELFUND support', 'exploring', ['contact'], entities)
  }
  if (entities.includes('status') || entities.includes('disbursement')) {
    return hit('pending-application', 'Status / disbursement leftover', 'waiting', ['pending-status'], entities, true, 0.5)
  }
  return hit('official-sources', 'Official NELFUND links', 'exploring', ['guidance'], entities, false, 0.42)
}
