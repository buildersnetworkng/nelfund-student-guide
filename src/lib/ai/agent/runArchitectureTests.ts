/**
 * Offline architecture tests — no live model required.
 * Run via: npx tsx src/lib/ai/agent/runArchitectureTests.ts
 * (or import runArchitectureTests() from app tooling)
 */

import { ARCH_DATASET } from '../eval/dataset'
import { createContext, runMockAgentTurn } from './orchestrator'
import type { AgentState } from './contracts'

export type TestReport = {
  total: number
  passed: number
  failed: number
  results: Array<{ id: string; pass: boolean; notes: string[] }>
}

function runMultiTurn(turns: string[]): { state: AgentState; lastMessage: string; tools: string[] } {
  let ctx = createContext()
  let lastMessage = ''
  let tools: string[] = []
  for (const turn of turns) {
    const res = runMockAgentTurn({
      message: turn,
      context: ctx,
    })
    ctx = {
      state: res.state,
      history: [
        ...ctx.history,
        { role: 'user', content: turn },
        { role: 'assistant', content: res.message },
      ],
    }
    lastMessage = res.message
    tools = res.toolsUsed
  }
  return { state: ctx.state, lastMessage, tools }
}

export function runArchitectureTests(): TestReport {
  const results: TestReport['results'] = []

  for (const c of ARCH_DATASET) {
    const notes: string[] = []
    const { state, lastMessage, tools } = runMultiTurn(c.turns)

    if (c.expectObjective && state.objective !== c.expectObjective) {
      // last turn may set objective; allow prior turn objective if final is unknown after clarify
      if (!(c.expectClarify && state.phase === 'clarify')) {
        notes.push(`objective: got ${state.objective}, expected ${c.expectObjective}`)
      }
    }
    if (c.expectTools) {
      for (const t of c.expectTools) {
        if (!tools.includes(t) && !state.previousActions.includes(t)) {
          notes.push(`missing tool: ${t}`)
        }
      }
    }
    if (c.expectState?.institutionNameIncludes) {
      const name = (state.institutionName || '').toLowerCase()
      if (!name.includes(c.expectState.institutionNameIncludes.toLowerCase())) {
        notes.push(`institution name missing ${c.expectState.institutionNameIncludes}`)
      }
    }
    if (c.expectState?.hasProblem && !state.problem && !state.exactError) {
      notes.push('expected problem/exactError in state')
    }
    if (c.expectClarify && state.phase !== 'clarify' && state.phase !== 'gather') {
      notes.push(`expected clarify/gather, got ${state.phase}`)
    }
    if (c.mustNotInventEmail) {
      if (/@[a-z0-9.-]+\.[a-z]{2,}/i.test(lastMessage) && !/nelf\.gov|esupport/i.test(lastMessage)) {
        notes.push('possible invented email in message')
      }
    }

    results.push({ id: c.id, pass: notes.length === 0, notes })
  }

  const passed = results.filter((r) => r.pass).length
  return { total: results.length, passed, failed: results.length - passed, results }
}

// Allow direct execution in Node if bundled with tsx
declare const require: undefined | NodeRequire
if (typeof require !== 'undefined' && typeof module !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod = module as any
  if (require.main === mod) {
    const report = runArchitectureTests()
    console.log(JSON.stringify(report, null, 2))
    if (report.failed > 0) process.exitCode = 1
  }
}
