/**
 * AI regression + multi-turn conversational checks.
 * Run: npm run eval:ai
 */
import path from 'path'
import { pathToFileURL } from 'url'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

async function load() {
  try {
    const intent = await import(pathToFileURL(path.join(root, 'src/lib/ai/intent.ts')).href)
    const conversation = await import(pathToFileURL(path.join(root, 'src/lib/ai/conversation.ts')).href)
    const capabilities = await import(pathToFileURL(path.join(root, 'src/lib/ai/capabilities.ts')).href)
    const escalation = await import(pathToFileURL(path.join(root, 'src/lib/escalation.ts')).href)
    return { intent, conversation, capabilities, escalation }
  } catch (e) {
    console.error('Import failed. Ensure tsx is installed: npm i -D tsx')
    console.error(e)
    process.exit(1)
  }
}

const CASES = [
  { q: 'My NELFUND is showing missing information', expectIntent: 'missing-information' },
  { q: 'e dey show missing', expectIntent: 'missing-information' },
  { q: 'The portal no dey accept my JAMB number', expectIntent: 'jamb-verification' },
  { q: 'My application is still pending', expectIntent: 'pending-application' },
  { q: 'I got rejected', expectIntent: 'rejected-application' },
  { q: 'My school is not showing', expectIntent: 'school-not-found' },
  { q: 'How do I apply?', expectIntent: 'how-to-apply' },
  { q: 'How much is NELFUND upkeep?', expectIntent: 'upkeep' },
  { q: 'Do I need a guarantor?', expectIntent: 'guarantor' },
  { q: 'Can I apply for school fees and upkeep?', expectIntent: 'school-fees' },
  { q: 'How do I fix my NIN mismatch?', expectIntent: 'nin-verification' },
  { q: 'I paid my school fees already', expectIntent: 'refund' },
  { q: 'What is NELFUND?', expectIntent: 'what-is-nelfund' },
  { q: 'Draft me an email about missing information', expectIntent: 'email-draft' },
  { q: 'Abeg draft email for me', expectIntent: 'email-draft' },
  { q: 'My school is LASU, what is their email for NELFUND?', expectIntent: 'contact-lookup' },
  { q: 'How I fit contact my school?', expectIntent: 'contact-lookup' },
  { q: "What's the current information on NELFUND as of today?", expectIntent: 'current-information' },
  { q: 'Any latest update on NELFUND?', expectIntent: 'current-information' },
  { q: 'Has 2026/2027 application opened?', expectIntent: 'current-information' },
]

const CAP_CASES = [
  { q: 'Draft me an email to my school about missing information', expectCap: 'email-draft' },
  { q: 'Write an email concerning NELFUND missing information', expectCap: 'email-draft' },
  { q: 'My school is LASU. I need to contact them by email about missing information', expectCap: 'contact-lookup' },
  { q: 'Find the official contact for my school', expectCap: 'contact-lookup' },
  { q: "What's the latest NELFUND update today?", expectCap: 'current-information' },
  { q: 'My NELFUND is showing missing information', expectCap: 'troubleshooting' },
  { q: 'How do I apply for NELFUND?', expectCap: 'verified-knowledge' },
  { q: 'How much is upkeep currently?', expectCap: 'verified-knowledge' },
]

const INST_CASES = [
  { text: 'University of Lagos', expectId: 'unilag' },
  { text: 'FUTA', expectId: 'futa' },
  { text: 'yabatech', expectId: 'yabatech' },
  { text: 'NOUN', expectId: 'nou' },
  { text: 'Olabisi Onabanjo University', expectId: 'oou' },
  { text: 'poly ibadan', expectId: 'polyibadan' },
  { text: 'LASU', expectId: 'lasu' },
  { text: 'Lagos State University', expectId: 'lasu' },
]

const { intent, conversation, capabilities, escalation } = await load()

let pass = 0
let fail = 0

function check(name, ok, detail = '') {
  if (ok) {
    pass++
    console.log(`  PASS  ${name}`)
  } else {
    fail++
    console.log(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`)
  }
}

function lastAsst(result) {
  return [...result.messages].reverse().find((m) => m.role === 'assistant')
}

console.log('Intent classification')
for (const c of CASES) {
  const r = intent.classifyIntent(c.q)
  check(`${c.expectIntent} <= "${c.q}"`, r.intent === c.expectIntent, `got ${r.intent}`)
}

console.log('\nCapability routing')
for (const c of CAP_CASES) {
  const r = intent.classifyIntent(c.q)
  const cap = capabilities.resolveCapability(r.intent, c.q)
  check(`${c.expectCap} <= "${c.q}"`, cap === c.expectCap, `got ${cap} (intent ${r.intent})`)
}

console.log('\nInstitution resolve')
for (const c of INST_CASES) {
  const id = escalation.resolveInstitutionFromText(c.text)
  check(`${c.expectId} <= "${c.text}"`, id === c.expectId, `got ${id}`)
}

console.log('\n--- Conversational intelligence ---')

console.log('\nTEST: vague problem asks clarification (no FAQ dump)')
{
  const slots = conversation.createInitialSlots(null)
  const result = conversation.processUserTurn({
    userText: "I'm having a NELFUND issue.",
    slots,
    history: [],
  })
  const asst = lastAsst(result)
  const text = asst?.text || ''
  check('capability conversation or clarify', result.capability === 'conversation' || !result.diagnosed)
  check('asks what part / menu', /what part|missing|jamb|pending|screenshot/i.test(text))
  check('does not dump long FAQ', text.length < 900 && !/only answers from verified NELFUND information stored/i.test(text))
}

console.log('\nTEST: missing info → ask institution once')
{
  const slots = conversation.createInitialSlots(null)
  const result = conversation.processUserTurn({
    userText: 'Bro, NELFUND is showing missing information.',
    slots,
    history: [],
  })
  const asst = lastAsst(result)
  check('not fully diagnosed yet', !result.diagnosed)
  check('asks institution', /institution|school/i.test(asst?.text || ''))
  check('acknowledges issue', /got you|usually means|student record/i.test(asst?.text || ''))
  check('pending institution slot', result.slots.awaitingInstitution || result.slots.pendingClarify === 'which-institution')
}

console.log('\nTEST: multi-turn missing → LASU → uses LASU')
{
  let slots = conversation.createInitialSlots(null)
  let result = conversation.processUserTurn({
    userText: 'Portal shows Missing Information – Student Records',
    slots,
    history: [],
  })
  slots = result.slots
  result = conversation.processUserTurn({
    userText: 'LASU',
    slots,
    history: result.messages.map((m) => ({ role: m.role, text: m.text })),
  })
  check('resolves LASU', result.slots.institutionId === 'lasu', `got ${result.slots.institutionId}`)
  check('diagnoses or acts', result.diagnosed || result.capability === 'troubleshooting')
  const asst = lastAsst(result)
  check('mentions LASU or contacts', /lasu|lagos state|contact|ict|registry|esupport/i.test(asst?.text || ''))
  check('does not re-ask institution', !/which institution do you attend\?/i.test(asst?.text || ''))
}

console.log('\nTEST: JAMB flow asks exact error first')
{
  const slots = conversation.createInitialSlots(null)
  const result = conversation.processUserTurn({
    userText: 'My JAMB number is not working',
    slots,
    history: [],
  })
  const asst = lastAsst(result)
  // Either asks institution OR exact error — not a full dump
  const asks =
    /exact message|what.*portal show|institution|school/i.test(asst?.text || '') ||
    result.slots.pendingClarify === 'exact-error' ||
    result.slots.awaitingInstitution
  check('asks one useful question', asks)
  check('not a wall of 12 reasons', (asst?.text || '').length < 700)
}

console.log('\nTEST: direct factual answer (no clarify)')
{
  const slots = conversation.createInitialSlots(null)
  const result = conversation.processUserTurn({
    userText: 'What is NELFUND?',
    slots,
    history: [],
  })
  check('answers without asking school', !result.slots.awaitingInstitution)
  const asst = lastAsst(result)
  check('mentions loan or fund', /loan|nelfund|education/i.test(asst?.text || ''))
}

console.log('\nTEST: draft email asks school then drafts')
{
  let slots = conversation.createInitialSlots(null)
  let result = conversation.processUserTurn({
    userText: 'Draft me an email about missing information',
    slots,
    history: [],
  })
  check('email-draft capability', result.capability === 'email-draft')
  check('asks institution first', /institution|school/i.test(lastAsst(result)?.text || ''))
  slots = result.slots
  result = conversation.processUserTurn({
    userText: 'University of Lagos',
    slots,
    history: result.messages.map((m) => ({ role: m.role, text: m.text })),
  })
  check('stays email-draft', result.capability === 'email-draft', `got ${result.capability}`)
  check('UNILAG set', result.slots.institutionId === 'unilag')
  const asst = lastAsst(result)
  check('produces subject/body style draft', /subject:|dear |regards|missing information/i.test(asst?.text || ''))
}

console.log('\nTEST: LASU contact in one message (no extra questions)')
{
  const slots = conversation.createInitialSlots(null)
  const result = conversation.processUserTurn({
    userText: 'My school is LASU. Give me their email for the NELFUND missing information issue.',
    slots,
    history: [],
  })
  check('contact-lookup', result.capability === 'contact-lookup', `got ${result.capability}`)
  check('LASU', result.slots.institutionId === 'lasu')
  check('diagnosed', result.diagnosed)
}

console.log('\nTEST: current information path')
{
  const slots = conversation.createInitialSlots(null)
  const result = conversation.processUserTurn({
    userText: "What's the current information on NELFUND as of today?",
    slots,
    history: [],
  })
  check('current-information', result.capability === 'current-information')
  const asst = lastAsst(result)
  check('mentions portal or last checked', /portal|last checked|nelf\.gov/i.test(asst?.text || ''))
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
