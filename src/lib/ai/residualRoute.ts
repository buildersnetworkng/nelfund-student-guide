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

/** Soft map leftover / long / Pidgin / multi-issue text onto a real intent. Never returns unknown. */
export function residualSoftRoute(q: string, entities: string[]): IntentResult | null {
  const text = q.trim()
  if (!text) return hit('official-sources', 'Empty message, offer guidance', 'exploring', ['empty', 'guidance'], entities, false, 0.7)

  if (/^(hi|hii+|hello|hey|heyy+|yo|sup|wassup|whatsup|good\s*(morning|afternoon|evening|day)|how\s*you\s*dey|thanks?|thank\s*you|tenki)[.!? ]*$/i.test(text)) {
    return hit('official-sources', 'Greeting, offer menu', 'exploring', ['greeting', 'guidance'], entities, false, 0.65)
  }

  // Admin top unknown buckets: other, pending-status, jamb, empty, open-status
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
  if (/list\s*of\s*schools|which\s*schools|school\s*list|schools\s*(that\s*)?(dey|are)\s*(on|for)\s*nelfund/i.test(text)) {
    return hit('school-not-found', 'School list question', 'applying', ['school-list', 'school'], entities, true, 0.65)
  }

  if (
    /^(unilag|lasu|oou|yabatech|unilorin|uniben|oau|unijos|nou|noun|futo|futa|abu|ui|unizik|unical|uniport|unimaid|fuoye|lautech|delst|uniben)\b/i.test(text) &&
    text.length < 40
  ) {
    return hit('school-not-found', 'School name only', 'applying', ['school-list', 'institution'], entities, true, 0.62)
  }
  if (/my\s*school\s*(na|is|no\s*dey)|school\s*(name\s*)?(na|is)\s+/i.test(text) && text.length < 80) {
    return hit('school-not-found', 'Named school / school on list', 'applying', ['school-list', 'institution'], entities, true, 0.64)
  }
  if (
    /how\s*much(\s*(na|is|dem|they|una))?|wetin\s*(dem|they)\s*dey\s*(pay|give)|upkeep\s*(na|is)\s*\d|\b(30|40|50|70|100),?000\b/i.test(text) &&
    !liveishOpen(text) &&
    !/\bpending\b|how\s*far|never\s*(see|enter)/i.test(text)
  ) {
    return hit('upkeep', 'How much / amount rumour', 'exploring', ['upkeep', 'guidance'], entities, false, 0.68)
  }
  if (/dem\s*don\s*close|una\s*don\s*close|nelfund\s*(don|has|have)\s*close|they\s*(have\s*)?closed|portal\s*(don|has)\s*close|rumour\s*(say|says)\s*.{0,20}close/i.test(text)) {
    return hit('current-information', 'Closed rumour / live open status', 'exploring', ['open-status', 'current'], entities, false, 0.7)
  }
  if (/private\s*(uni|university|school|poly)|part[\s-]*time|\bnoun\b|national\s*open\s*university|post\s*grad|masters?\b|\bphd\b/i.test(text) && !/\bpending\b|how\s*far/i.test(text)) {
    return hit('eligibility', 'Private / part-time / NOUN eligibility', 'exploring', ['eligibility', 'guidance'], entities, false, 0.7)
  }
  if (/no\s*matric|don'?t\s*have\s*(a\s*)?matric|matric\s*(never|no\s*dey|not\s*ready)|fresher|just\s*admit/i.test(text) && !/\bpending\b|how\s*far|money\s*never/i.test(text)) {
    return hit('how-to-apply', 'Fresher / no matric yet', 'preparing', ['how-to-apply', 'documents'], entities, false, 0.7)
  }
  if (/^(check|check\s*am|look\s*am|see\s*am|confirm)[.!? ]*$/i.test(text)) {
    return hit('pending-application', 'Check status follow-up', 'waiting', ['pending-status'], entities, true, 0.6)
  }

  if (
    /how\s*long\s*(does|do|go)\s*(approval|approve|processing)|when\s*(will|go)\s*(they|dem|una)?\s*(approve|pay|disburse)|approval\s*take|not\s*yet\s*approv|dem\s*never\s*approv|e\s*never\s*approv/i.test(
      text,
    ) && !liveishOpen(text)
  ) {
    return hit('pending-application', 'Approval / pay-date wait', 'waiting', ['pending-status', 'approval'], entities, true, 0.7)
  }
  if (
    /when\s*(will|go)\s*(the\s*)?(money|upkeep|loan|alert)\s*(enter|come|drop|reach)|money\s*(go|will)\s*(enter|come)|alert\s*(go|will)\s*(enter|come)|when\s*i\s*go\s*see\s*(my\s*)?(money|upkeep)/i.test(
      text,
    ) && !liveishOpen(text)
  ) {
    return hit('pending-application', 'When money will enter', 'waiting', ['pending-status', 'disbursement'], entities, true, 0.7)
  }
  if (/forgot\s*(my\s*)?password|reset\s*(my\s*)?password|password\s*(no|never)\s*(gree|work)|change\s*(my\s*)?password/i.test(text)) {
    return hit('portal-login', 'Password reset', 'applying', ['login', 'password-reset'], entities, true, 0.72)
  }
  if (
    /school\s*(no|never|don'?t|did\s*not)\s*(upload|submit)|did\s*(my\s*)?school\s*upload|has\s*(my\s*)?(school|uni|university)\s*upload|how\s*(do\s*i|i\s*go)\s*know\s*.{0,24}upload|institution\s*(has\s*not|never)\s*(submit|upload)/i.test(
      text,
    )
  ) {
    return hit('missing-information', 'School upload / missing record', 'applying', ['upload', 'missing'], entities, true, 0.7)
  }
  if (/total\s*loans|pending\s*loans|signed\s*in\s*as|welcome\s*to\s*student|dashboard/i.test(text) && text.length > 40) {
    return hit('pending-application', 'Dashboard paste', 'waiting', ['dashboard', 'pending-status'], entities, true, 0.62)
  }
  if (/\botp\b|agent\s*(ask|wan|want)|pay\s*\d+k|pay\s*(5|10)\s*k/i.test(text)) {
    return hit('scam-safety', 'OTP / agent / pay-to-apply', 'exploring', ['scam'], entities, true, 0.74)
  }

  if (
    /wetin\s*dey\s*happen|application\s*no\s*(move|change)|status\s*no\s*(move|change)|e\s*no\s*dey\s*move|nothing\s*dey\s*happen|my\s*own\s*no\s*dey\s*move/i.test(
      text,
    ) && !liveishOpen(text)
  ) {
    return hit('pending-application', 'Wetin dey happen / status not moving', 'waiting', ['pending-status', 'guidance'], entities, true, 0.7)
  }
  if (
    /dem\s*(don|have)\s*pay\s*(my\s*)?(school|fees|institution)|school\s*(don|has)\s*(collect|receive)|institution(al)?\s*(charges?)?\s*(don|has)\s*(pay|paid)|fees\s*(don|have)\s*(enter|pay)/i.test(
      text,
    ) && /no\s*(see|collect|receive)|never\s*(see|enter|collect)|upkeep\s*(never|no)/i.test(text)
  ) {
    return hit('pending-application', 'School paid but upkeep not seen', 'waiting', ['pending-status', 'upkeep'], entities, true, 0.72)
  }
  if (
    /add\s*(upkeep|allowance)|apply\s*(for\s*)?upkeep\s*(after|later|again)|forget\s*(to\s*)?(tick|apply)\s*upkeep|i\s*(no|never)\s*(tick|apply)\s*upkeep|can\s*i\s*(still\s*)?(add|apply\s*for)\s*upkeep/i.test(
      text,
    )
  ) {
    return hit('upkeep', 'Add upkeep after submit', 'exploring', ['upkeep', 'guidance'], entities, false, 0.7)
  }
  if (
    /portal\s*(no|never|not)\s*(dey\s*)?(open|load|work|gree)|site\s*(no|never)\s*(dey\s*)?(open|load|work)|cannot\s*open\s*(the\s*)?(portal|site|page)|page\s*(no|not)\s*(dey\s*)?(open|load)|website\s*(is\s*)?(down|not\s*working)|nelf\.gov.{0,20}(down|not\s*work)|link\s*(no|not)\s*(dey\s*)?(work|open)/i.test(
      text,
    ) && !liveishOpen(text)
  ) {
    return hit('portal-login', 'Portal / site will not open', 'applying', ['login', 'portal'], entities, true, 0.68)
  }
  if (/change\s*of\s*(course|institution|school)|i\s*(don|have)\s*change\s*(school|course)|transfer\s*(to\s*)?(another\s*)?school/i.test(text) && !/\bpending\b|how\s*far/i.test(text)) {
    return hit('profile-update', 'Change of school / course record', 'applying', ['profile-update', 'guidance'], entities, true, 0.68)
  }
  if (/\b(declin|reject|disapprov|not\s*approv|application\s*(was\s*)?(not\s*)?(successful|accepted))\b/i.test(text) && !liveishOpen(text)) {
    return hit('rejected-application', 'Declined / rejected application', 'rejected', ['rejected', 'guidance'], entities, true, 0.72)
  }
  if (/wrong\s*(bank|account)|change\s*(my\s*)?(bank|account)|update\s*(my\s*)?(bank|account)|account\s*number\s*(wrong|no\s*gree)|i\s*no\s*get\s*bvn|bvn\s*(reject|fail|no\s*gree)/i.test(text) && !/\bjamb\b|how\s*far/i.test(text)) {
    return hit('bank-information', 'Bank / BVN / account update', 'preparing', ['bank', 'documents'], entities, true, 0.7)
  }
  if (/portal\s*stuck|i\s*am\s*stuck|stuck\s*on\s*(the\s*)?portal|blank\s*(white\s*)?screen|page\s*keeps?\s*loading|captcha|account\s*suspend|session\s*expir|my\s*account\s*no\s*open|cannot\s*create\s*account/i.test(text) && !liveishOpen(text)) {
    return hit('portal-login', 'Portal stuck / blank / session', 'applying', ['login', 'portal'], entities, true, 0.68)
  }
  if (/school\s*(has\s*not|never|no)\s*(confirm|upload|submit)|data\s*no\s*upload|institution\s*verif|school\s*data\s*no/i.test(text)) {
    return hit('institution-verification', 'School has not confirmed / uploaded', 'applying', ['upload', 'institution'], entities, true, 0.7)
  }
  if (/ticket\s*(no|not|never)\s*(reply|respond)|how\s*long\s*(does|do)\s*support|support\s*(no|never)\s*reply/i.test(text)) {
    return hit('contact-support', 'Ticket / support wait', 'exploring', ['contact', 'guidance'], entities, false, 0.68)
  }
  if (/guarantor/i.test(text)) {
    return hit('guarantor', 'Guarantor question', 'preparing', ['documents', 'guidance'], entities, false, 0.7)
  }
  if (/\bgsi\b/i.test(text) && !/repay|pay\s*back/i.test(text)) {
    return hit('gsi', 'GSI question', 'repaying', ['repayment', 'gsi'], entities, false, 0.7)
  }
  if (/i\s*(am|dey)\s*(a\s*)?(part[\s-]*time|hnd|post\s*grad|postgraduate|msc|phd|distance|industrial\s*training|repeating)|i\s*graduated|i\s*deferred|direct\s*entry|100\s*level|200\s*level/i.test(text) && !/\bpending\b|how\s*far|money\s*never/i.test(text)) {
    return hit('eligibility', 'Level / mode / graduate eligibility', 'exploring', ['eligibility', 'guidance'], entities, false, 0.7)
  }
  if (/i\s*need\s*money\s*for\s*(accommodation|feeding|hostel|transport)|application\s*successful\s*but\s*no\s*money/i.test(text) && !liveishOpen(text)) {
    return hit('upkeep', 'Need living money / successful but no money', 'exploring', ['upkeep', 'guidance'], entities, false, 0.66)
  }

  if (
    /i\s*wan(t)?\s*(to\s*)?apply|how\s*i\s*(go|take|fit)\s*(apply|start|register)|first\s*time|how\s*i\s*(go|fit)\s*start|start\s*(the\s*)?(application|process)|begin\s*(the\s*)?application|i\s*never\s*apply|i\s*no\s*apply\s*yet|new\s*applicant|how\s*i\s*go\s*do\s*am|how\s*to\s*start\s*(nelfund|the\s*loan)|i\s*wan\s*register/i.test(
      text,
    ) && !/\bpending\b|how\s*far|still\s*open|deadline|money\s*never/i.test(text)
  ) {
    return hit('how-to-apply', 'First-time apply / I wan apply', 'preparing', ['how-to-apply', 'account-create'], entities, false, 0.72)
  }
  if (
    /what\s*(do\s*i\s*do\s*)?next|wetin\s*(i\s*)?go\s*do\s*(next|now)|after\s*(i\s*)?(register|sign\s*up|create|account)|then\s*what|next\s*step|continue\s*(the\s*)?(application|process)|i\s*don\s*(create|register)|after\s*sign\s*up/i.test(
      text,
    ) && !/\bpending\b|money\s*never|how\s*far/i.test(text)
  ) {
    return hit('how-to-apply', 'Apply follow-up / next step', 'preparing', ['how-to-apply'], entities, false, 0.7)
  }
  if (/\bnin\b|national\s*identity|\bbvn\b|bank\s*verification/i.test(text) && !/\bjamb\b|pending|how\s*far/i.test(text)) {
    return hit('documents-needed', 'NIN / BVN profile item', 'preparing', ['documents', 'account-create'], entities, true, 0.68)
  }
  if (/admission\s*letter|matric(\s*no)?|what\s*documents?|which\s*documents?|requirements?\s*(to\s*)?apply/i.test(text) && !/school\s*not/i.test(text)) {
    return hit('documents-needed', 'Documents for application', 'preparing', ['documents'], entities, false, 0.68)
  }
  if (/already\s*paid\s*(my\s*)?(school\s*)?fees|i\s*don\s*pay\s*(school|fees)|i\s*have\s*paid\s*(my\s*)?fees/i.test(text)) {
    return hit('school-fees', 'Already paid school fees', 'exploring', ['fees', 'guidance'], entities, false, 0.68)
  }
  if (/who\s*(do\s*i|i\s*go|should\s*i)\s*contact|open\s*(a\s*)?ticket|esupport|campus\s*desk|school\s*desk/i.test(text)) {
    return hit('contact-support', 'Who to contact / ticket', 'exploring', ['contact', 'guidance'], entities, false, 0.66)
  }

  if (/why\s+(was|is|dem|they|una)|purpose|wetin\s*(be|mean)|what\s*is\s*(this\s*)?nelfund|why\s+dem\s+create/i.test(text)) {
    return hit('what-is-nelfund', 'Why NELFUND was created / purpose', 'exploring', ['what is', 'purpose'], entities, false, 0.72)
  }

  if (/sign\s*up|create\s*(an?\s*)?account|how\s*(to|do\s*i)\s*apply|step\s*by\s*step|guide\s*me|one\s*by\s*one/i.test(text) && !/sign\s*in|\blogin\b/i.test(text)) {
    return hit('how-to-apply', 'How to apply / create account', 'preparing', ['apply'], entities, false, 0.7)
  }
  if (/(\blogin\b|log\s*in|sign\s*in|password|session\s*expired)/i.test(text)) {
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
  if (entities.includes('login')) {
    return hit('portal-login', 'Sign in / login', 'applying', ['login'], entities)
  }
  if (entities.includes('apply') || entities.includes('documents')) {
    return hit(entities.includes('documents') ? 'documents-needed' : 'how-to-apply', entities.includes('documents') ? 'Documents needed' : 'How to apply', 'preparing', entities.includes('documents') ? ['documents'] : ['apply'], entities)
  }
  if (entities.includes('contact')) {
    return hit('contact-support', 'Contact NELFUND support', 'exploring', ['contact'], entities)
  }

  const multiIssue = text.length > 90 && (/,|;|\band\b.+\band\b|also|plus|then|after that/i.test(text) || entities.length >= 3)
  if (multiIssue) {
    if (entities.includes('status') || entities.includes('disbursement')) {
      return hit('pending-application', 'Multi-issue paste, pending first', 'waiting', ['pending', 'multi-issue'], entities, true, 0.5)
    }
    if (entities.includes('apply') || entities.includes('login')) {
      return hit(entities.includes('login') ? 'portal-login' : 'how-to-apply', 'Multi-issue paste, apply/login first', entities.includes('login') ? 'applying' : 'preparing', ['multi-issue'], entities, false, 0.5)
    }
    return hit('official-sources', 'Multi-issue paste, offer menu', 'exploring', ['guidance', 'multi-issue'], entities, false, 0.48)
  }

  const vagueHelp =
    entities.includes('help') ||
    /^(help|abeg|please|pls|assist|guide|i\s*need\s*help|help\s*me|wetin|wahala|this\s*thing|make\s*una\s*help|i\s*no\s*sabi|what\s*next|reply|are\s*you\s*there)[.!? ]*$/i.test(text) ||
    /help\s*me|i\s*need\s*(help|assistance)|una\s*fit\s*help|abeg\s*help|guide\s*me|this\s*nelfund\s*thing/i.test(text)
  if (vagueHelp) {
    return hit('official-sources', 'Vague help, offer official menu', 'exploring', ['guidance'], entities, false, 0.46)
  }
  if (entities.includes('portal') && /dashboard|total\s*loans|signed\s*in/i.test(text)) {
    return hit('pending-application', 'Portal dashboard paste', 'waiting', ['portal'], entities, false, 0.5)
  }

  if (entities.includes('error') || /[a-zA-Z]{3,}/.test(text)) {
    return hit('official-sources', 'General NELFUND guidance menu', 'exploring', ['guidance'], entities, false, 0.45)
  }

  return hit('official-sources', 'Official NELFUND links', 'exploring', ['guidance'], entities, false, 0.42)
}

function liveishOpen(text: string): boolean {
  return /is\s+(nelfund|it|portal|loan|application)\s+(still\s+)?(open|dey\s+open)|deadline|still\s+accept|can\s+i\s+still\s+apply/i.test(
    text,
  )
}
