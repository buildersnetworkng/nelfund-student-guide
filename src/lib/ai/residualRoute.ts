import type { IntentId, IntentResult, StudentStage, ConversationTurn } from './types'

export function detectEntities(q: string): string[] {
  const entities: string[] = []
  const map: [RegExp, string][] = [
    [/\bjamb\b|utme|jamb\s*(reg|no|number|id)|direct\s*entry/i, 'jamb'],
    [/\bnin\b/i, 'nin'],
    [/\bbvn\b/i, 'bvn'],
    [/school|institution|university|poly|college|unilag|lasu|oou|yabatech|unilorin|uniben|unizik|unn|unical|uniport|futa|fuoye|tasued|lautech|noun?|futo|abu|oau|unijos|unimaid|delsu|eksu|ui\b|uniosun|mouau|funaab|aaua|\baau\b|ksu|buk|udus|rivers\s*state|lagos\s*state|university\s*of\s*lagos|obafemi\s*awolowo|campus|faculty|matric/i, 'school'],
    [/fee|tuition|charges/i, 'fees'],
    [/upkeep|20k|20,?000|allowance|stipend|hostel\s*money/i, 'upkeep'],
    [/pending|status|under\s*review|how\s*far|never\s*(pay|come|enter)|nothing\s*dey\s*happen|wetin\s*dey\s*happen|application\s*(id|number)/i, 'status'],
    [/bank|account/i, 'bank'],
    [/portal|nelfund|nelfun[dt]?|nel\s*fund|nelf\.gov|dashboard|total\s*loans/i, 'portal'],
    [/login|sign\s*in|password|otp|session\s*expir/i, 'login'],
    [/repay|gsi|pay\s*back|imprison|jail|prison|scholarship/i, 'repayment'],
    [/eligib|qualify|cgpa|level|fresher|part.?time|\bnd\b|\bhnd\b|100l|200l|300l|400l|undergraduate|postgraduate/i, 'eligibility'],
    [/apply|register|sign\s*up|i\s*wan\s*apply|start\s*(the\s*)?(loan|application)/i, 'apply'],
    [/reject|declined|not\s*approv/i, 'rejected'],
    [/disburse|payment|money\s*(enter|come)|dem\s*never\s*pay|when\s*will\s*(they|i)\s*(pay|get)/i, 'disbursement'],
    [/help|abeg|assist|stuck|confused|wahala|please|pls+|guide\s*me|wetin|una\s*fit|i\s*need|problem|issue/i, 'help'],
    [/ticket|esupport|customer\s*care|helpline|contact|complain|hotline|phone\s*number/i, 'contact'],
    [/error|try\s*again|something\s*went\s*wrong|unable\s*to|timed?\s*out|blank\s*page|keep\s*loading|err_/i, 'error'],
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
    return `${last.slice(0, 80)} ${question}`
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
  ].filter((re) => re.test(q)).length
  return q.length > 140 && hits >= 2
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

/** Soft map leftover / long / Pidgin / multi-issue text onto a real intent. Never returns unknown. */
export function residualSoftRoute(q: string, entities: string[]): IntentResult | null {
  const text = q.trim()
  if (!text) return hit('current-information', 'Empty message — offer guidance', 'exploring', ['empty'], entities)

  const pidginPending = /how\s*far|e\s*no\s*dey|no\s*gree|wahala|wetin\s*(dey|happen)|dem\s*never|money\s*never|still\s*dey\s*(pending|process|review)|abeg\s*(check|help).{0,40}(loan|status|pending|money)/i.test(text)
  const pendingish = /\bpending\b|under\s*review|application\s*status|check\s*status|how\s*far\s*(with)?\s*(my\s*)?(loan|application|nelfund)?/i.test(text) || entities.includes('status') || entities.includes('disbursement')
  if (pendingish || pidginPending) {
    return hit('pending-application', 'Pending / under review / how far with loan', 'waiting', ['pending'], entities, true, 0.58)
  }

  if (entities.includes('jamb') || /invalid\s*jamb|jamb.{0,30}(fail|verif|reject|format|gree|no\s*work)|verify.{0,20}jamb/i.test(text)) {
    return hit('jamb-verification', 'JAMB verification or invalid JAMB', 'applying', ['jamb'], entities, true, 0.6)
  }

  if (/is\s*(nelfund|it|portal|application)\s*(still\s*)?(open|accept)|still\s*(accepting|open|dey\s*open|dey\s*collect)|can\s*i\s*still\s*apply|dem\s*still\s*dey\s*(collect|accept)|closing\s*date|deadline/i.test(text)) {
    return hit('current-information', 'Is NELFUND open / current official status', 'exploring', ['current'], entities, false, 0.6)
  }

  if (entities.includes('repayment') || /\bgsi\b|pay\s*(am|it|the\s*loan)\s*back|loan\s*or\s*scholarship|is\s*(this|nelfund)\s*(a\s*)?(scholarship|grant|free)/i.test(text)) {
    if (/\bgsi\b|global\s*standing/i.test(text)) return hit('gsi', 'GSI explanation', 'repaying', ['gsi'], entities)
    if (/scholarship|grant|free\s*money/i.test(text)) return hit('loan-or-scholarship', 'Loan vs scholarship', 'exploring', ['loan'], entities)
    return hit('repayment', 'Repayment rules', 'repaying', ['repayment'], entities)
  }

  if (entities.includes('upkeep') && !entities.includes('fees')) {
    return hit('upkeep', 'Upkeep allowance', 'exploring', ['upkeep'], entities)
  }
  if (entities.includes('fees')) {
    return hit('school-fees', 'School fees / institutional charges', 'exploring', ['fees'], entities)
  }

  if (entities.includes('school') || /list\s*of\s*schools|which\s*schools|school\s*not\s*(found|showing)|missing\s*(info|information|school)/i.test(text)) {
    if (/missing|not\s*found|record/i.test(text)) {
      return hit('missing-information', 'Missing information on portal', 'applying', ['missing'], entities, true, 0.55)
    }
    return hit('school-not-found', 'School list / school not found', 'applying', ['school'], entities, true, 0.55)
  }

  if (entities.includes('login') || entities.includes('apply')) {
    return hit(entities.includes('login') ? 'portal-login' : 'how-to-apply', entities.includes('login') ? 'Sign in / login' : 'How to apply', entities.includes('login') ? 'applying' : 'preparing', [entities.includes('login') ? 'login' : 'apply'], entities)
  }

  if (entities.includes('contact')) {
    return hit('contact-support', 'Contact NELFUND support', 'unknown', ['contact'], entities)
  }

  if (entities.includes('help') || entities.includes('portal') || entities.includes('error') || /[a-zA-Z]{3,}/.test(text)) {
    return hit('current-information', 'General NELFUND guidance menu', 'exploring', ['guidance'], entities, false, 0.45)
  }

  return hit('official-sources', 'Official NELFUND links', 'exploring', ['official'], entities, false, 0.42)
}
