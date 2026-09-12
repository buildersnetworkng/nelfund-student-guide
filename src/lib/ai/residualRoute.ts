import type { IntentId, IntentResult, StudentStage, ConversationTurn } from './types'

export function detectEntities(q: string): string[] {
  const entities: string[] = []
  const map: [RegExp, string][] = [
    [/\bjamb\b|utme|jamb\s*(reg|no|number|id)|direct\s*entry|invalid\s*format|verification\s*fail/i, 'jamb'],
    [/\bnin\b/i, 'nin'],
    [/\bbvn\b/i, 'bvn'],
    [/school|institution|university|poly|college|unilag|lasu|oou|yabatech|unilorin|uniben|unizik|unn|unical|uniport|futa|fuoye|tasued|lautech|noun?|futo|abu|oau|unijos|unimaid|delsu|eksu|ui\b|uniosun|mouau|funaab|aaua|\baau\b|ksu|buk|udus|rivers\s*state|lagos\s*state|university\s*of\s+lagos|obafemi\s*awolowo|campus|faculty|matric|kwasu|imsue?|rsust|rivers\s*state\s*uni|delta\s*state|edo\s*state|anambra|enugu\s*state|kaduna|kano|ibadan|ife|zaria|nsukka|akure|abeokuta|ado\s*ekiti|osogbo|uyo|calabar|port\s*harcourt|jos|maiduguri|minna|bauchi|gombe|sokoto|ilorin/i, 'school'],
    [/fee|tuition|charges/i, 'fees'],
    [/upkeep|20k|20,?000|allowance|stipend|hostel\s*money/i, 'upkeep'],
    [/pending|status|under\s*review|how\s*far|never\s*(pay|come|enter|see|collect|receive)|nothing\s*dey\s*happen|wetin\s*dey\s*happen|application\s*(id|number)|still\s*waiting|no\s*update|haven'?t\s*(got|gotten|received)|no\s*see\s*(my\s*)?(upkeep|money|loan)|my\s*own\s*never|dem\s*don\s*pay|others\s*don\s*(collect|receive|see)|check\s*am/i, 'status'],
    [/bank|account/i, 'bank'],
    [/portal|nelf\.gov|dashboard|total\s*loans|student\s*loan\s*portal|signed\s*in\s*as/i, 'portal'],
    [/login|sign\s*in|password|otp|session\s*expir|cannot\s*enter|no\s*fit\s*enter/i, 'login'],
    [/repay|gsi|pay\s*back|imprison|jail|prison|scholarship|when\s*i\s*go\s*pay|after\s*nysc/i, 'repayment'],
    [/eligib|qualify|cgpa|level|fresher|part.?time|\bnd\b|\bhnd\b|100l|200l|300l|400l|undergraduate|postgraduate/i, 'eligibility'],
    [/apply|register|sign\s*up|i\s*wan\s*apply|start\s*(the\s*)?(loan|application)|how\s*i\s*go\s*apply/i, 'apply'],
    [/reject|declined|not\s*approv/i, 'rejected'],
    [/disburse|payment|money\s*(enter|come)|dem\s*never\s*pay|when\s*will\s*(they|i)\s*(pay|get)|never\s*see\s*(august|july|june|september|october)?\s*(upkeep|money)/i, 'disbursement'],
    [/help|abeg|assist|stuck|confused|wahala|please|pls+|guide\s*me|wetin|una\s*fit|i\s*need|problem|issue|this\s*thing|make\s*una|i\s*no\s*sabi|what\s*next/i, 'help'],
    [/ticket|esupport|customer\s*care|helpline|contact|complain|hotline|phone\s*number/i, 'contact'],
    [/error|try\s*again|something\s*went\s*wrong|unable\s*to|timed?\s*out|blank\s*page|keep\s*loading|err_|500|404|network|failed\s*to\s*load|internal\s*server|e\s*no\s*work|no\s*gree\s*work/i, 'error'],
    [/money|disburse|paid|payment|enter\s*account|how\s*much/i, 'money'],
  ]
  for (const [re, name] of map) {
    if (re.test(q) && !entities.includes(name)) entities.push(name)
  }
  return entities
}

export function expandWithContext(question: string, history?: ConversationTurn[]): string {
  if (!history || history.length === 0) return question
  const recentUser = history.filter((t) => t.role === 'user').slice(-2).map((t) => t.text).join(' ')
  const q = question.trim()
  if (!recentUser) return question
  if (q.length < 80) return `${recentUser} ${question}`
  if (q.length < 400 && recentUser.length < 1200) return `${recentUser.slice(-400)} ${question}`
  const last = history.filter((t) => t.role === 'user').slice(-1)[0]?.text || ''
  if (q.length >= 400 && last && last !== question) {
    return `${last.slice(0, 120)} ${question}`
  }
  return question
}

export function isPortalDump(q: string): boolean {
  const hits = [
    /total\s*loans/i,
    /approved\s*loans/i,
    /pending\s*loans/i,
    /declined\s*loans/i,
    /student\s*loan\s*portal/i,
    /institutional\s*charges/i,
    /application\s*status/i,
    /nelf\.gov/i,
    /portal\.nelf/i,
    /session\s*registration/i,
    /welcome\s+to\s+student\s*loan/i,
    /signed\s*in\s*as/i,
    /loan\s*application\s*(id|number)/i,
    /application\s*id\s*[:#]?\s*\d/i,
    /something\s*went\s*wrong/i,
    /try\s*again\s*later/i,
    /internal\s*server\s*error/i,
    /kindly\s*provide/i,
    /verification\s*failed/i,
    /invalid\s*(jamb|nin|bvn)\s*(number\s*)?format/i,
  ].filter((re) => re.test(q)).length
  return q.length > 100 && hits >= 2
}

export function lastUserIntent(history?: ConversationTurn[]): IntentId | null {
  if (!history) return null
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].role === 'user' && history[i].intent) return history[i].intent as IntentId
  }
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].intent) return history[i].intent as IntentId
  }
  return null
}

function hit(intent: IntentId, problem: string, stage: StudentStage, topics: string[], entities: string[], troubleshooting = false, confidence = 0.52): IntentResult {
  return { intent, confidence, topics, problem, stage, entities, isTroubleshooting: troubleshooting }
}

const SCHOOL_ONLY =
  /^(unilag|lasu|oou|yabatech|unilorin|uniben|unizik|unn|unical|uniport|futa|fuoye|tasued|lautech|noun|futo|abu|oau|unijos|unimaid|delsu|eksu|ui|uniosun|mouau|funaab|aaua|aau|ksu|buk|udus|oau ife|university of lagos|lagos state university|olabisi|yaba)[.!? ]*$/i

/** Soft map leftover / long / Pidgin / multi-issue text onto a real intent. Never returns unknown. */
export function residualSoftRoute(q: string, entities: string[]): IntentResult | null {
  const text = q.trim()
  if (!text) return hit('official-sources', 'Empty message, offer guidance', 'exploring', ['empty'], entities, false, 0.7)

  if (/^(hi|hii+|hello|hey|heyy+|yo|sup|wassup|whatsup|good\s*(morning|afternoon|evening|day)|how\s*far|howfar|how\s*you\s*dey|thanks?|thank\s*you|tenki)[.!? ]*$/i.test(text)) {
    return hit('official-sources', 'Greeting, offer menu', 'exploring', ['greeting', 'guidance'], entities, false, 0.65)
  }

  if (
    /why\s+(was|is|dem|they|una|we|fg|government|e)\s+.{0,48}(nelfund|it|this\s+loan|dis\s+loan|scheme|am).{0,24}(created|create|establish|start|begin|form|set\s*up|make|bring|introduce|exist)|why\s+(dem|they|una)\s+(take\s+)?(create|make|start|bring|form|introduce)\s+(nelfund|am|it|this\s+loan)|why\s+nelfund|purpose\s+(of\s+)?(nelfund|the\s+(student\s+)?loan)|mission\s+of\s+nelfund|who\s+(created|established|started|bring)\s+nelfund|wetin\s+(be\s*)?(this\s+)?(nelfund|loan)|wetin\s+(make|cause)\s+(dem|them|government|fg|una)\s+(create|start|bring)|what\s+is\s+(this\s+)?nelfund|what\s+is\s+the\s+(purpose|aim|goal)\s+of\s+nelfund|how\s+come\s+.{0,20}(nelfund|this\s+loan)|reason\s+(for|dem|they|behind)\s+.{0,20}(nelfund|this\s+loan)|tell\s+me\s+why\s+nelfund|nelfund\s+for\s+wetin|na\s+wetin\s+nelfund|wetin\s+nelfund\s+dey\s+(do|mean)|why\s+dem\s+bring\s+nelfund|explain\s+why\s+nelfund|why\s+they\s+form\s+this\s+loan|una\s+create\s+nelfund\s+for\s+wetin|explain\s+this\s+student\s+loan|why\s+they\s+introduce|nigeria\s+education\s+loan\s+fund|student\s+loan\s+fund/i.test(
      text,
    )
  ) {
    return hit('what-is-nelfund', 'Why NELFUND was created / purpose', 'exploring', ['what is', 'purpose'], entities, false, 0.78)
  }

  if (/\b(open\s*status|application\s*open|is\s*it\s*open|still\s*open|dey\s*open|accepting|opening\s*date|closing\s*date|loan\s*window|as\s*of\s*(today|now)|current\s*status)\b/i.test(text) && !/why\s+(was|is|dem|they)|purpose|wetin\s*be|created|what\s*is\s+nelfund/i.test(text)) {
    return hit('current-information', 'Open status / is NELFUND open', 'exploring', ['open-status', 'current'], entities, false, 0.68)
  }

  if (/\b(repay|repayment|pay\s*back|after\s*nysc|when\s*(i|we)\s*go\s*pay|10\s*%|gsi)\b/i.test(text) && !/why\s+(was|is|dem|they)|purpose|wetin\s*be\s+nelfund/i.test(text)) {
    if (/\bgsi\b|global\s*standing/i.test(text)) return hit('gsi', 'GSI explanation', 'repaying', ['gsi'], entities)
    if (/scholarship|grant|free\s*money/i.test(text)) return hit('loan-or-scholarship', 'Loan vs scholarship', 'exploring', ['loan'], entities)
    return hit('repayment', 'Repayment rules', 'repaying', ['repayment'], entities, false, 0.7)
  }

  if (SCHOOL_ONLY.test(text) || (entities.includes('school') && text.split(/\s+/).length <= 6 && !entities.includes('status') && !entities.includes('apply'))) {
    return hit('school-not-found', 'School name without extra keywords', 'applying', ['school'], entities, true, 0.5)
  }

  const portalError =
    entities.includes('error') ||
    /something\s*went\s*wrong|try\s*again|timed?\s*out|blank\s*page|keep\s*loading|err_|500\b|404\b|network\s*error|failed\s*to\s*(load|fetch)|internal\s*server|unable\s*to\s*(open|load|continue)|page\s*not\s*working|e\s*no\s*work|no\s*gree\s*work/i.test(
      text,
    )
  if (portalError) {
    if (entities.includes('login') || /password|otp|session/i.test(text)) {
      return hit('portal-login', 'Portal error during login', 'applying', ['login', 'error'], entities, true, 0.58)
    }
    if (entities.includes('jamb') || /jamb|utme/i.test(text)) {
      return hit('jamb-verification', 'Portal error around JAMB', 'applying', ['jamb', 'error'], entities, true, 0.58)
    }
    return hit('contact-support', 'Portal error dump, how to reach support', 'unknown', ['error'], entities, true, 0.55)
  }

  const pidginPending = /how\s*far|e\s*no\s*dey|no\s*gree|wahala|wetin\s*(dey|happen)|dem\s*never|money\s*never|still\s*dey\s*(pending|process|review)|abeg\s*(check|help).{0,40}(loan|status|pending|money)|e\s*never\s*pay|i\s*don\s*submit|never\s*see|haven'?t\s*(got|gotten|received)|no\s*see\s*(my\s*)?(upkeep|money|loan)|una\s*never\s*pay|my\s*own\s*never|dem\s*don\s*pay\s*(others|people)|others\s*don\s*(collect|receive)|check\s*am|see\s*am\s*(for|on)\s*(the\s*)?portal/i.test(text)
  const pendingish = /\bpending\b|under\s*review|application\s*status|pending\s*status|check\s*status|how\s*far\s*(with)?\s*(my\s*)?(loan|application|nelfund)?/i.test(text) || entities.includes('status') || entities.includes('disbursement')
  if ((pendingish || pidginPending) && !/why\s+(was|is|dem|they|una)|purpose|wetin\s*be\s+(nelfund|this|dis)|what\s+is\s+nelfund/i.test(text)) {
    return hit('pending-application', 'Pending / under review / how far with loan', 'waiting', ['pending'], entities, true, 0.58)
  }

  if (entities.includes('jamb') || /invalid\s*jamb|jamb\s*invalid|jamb.{0,40}(fail|verif|reject|format|gree|no\s*work|error|issue|problem)|verify.{0,20}jamb|could\s*not\s*verify.{0,20}jamb|verification\s*failed|jamb\s*(number|reg|registration)|utme\s*(number|verif)/i.test(text)) {
    return hit('jamb-verification', 'JAMB verification or invalid JAMB', 'applying', ['jamb'], entities, true, 0.62)
  }

  if (/is\s*(nelfund|it|portal|application)\s*(still\s*)?(open|accept)|still\s*(accepting|open|dey\s*open|dey\s*collect)|can\s*i\s*still\s*apply|dem\s*still\s*dey\s*(collect|accept|open)|closing\s*date|deadline|as\s*of\s*today|latest|una\s*still\s*dey\s*(collect|open)/i.test(text)) {
    return hit('current-information', 'Is NELFUND open / current official status', 'exploring', ['current'], entities, false, 0.6)
  }

  if (entities.includes('repayment') || /\bgsi\b|pay\s*(am|it|the\s*loan)\s*back|loan\s*or\s*scholarship|is\s*(this|nelfund)\s*(a\s*)?(scholarship|grant|free)|when\s*(i|we)\s*go\s*pay|after\s*nysc/i.test(text)) {
    if (/\bgsi\b|global\s*standing/i.test(text)) return hit('gsi', 'GSI explanation', 'repaying', ['gsi'], entities)
    if (/scholarship|grant|free\s*money/i.test(text)) return hit('loan-or-scholarship', 'Loan vs scholarship', 'exploring', ['loan'], entities)
    return hit('repayment', 'Repayment rules', 'repaying', ['repayment'], entities)
  }

  if (entities.includes('upkeep') && !entities.includes('fees') && !entities.includes('status') && !entities.includes('disbursement')) {
    return hit('upkeep', 'Upkeep allowance', 'exploring', ['upkeep'], entities)
  }
  if (entities.includes('fees') && !entities.includes('status')) {
    return hit('school-fees', 'School fees / institutional charges', 'exploring', ['fees'], entities)
  }

  if (entities.includes('school') || /list\s*of\s*schools|which\s*schools|school\s*not\s*(found|showing)|missing\s*(info|information|school)|school\s*list\s*no\s*complete/i.test(text)) {
    if (/missing|not\s*found|record/i.test(text)) {
      return hit('missing-information', 'Missing information on portal', 'applying', ['missing'], entities, true, 0.55)
    }
    return hit('school-not-found', 'School list / school not found', 'applying', ['school'], entities, true, 0.55)
  }

  if (/\b(scam|fraud|fake\s*agent|whatsapp\s*agent|pay\s*(to\s*)?(apply|process)|telegram\s*(agent|link))\b/i.test(text)) {
    return hit('scam-safety', 'Scam / fake agent warning', 'exploring', ['scam'], entities, true, 0.7)
  }

  if (/\b(document|admission\s*letter|matriculation|transcript|passport\s*photo|upload\s*file)\b/i.test(text)) {
    return hit('documents-needed', 'Documents for application', 'preparing', ['documents'], entities, false, 0.55)
  }

  if (/\b(repay|repayment|pay\s*back|after\s*nysc|10\s*%|loan\s*or\s*scholarship|is\s*(it|this)\s*(a\s*)?scholarship)\b/i.test(text)) {
    if (/scholarship|grant|free\s*money/i.test(text)) {
      return hit('loan-or-scholarship', 'Loan vs scholarship', 'exploring', ['loan'], entities, false, 0.65)
    }
    return hit('repayment', 'Repayment rules', 'repaying', ['repayment'], entities, false, 0.62)
  }

  if (/\b(eligib|who\s*can\s*apply|do\s*i\s*qualify|am\s*i\s*eligible|fresher|100\s*level|private\s*university)\b/i.test(text)) {
    return hit('eligibility', 'Eligibility question', 'exploring', ['eligibility'], entities, false, 0.6)
  }

  if (entities.includes('login')) {
    return hit('portal-login', 'Sign in / login', 'applying', ['login'], entities)
  }
  if (entities.includes('apply')) {
    return hit('how-to-apply', 'How to apply', 'preparing', ['apply'], entities)
  }

  if (entities.includes('contact')) {
    return hit('contact-support', 'Contact NELFUND support', 'unknown', ['contact'], entities)
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

  return hit('official-sources', 'Official NELFUND links', 'exploring', ['official'], entities, false, 0.42)
}
