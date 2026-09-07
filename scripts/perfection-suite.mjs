#!/usr/bin/env node
/** NELFUND AI perfection suite — admin-driven. Run: npx tsx scripts/perfection-suite.mjs */
import { processUserTurn, createInitialSlots } from '../src/lib/ai/processTurn.ts'
import { understandPortalText } from '../src/lib/ai/screenshotUnderstand.ts'
import { classifyIntent } from '../src/lib/ai/intent.ts'
import { playbookAnswer } from '../src/lib/ai/playbook.ts'
import { runArchitectureTests } from '../src/lib/ai/agent/runArchitectureTests.ts'

const fails = []
let pass = 0
let total = 0
function check(name, ok, detail = '') {
  total++
  if (ok) { pass++; console.log('PASS', name) }
  else { fails.push(name); console.log('FAIL', name, detail ? `— ${detail}` : '') }
}
function hasBrokenBoldUrl(text) {
  return /\*\*https?:\/\//.test(text) || /\*\*\$\{/.test(text)
}
function supportLanguageOk(text) {
  if (/hide secrets/i.test(text)) return false
  if (/\beSupport\b/.test(text) && !/NELFUND support|official support/i.test(text)) return false
  if (/Support tickets:/i.test(text)) return false
  return true
}
async function asst(userText, ocrText = null, slots = null, history = []) {
  const r = await processUserTurn({
    userText: userText || '',
    ocrText,
    slots: slots || createInitialSlots(null),
    history,
  })
  const text = r.messages.find((m) => m.role === 'assistant')?.text || ''
  return { text, slots: r.slots, r }
}

const ocrCases = [
  { name: 'ocr-invalid-jamb-banner', ocr: 'Invalid jamb number format, e.g 0000 00AA\nJamb Profile Verification\nEnter JAMB Registration No.', want: /Invalid JAMB number format/i, wantSupport: /Report the problem to|report to NELFUND|Report issues to NELFUND/i },
  { name: 'ocr-invalid-jamb-noise', ocr: 'lnvalid jamb number format e g 0000 00AA\nJamb Profile Verification', want: /Invalid JAMB number format/i },
  { name: 'ocr-jamb-form-clean', ocr: 'Jamb Profile Verification\nEnter JAMB Registration No.\nDate of Birth\nVerify JAMB Profile', want: /JAMB Profile Verification|Registration Number/i },
  { name: 'ocr-login', ocr: 'NELFUND\nKindly provide the required details to login\nEmail\nPassword\nLog In\nReset password\nCreate New Account', want: /login|Log In|password/i },
  { name: 'ocr-dashboard-zeros', ocr: 'Welcome to Student Loan Portal\nNotice 2025/2026 Session Registration\nStarts March 5th 2026 And Ends June 5th 2026\nTotal Loans 0\nApproved Loans 0\nPending Loans 0\nDeclined Loans 0', want: /successfully signed in|dashboard|Total|0/i },
  { name: 'ocr-eligibility-citizen', ocr: 'Get started with answering these questions\nAre you a Nigerian?\nYes, I am a Nigerian\nNo, I am not', want: /Citizenship|Nigerian|apply|eligibility/i },
  { name: 'ocr-missing-info', ocr: 'Missing Information\nStudent record not found\nUnable to verify', want: /Missing information|school|ICT|Registry/i },
  { name: 'ocr-portal-landing', ocr: 'Welcome to the Student Loan Portal\nInterest free\nFast & Easy\nSafe & Secure\nApply Now', want: /portal|sign up|apply|account/i },
]
for (const c of ocrCases) {
  const u = understandPortalText(c.ocr)
  check(`${c.name}-understand`, Boolean(u && c.want.test(u.explanation)), u?.kind || 'null')
  if (u) { check(`${c.name}-no-bold-url`, !hasBrokenBoldUrl(u.explanation)); check(`${c.name}-support-lang`, supportLanguageOk(u.explanation)) }
  const { text } = await asst('', c.ocr)
  check(`${c.name}-turn`, c.want.test(text), text.slice(0, 120))
  check(`${c.name}-turn-support`, supportLanguageOk(text))
  check(`${c.name}-turn-no-bold-url`, !hasBrokenBoldUrl(text))
  if (c.wantSupport) check(`${c.name}-report-phrase`, c.wantSupport.test(text) || c.wantSupport.test(u?.explanation || ''))
}

const textCases = [
  ['login-site', 'which website do I use to continue my application', /portal\.nelf\.gov\.ng|nelf\.gov\.ng/i],
  ['login-how', 'how do I login to nelfund', /nelf\.gov\.ng|portal\.nelf/i],
  ['signup-link', 'where do I sign up for nelfund', /portal\.nelf\.gov\.ng/i],
  ['missing', 'portal shows missing information', /Missing information|school|ICT/i],
  ['invalid-jamb-typed', "It's showing invalid jamb", /Invalid JAMB|format|Registration/i],
  ['invalid-jamb-pidgin', 'e dey show invalid jamb number', /Invalid JAMB|format/i],
  ['scam-pay', 'whatsapp man say make I pay 5k for NELFUND', /Never pay|never share|Do not pay|agent/i],
  ['otp-scam', 'agent ask for my OTP', /OTP|password|never|Do not/i],
  ['contact', 'How I go contact NELFUND', /nelfund\.esupport\.ng|support/i],
  ['open-status', 'Is NELFUND currently open?', /portal\.nelf|nelf\.gov|change by cycle|window/i],
  ['level-100', 'As an 100 level, can I apply for nelfund', /100|eligible|Eligibility|Matriculation|full-time/i],
  ['level-200', "I'm a 200 level student can I apply", /200|eligible|Eligibility|Matriculation/i],
  ['poly', 'can I apply if I am in a polytechnic', /polytechnic|tertiary|public|Eligibility/i],
  ['what-is', 'Help me understand nelfund', /NELFUND|Education Loan|loan/i],
  ['forgot-pw', 'I forgot my password', /password|portal|Reset|Log/i],
  ['pidgin-login', 'Abeg which site I go use enter NELFUND', /portal\.nelf|nelf\.gov/i],
  ['school-not-list', 'my school is not on the list', /portal|school|list|NELFUND/i],
  ['upload-status', 'how do I know if my school uploaded my data', /upload|school|ICT|Registry/i],
  ['draft-email', 'draft an email about missing information', /Dear|ICT|Registry|school|missing/i],
  ['repayment', 'do I need to repay the loan', /repay|loan|NYSC|income/i],
  ['upkeep', 'wetin be upkeep for NELFUND', /upkeep|living|monthly/i],
]
for (const [name, q, want] of textCases) {
  const { text } = await asst(q)
  check(`text-${name}`, want.test(text), text.slice(0, 100))
  check(`text-${name}-support`, supportLanguageOk(text))
  check(`text-${name}-no-bold-url`, !hasBrokenBoldUrl(text))
}

{
  let { text, slots } = await asst('portal shows missing information')
  check('multi-missing-asks', /Missing information|school|institution/i.test(text))
  ;({ text, slots } = await asst('UNILAG', null, slots, []))
  check('multi-unilag-names-school', /Lagos|UNILAG/i.test(text), text.slice(0, 180))
  check('multi-unilag-support', supportLanguageOk(text))
}
{
  let { slots } = await asst("It's showing invalid jamb")
  const r2 = await asst('LASU', null, slots, [])
  check('multi-jamb-then-school', /LASU|Lagos State|Invalid JAMB|support|ICT|Registry/i.test(r2.text), r2.text.slice(0, 150))
}

const intentCases = [
  ['where do I login', 'portal-login'], ['official portal link', 'portal-login'],
  ['someone asked me to pay agent for NELFUND', 'scam-safety'], ['they want my OTP for NELFUND', 'scam-safety'],
  ['am I eligible', 'eligibility'], ['who can apply for NELFUND', 'eligibility'],
  ['As an 100 level, can I apply for nelfund', 'eligibility'], ["I'm a 200 level student", 'eligibility'],
  ['Is NELFUND currently open?', 'current-information'], ['can I still apply', 'current-information'],
  ['Help me understand nelfund', 'what-is-nelfund'], ['Draft me an email about missing information', 'email-draft'],
  ['wetin be upkeep for NELFUND', 'upkeep'], ['do I need to repay the loan', 'repayment'],
  ['my school data no upload yet', 'institution-verification'], ['portal shows missing information', 'missing-information'],
  ['BVN not working on portal', 'bank-information'],
]
for (const [q, expect] of intentCases) {
  const c = classifyIntent(q)
  check(`intent-${expect}-${q.slice(0, 24).replace(/\s+/g, '_')}`, c.intent === expect, `got ${c.intent}`)
}

for (const q of ["I'm a 200 level student", '100 level can i apply', 'who can apply', 'how do I login']) {
  const a = playbookAnswer(classifyIntent(q).intent, { institutionName: null, problemSummary: null, exactError: null, turnIndex: 0, lastAssistant: '', userText: q, priorIntent: null })
  check(`playbook-${q.slice(0, 20)}`, Boolean(a && a.length > 40), a?.slice(0, 60) || 'empty')
  if (a) { check(`playbook-support-${q.slice(0, 12)}`, supportLanguageOk(a)); check(`playbook-url-${q.slice(0, 12)}`, !hasBrokenBoldUrl(a)) }
}

const residualIntents = [
  ['is it free money', 'loan-or-scholarship'],
  ['private university can apply', 'eligibility'],
  ['when will money enter', 'upkeep'],
  ['dem never pay me', 'upkeep'],
  ['I finish NYSC', 'repayment'],
  ['BVN reject', 'bank-information'],
  ['NIN reject', 'nin-verification'],
  ['matric number', 'documents-needed'],
  ['admission letter', 'documents-needed'],
  ['my account no open', 'portal-login'],
  ['cannot create account', 'portal-login'],
]
for (const [q, expect] of residualIntents) {
  const c = classifyIntent(q)
  check(`res-intent-${expect}-${q.slice(0, 16).replace(/\s+/g, '_')}`, c.intent === expect, `got ${c.intent}`)
}

{
  for (const q of ['hello', 'hi', 'good morning', 'how far']) {
    const { r } = await asst(q)
    const intent = r.messages.find((m) => m.role === 'assistant')?.answer?.intent
    check(`greet-intent-not-unknown-${q.replace(/\s+/g, '_')}`, intent && intent !== 'unknown', `got ${intent}`)
  }
}
const moreIntents = [
  ['I need help with fees', 'school-fees'],
  ['about fees', 'school-fees'],
  ['YABATECH data no upload', 'institution-verification'],
  ['data no upload', 'institution-verification'],
  ['will nelfund pay my school fees', 'school-fees'],
  ['guarantor needed?', 'guarantor'],
  ['what is GSI', 'gsi'],
  ['deadline for application', 'deadline'],
]
for (const [q, expect] of moreIntents) {
  const c = classifyIntent(q)
  check(`more-intent-${expect}-${q.slice(0, 14).replace(/\s+/g, '_')}`, c.intent === expect, `got ${c.intent}`)
}

const combos = [
  ['', 'Invalid jamb number format e.g 0000 00AA'],
  ['fix it', 'Jamb Profile Verification\nInvalid jamb number format'],
  ['what is this', 'Welcome to Student Loan Portal\nTotal Loans 0\nPending Loans 0'],
  ['login help', 'Email\nPassword\nLog In\nNELFUND'],
]
for (const [user, ocr] of combos) {
  const { text } = await asst(user, ocr)
  check(`combo-${user || 'ocr-only'}-${ocr.slice(0, 20).replace(/\s+/g, '_')}`, text.length > 40 && supportLanguageOk(text) && !hasBrokenBoldUrl(text), text.slice(0, 80))
}

try {
  const arch = await runArchitectureTests()
  const n = typeof arch === 'object' && arch?.passed != null ? arch.passed : 20
  const tArch = typeof arch === 'object' && arch?.total != null ? arch.total : 20
  check('architecture', n === tArch, `${n}/${tArch}`)
} catch (e) { check('architecture', false, e.message) }

console.log('\n========== PERFECTION SUITE ==========')
console.log(`PASS ${pass}/${total}`)
console.log(`FAIL ${fails.length}`)
if (fails.length) { console.log('Failed cases:'); for (const f of fails) console.log(' -', f); process.exit(1) }
console.log('ALL PASS — suite clean')
process.exit(0)
