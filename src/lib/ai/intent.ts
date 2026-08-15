import type { IntentId, IntentResult } from './types'

/**
 * Rule-based intent classification.
 * This is deterministic and does not rely on model memory for NELFUND facts.
 * Patterns are ordered: first match with highest specificity wins.
 */
const INTENT_PATTERNS: { intent: IntentId; patterns: RegExp[]; topics: string[] }[] = [
  {
    intent: 'loan-or-scholarship',
    patterns: [
      /scholarship/i,
      /free\s*money/i,
      /is\s*(it|nelfund|this)\s*(a\s*)?loan/i,
      /loan\s*or\s*scholarship/i,
      /do\s*i\s*(have\s*to|must)\s*pay\s*back/i,
    ],
    topics: ['loan', 'scholarship', 'repayment'],
  },
  {
    intent: 'already-paid-fees',
    patterns: [/already\s*paid/i, /paid\s*(my\s*)?(school\s*)?fees/i, /refund/i],
    topics: ['already paid', 'fees', 'refund'],
  },
  {
    intent: 'school-not-showing',
    patterns: [
      /school.*(not|isn'?t|is\s*n['o]t).*show/i,
      /school\s*not\s*showing/i,
      /my\s*school\s*is\s*not/i,
      /institution\s*not\s*(on|in|showing)/i,
    ],
    topics: ['school not showing', 'institution lookup'],
  },
  {
    intent: 'no-school-info',
    patterns: [
      /no\s*school\s*information/i,
      /school\s*information\s*not\s*found/i,
      /cannot\s*find\s*(my\s*)?school/i,
    ],
    topics: ['no school information', 'verification'],
  },
  {
    intent: 'application-pending',
    patterns: [/pending/i, /still\s*(waiting|processing)/i, /status\s*(is\s*)?pending/i],
    topics: ['pending', 'status'],
  },
  {
    intent: 'application-rejected',
    patterns: [/reject/i, /declin/i, /not\s*approv/i, /failed\s*(verification|application)/i],
    topics: ['rejected', 'rejection'],
  },
  {
    intent: 'upkeep-amount',
    patterns: [
      /upkeep/i,
      /how\s*much.*(allowance|monthly|upkeep)/i,
      /20,?000|25000|₦20/i,
      /monthly\s*allowance/i,
    ],
    topics: ['upkeep', 'amount', 'allowance'],
  },
  {
    intent: 'fees-payment',
    patterns: [
      /school\s*fees/i,
      /institutional\s*charges/i,
      /will\s*nelfund\s*pay/i,
      /pay\s*(my\s*)?fees/i,
      /fees\s*(to|into)\s*(me|student|account)/i,
    ],
    topics: ['fees', 'institutional charges'],
  },
  {
    intent: 'repayment',
    patterns: [/repay/i, /\bgsi\b/i, /when\s*do\s*i\s*(start\s*)?pay/i, /pay\s*back/i],
    topics: ['repayment', 'gsi'],
  },
  {
    intent: 'guarantor',
    patterns: [/guarantor/i, /surety/i],
    topics: ['guarantor'],
  },
  {
    intent: 'scam-safety',
    patterns: [/scam/i, /fraud/i, /otp/i, /agent.*(pay|money)/i, /safe/i],
    topics: ['scam', 'safety'],
  },
  {
    intent: 'documents-needed',
    patterns: [
      /what\s*(documents?|do\s*i\s*need)/i,
      /documents?\s*need/i,
      /requirements?/i,
      /\bnin\b/i,
      /\bjamb\b/i,
      /\bbvn\b/i,
    ],
    topics: ['documents', 'requirements', 'nin', 'jamb', 'bvn'],
  },
  {
    intent: 'how-to-apply',
    patterns: [
      /how\s*(do\s*i|to)\s*apply/i,
      /application\s*steps?/i,
      /start\s*(my\s*)?application/i,
      /register/i,
    ],
    topics: ['apply', 'application', 'steps'],
  },
  {
    intent: 'readiness',
    patterns: [/am\s*i\s*ready/i, /checklist/i, /prepared/i],
    topics: ['readiness', 'checklist'],
  },
  {
    intent: 'official-sources',
    patterns: [/official\s*(link|site|portal|website)/i, /nelf\.gov/i, /where\s*(do\s*i|to)\s*(apply|go)/i],
    topics: ['official', 'portal', 'sources'],
  },
  {
    intent: 'what-is-nelfund',
    patterns: [
      /what\s*is\s*nelfund/i,
      /explain\s*nelfund/i,
      /about\s*nelfund/i,
      /tell\s*me\s*about\s*nelfund/i,
      /^nelfund\??$/i,
    ],
    topics: ['what is', 'nelfund', 'overview'],
  },
]

/**
 * Classify a student question into a platform intent.
 * Returns `unknown` when no pattern matches with usable confidence.
 */
export function classifyIntent(question: string): IntentResult {
  const q = question.trim()
  if (!q) {
    return { intent: 'unknown', confidence: 0, topics: [] }
  }

  for (const row of INTENT_PATTERNS) {
    for (const pattern of row.patterns) {
      if (pattern.test(q)) {
        return {
          intent: row.intent,
          confidence: 0.9,
          topics: row.topics,
        }
      }
    }
  }

  const lower = q.toLowerCase()
  if (lower.includes('nelfund') && (lower.includes('what') || lower.includes('mean'))) {
    return { intent: 'what-is-nelfund', confidence: 0.6, topics: ['what is', 'nelfund'] }
  }

  return { intent: 'unknown', confidence: 0.2, topics: tokenize(q) }
}

function tokenize(q: string): string[] {
  return q
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2)
    .slice(0, 8)
}
