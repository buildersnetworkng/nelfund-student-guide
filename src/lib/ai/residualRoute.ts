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
