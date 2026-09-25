#!/usr/bin/env node
/** Offline NELFUND agent regression: large matrix. Run: npx tsx scripts/offline-eval.mjs */
import { processUserTurn, createInitialSlots } from '../src/lib/ai/processTurn.ts'
import { runArchitectureTests } from '../src/lib/ai/agent/runArchitectureTests.ts'
import { classifyIntent } from '../src/lib/ai/intent.ts'
import { playbookAnswer } from '../src/lib/ai/playbook.ts'

const cases = [
  ['login', 'which website do I use to continue my application', /portal\.nelf\.gov\.ng/i],
  ['login-pidgin', 'Abeg which site I go use enter NELFUND', /portal\.nelf\.gov\.ng/i],
  ['login-direct', 'how do I login to nelfund', /portal\.nelf\.gov\.ng/i],
  ['missing', 'portal shows missing information', /Missing information|school/i],
  ['upload', 'how do I know if my school uploaded my data', /upload|school/i],
  ['school-list', 'my school is not on the list', /portal|nelf/i],
  ['forgot', 'I forgot my password', /Forgot password|portal|password/i],
  ['scam', 'whatsapp man say make I pay 5k for NELFUND', /Never pay|never share|Do not pay|Safety|agent/i],
  ['otp', 'agent ask for my OTP', /Do not|never|OTP|password|Safety/i],
  ['contact', 'How I go contact NELFUND', /esupport/i],
  ['email', 'what is the official email of NELFUND', /esupport|ticket|nelf\.gov|Support tickets/i],
  ['poly', 'can I apply if I am in a polytechnic', /polytechnic|tertiary|public|Eligibility/i],
  ['level-100', 'As an 100 level, can I apply for nelfund', /100-level|eligible|Eligibility|full-time|public|Matriculation/i],
  ['level-100b', 'as a 100 level student can i apply', /100-level|eligible|Eligibility|full-time|Matriculation/i],
  ['level-200', "Oh, I'm a 200 level student", /200-level|Matriculation|Eligibility|full-time/i],
  ['level-300', 'I am 300 level can I apply', /300-level|Matriculation|Eligibility/i],
  ['fresher', 'can I apply as a fresher', /100-level|newly|Matriculation|Eligibility/i],
  ['who-can', 'who can apply for nelfund', /Eligibility|citizen|public|Matriculation/i],
  ['open-status', 'Is NELFUND currently open?', /change by cycle|portal\.nelf|nelf\.gov/i],
  ['still-apply', 'can I still apply', /change by cycle|portal\.nelf|nelf\.gov/i],
  ['when-open', 'when will nelfund open', /change by cycle|portal\.nelf|nelf\.gov/i],
  ['understand', 'Help me understand nelfund', /NELFUND|Education Loan|interest-free|student loan/i],
  ['what-is', 'what is nelfund', /NELFUND|Education Loan|interest-free|loan/i],
  ['draft', 'Draft email LASU missing information', /Subject:|Dear|LASU|missing/i],
  ['how-long', 'how long does approval take', /portal|processing|official/i],
  ['disburse', 'when will money enter my account', /portal|nelf\.gov|official|school/i],
  ['docs', 'what documents do I need', /Matriculation|NIN|JAMB|BVN/i],
  ['matric', 'I do not have matric number yet', /matric|upload|school|ICT|Registry/i],
  ['pidgin-apply', 'Abeg how I go apply for NELFUND', /portal|apply|nelf/i],
  ['scam2', 'someone say pay 10k to process nelfund', /Never pay|agent|Safety|OTP|portal/i],
  ['crit-overview', 'How does this nelfund thing work', /institutional charges|upkeep|portal\.nelf\.gov\.ng/i],
  ['crit-gothrough', 'Ok give me a go through of the whole nelfund stuff', /institutional charges|upkeep|portal\.nelf\.gov\.ng/i],
  ['crit-chargers', 'What do u mean by institutional chargers', /school fees|paid \*\*to the school\*\*/i],
  ['crit-login', 'How do I log in?', /portal\.nelf\.gov\.ng/i],
  ['hourly171-vocational', 'Can part-time sandwich students apply?', /portal|public|vocational|part-time/i],
  ['hourly171-gsi', 'What is GSI will they debit my account now', /GSI|repay|portal/i],
  ['hourly171-parent', 'Can I apply for my child', /student|NIN|portal/i],
  ['hourly171-otp', 'Abeg send the OTP to the agent', /Never share OTP|OTP|WhatsApp|portal\.nelf/i],
  ['hourly172-already', 'I don already apply two times', /already|Loans|second|portal\.nelf/i],
  ['hourly172-private', 'Can private university students apply', /public|portal|official list/i],
  ['hourly172-session', 'Home say my institution session not open', /session|campus|portal/i],
  ['hourly172-status', 'How I go check my application status', /Login|Pending|Loans|portal/i],
  ['hourly172-docs-pidgin', 'Wetin I go carry go upload', /JAMB|NIN|BVN|portal/i],
  ['hourly172-interest-pidgin', 'Does e get interest', /interest-free|loan/i],
  ['hourly179-loan-vs', 'Is NELFUND a loan or a scholarship?', /loan|scholarship|interest-free/i],
  ['hourly179-school-pidgin', 'My school no dey the list', /shorter|public|portal\.nelf/i],
  ['hourly179-bvn', 'My BVN no match the bank', /BVN|bank|portal/i],
  ['hourly179-open-pidgin', 'Una still dey collect application?', /change by cycle|portal\.nelf|nelf\.gov/i],
]

let fail = 0
const fails = []

for (const [name, q, want] of cases) {
  try {
    const r = await processUserTurn({ userText: q, slots: createInitialSlots(null) })
    const a = r.messages.find((m) => m.role === 'assistant')?.text || ''
    if (!want.test(a)) {
      fail++
      fails.push(name)
      console.log('FAIL', name)
    } else console.log('PASS', name)
  } catch (e) {
    fail++
    fails.push(name + ':error')
    console.log('FAIL', name, e.message)
  }
}

let r = await processUserTurn({ userText: 'portal shows missing information', slots: createInitialSlots(null) })
r = await processUserTurn({ userText: 'UNILAG', slots: r.slots, history: [] })
if (!/Lagos|UNILAG/i.test(r.messages.find((m) => m.role === 'assistant')?.text || '')) {
  fail++
  fails.push('multi-unilag')
  console.log('FAIL multi-unilag')
} else console.log('PASS multi-unilag')

r = await processUserTurn({ userText: 'can I apply for nelfund', slots: createInitialSlots(null) })
r = await processUserTurn({
  userText: "I'm a 200 level student",
  slots: r.slots,
  history: [
    { role: 'user', text: 'can I apply for nelfund', intent: 'eligibility' },
    { role: 'assistant', text: r.messages.find((m) => m.role === 'assistant')?.text || '' },
  ],
})
const a200 = r.messages.find((m) => m.role === 'assistant')?.text || ''
if (!/200-level|Matriculation|Eligibility|full-time/i.test(a200)) {
  fail++
  fails.push('followup-200')
  console.log('FAIL followup-200')
} else console.log('PASS followup-200')

r = await processUserTurn({ userText: 'How to apply', slots: createInitialSlots(null) })
const applyFirst = r.messages.find((m) => m.role === 'assistant')?.text || ''
r = await processUserTurn({
  userText: 'I meant for the loan and upkeep',
  slots: r.slots,
  history: [
    { role: 'user', text: 'How to apply', intent: 'how-to-apply' },
    { role: 'assistant', text: applyFirst },
  ],
})
const applyFollow = r.messages.find((m) => m.role === 'assistant')?.text || ''
if (!/upkeep|institutional charges|Request for Student Loan|portal\.nelf/i.test(applyFollow) || /welcome to NELFUND AI|I only help with NELFUND/i.test(applyFollow)) {
  fail++
  fails.push('crit-apply-upkeep-follow')
  console.log('FAIL crit-apply-upkeep-follow')
} else console.log('PASS crit-apply-upkeep-follow')

const intentCases = [
  ['As an 100 level, can I apply for nelfund', 'eligibility'],
  ["Oh, I'm a 200 level student", 'eligibility'],
  ['Is NELFUND currently open?', 'current-information'],
  ['can I still apply', 'current-information'],
  ['Help me understand nelfund', 'what-is-nelfund'],
  ['whatsapp man say make I pay 5k for NELFUND', 'scam-safety'],
  ['what is the official email of NELFUND', 'contact-support'],
  ['Draft email LASU missing information', 'email-draft'],
]
for (const [q, want] of intentCases) {
  const got = classifyIntent(q).intent
  if (got !== want) {
    fail++
    console.log('INTENT_FAIL', q, got)
  } else console.log('INTENT_PASS', want)
}

for (const [q, needle] of [
  ["I'm a 200 level student", /200-level/],
  ['100 level can i apply', /100-level/],
  ['who can apply', /any level|year of study/i],
]) {
  const ans = playbookAnswer('eligibility', { userText: q, turnIndex: 0 }) || ''
  if (!needle.test(ans) || !/Matriculation number/i.test(ans)) {
    fail++
    console.log('PLAYBOOK_FAIL', q)
  } else console.log('PLAYBOOK_PASS', q.slice(0, 40))
}

const arch = runArchitectureTests()
console.log('arch', arch.passed + '/' + arch.total)
fail += arch.failed || 0
console.log(fail === 0 ? 'ALL_PASS' : 'TOTAL_FAILS ' + fail)
if (fails.length) console.log('failed:', fails.join(', '))
process.exit(fail === 0 ? 0 : 1)
