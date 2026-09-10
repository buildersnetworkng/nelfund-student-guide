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
