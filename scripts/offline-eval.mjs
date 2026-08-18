#!/usr/bin/env node
/** Offline NELFUND agent regression (no API key). Run: npm run eval:offline */
import { processUserTurn, createInitialSlots } from '../src/lib/ai/processTurn.ts'
import { SAMPLE_DASHBOARD_OCR } from '../src/lib/ai/screenshotUnderstand.ts'
import { runArchitectureTests } from '../src/lib/ai/agent/runArchitectureTests.ts'

const cases = [
  ['login', 'which website do I use to continue my application', /portal\.nelf\.gov\.ng/i],
  ['login-pidgin', 'Abeg which site I go use enter NELFUND', /portal\.nelf\.gov\.ng/i],
  ['missing', 'portal shows missing information', /Missing information|school/i],
  ['upload', 'how do I know if my school uploaded my data', /upload|school/i],
  ['forgot', 'I forgot my password', /Forgot password|portal/i],
  ['scam', 'whatsapp man say make I pay 5k for NELFUND', /Do not pay|never share/i],
  ['otp', 'agent ask for my OTP', /Do not|never|OTP|password/i],
  ['contact', 'How I go contact NELFUND', /esupport/i],
  ['poly', 'can I apply if I am in a polytechnic', /polytechnic|tertiary/i],
  ['draft', 'Draft email LASU missing information', /Subject:|Dear/i],
  ['school-list', 'my school is not on the list', /portal|nelf/i],
  ['how-long', 'how long does approval take', /portal|processing|official/i],
  ['email', 'what is the official email of NELFUND', /esupport|ticket|nelf\.gov/i],
  ['disburse', 'when will money enter my account', /portal|nelf\.gov|official/i],
]

let fail = 0
for (const [name, q, want] of cases) {
  const r = await processUserTurn({ userText: q, slots: createInitialSlots(null) })
  const a = r.messages.find((m) => m.role === 'assistant')?.text || ''
  if (!want.test(a)) {
    fail++
    console.log('FAIL', name)
  } else console.log('PASS', name)
}

let r = await processUserTurn({ userText: 'portal shows missing information', slots: createInitialSlots(null) })
r = await processUserTurn({ userText: 'UNILAG', slots: r.slots, history: [] })
if (!/Lagos|UNILAG/i.test(r.messages.find((m) => m.role === 'assistant').text)) {
  fail++
  console.log('FAIL multi-unilag')
} else console.log('PASS multi-unilag')

r = await processUserTurn({ userText: '', ocrText: SAMPLE_DASHBOARD_OCR, slots: createInitialSlots(null) })
if (!/account is set up|closed/i.test(r.messages.find((m) => m.role === 'assistant').text)) {
  fail++
  console.log('FAIL dashboard')
} else console.log('PASS dashboard')

const arch = runArchitectureTests()
console.log('arch', arch.passed + '/' + arch.total)
fail += arch.failed
console.log(fail === 0 ? 'ALL_PASS' : 'TOTAL_FAILS ' + fail)
process.exit(fail === 0 ? 0 : 1)
