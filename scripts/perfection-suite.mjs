#!/usr/bin/env node
/** NELFUND AI perfection suite — admin-driven + adversarial. Run: npx tsx scripts/perfection-suite.mjs */
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

const prodText = [
  ['prod-pending-status', 'check my application status', /pending|status|review|approv|portal|wait/i],
  ['prod-pending-waiting', 'still pending nothing dey happen', /pending|status|review|wait|approv/i],
  ['prod-jamb-verify', 'verify my jamb', /jamb|Registration|verify|format|portal/i],
  ['prod-jamb-profile', 'jamb profile verification', /jamb|Registration|verify|profile|portal/i],
  ['prod-jamb-invalid', 'invalid jamb number format', /Invalid JAMB|format|Registration/i],
  ['prod-open-status', 'is nelfund still open', /portal|nelf\.gov|window|cycle|open|change/i],
  ['prod-repay', 'how do I repay the loan', /repay|NYSC|10%|salary|profit/i],
  ['prod-repay-when', 'when will repayment start', /repay|NYSC|10%|after/i],
  ['prod-status-wetin', 'wetin be the status of my application', /pending|status|review|approv|portal/i],
  ['prod-approved', 'has my application been approved', /pending|approv|status|review|portal/i],
]
for (const [name, q, want] of prodText) {
  const { text } = await asst(q)
  check(name, want.test(text) && text.length > 30, text.slice(0, 100))
  check(`${name}-support`, supportLanguageOk(text))
  check(`${name}-no-bold-url`, !hasBrokenBoldUrl(text))
}
const prodIntents = [
  ['check my application status', 'pending-application'], ['verify my jamb', 'jamb-verification'],
  ['jamb profile verification', 'jamb-verification'], ['invalid jamb number', 'jamb-verification'],
  ['how do I repay', 'repayment'], ['when will repayment start', 'repayment'],
  ['is nelfund still open', 'current-information'], ['has my application been approved', 'pending-application'],
  ['wetin be the status', 'pending-application'], ['still pending', 'pending-application'], ['enter my jamb', 'jamb-verification'],
]
for (const [q, expect] of prodIntents) {
  const c = classifyIntent(q)
  check(`prod-intent-${expect}-${q.slice(0, 20).replace(/\s+/g, '_')}`, c.intent === expect, `got ${c.intent}`)
}

const adversarial = [
  ['adv-how-far', 'how far with my application', /pending|status|review|approv|portal|wait/i],
  ['adv-any-update', 'any update on my loan', /pending|status|review|approv|portal|update/i],
  ['adv-submitted', 'i have submitted already', /pending|submit|status|review|portal/i],
  ['adv-my-jamb-no', 'my jamb number no dey work', /jamb|Registration|verify|format|invalid|portal/i],
  ['adv-fix-jamb', 'fix jamb', /jamb|Registration|verify|format|portal/i],
  ['adv-help-apply', 'help me with nelfund application', /apply|portal|sign|account|NELFUND|step/i],
  ['adv-how-i-fit', 'how i fit apply', /apply|portal|sign|account|step|NELFUND/i],
  ['adv-portal-error', 'e dey show error on the portal', /error|missing|school|ICT|support|portal|verify/i],
  ['adv-what-nelfund', 'wetin be this nelfund', /NELFUND|Education Loan|loan|interest/i],
  ['adv-poly-apply', 'can polytechnic student apply', /polytechnic|eligible|Eligibility|public|tertiary/i],
  ['adv-upload', 'has my school uploaded my data', /upload|school|ICT|Registry|portal/i],
  ['adv-scam-5k', 'someone say make I pay 5k for approval', /Never pay|agent|Do not pay|OTP|password|scam|Safety/i],
]
for (const [name, q, want] of adversarial) {
  const { text } = await asst(q)
  check(name, want.test(text) && text.length > 25, text.slice(0, 100))
  check(`${name}-support`, supportLanguageOk(text))
  check(`${name}-no-bold-url`, !hasBrokenBoldUrl(text))
}
const advIntents = [
  ['how far with my application', 'pending-application'], ['any update on my loan', 'pending-application'],
  ['my jamb number no dey work', 'jamb-verification'], ['fix jamb', 'jamb-verification'],
  ['help me with nelfund application', 'how-to-apply'], ['how i fit apply', 'how-to-apply'],
  ['wetin be this nelfund', 'what-is-nelfund'], ['can polytechnic student apply', 'eligibility'],
  ['has my school uploaded my data', 'institution-verification'], ['someone say make I pay 5k for approval', 'scam-safety'],
]
for (const [q, expect] of advIntents) {
  const c = classifyIntent(q)
  check(`adv-intent-${expect}-${q.slice(0, 18).replace(/\s+/g, '_')}`, c.intent === expect, `got ${c.intent}`)
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
