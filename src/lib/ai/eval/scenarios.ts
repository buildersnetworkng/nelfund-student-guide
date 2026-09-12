/**
 * Acceptance scenarios for NELFUND AI.
 * These are NOT FAQ entries, they exercise reasoning, tools, memory, and tasks.
 * Run against live /api/chat when a valid model provider is configured.
 */

export type EvalTurn = { role: 'user' | 'assistant'; content: string }

export type EvalScenario = {
  id: string
  category:
    | 'factual'
    | 'current'
    | 'institution'
    | 'draft'
    | 'troubleshoot'
    | 'multi-turn'
    | 'pidgin'
    | 'novel'
    | 'safety'
  description: string
  turns: EvalTurn[]
  /** What a capable agent should roughly achieve */
  expect: string[]
  /** Failure signals if present in the final reply */
  failIfIncludes?: string[]
}

export const EVAL_SCENARIOS: EvalScenario[] = [
  {
    id: 'what-is-nelfund',
    category: 'factual',
    description: 'Basic explanation',
    turns: [{ role: 'user', content: 'What is NELFUND?' }],
    expect: ['loan', 'student', 'nelf'],
    failIfIncludes: ['I am not sure I have enough detail yet'],
  },
  {
    id: 'is-open',
    category: 'current',
    description: 'Current openness, must not invent',
    turns: [{ role: 'user', content: 'Is NELFUND currently open?' }],
    expect: ['portal', 'nelf'],
    failIfIncludes: ['I am not sure I have enough detail yet'],
  },
]
