/**
 * Lightweight AI regression checks for NELFUND Student Guide.
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

console.log('\nConversation: missing info asks for school')
{
  const slots = conversation.createInitialSlots(null)
  const result = conversation.processUserTurn({
    userText: 'My NELFUND thing is showing missing information',
    ocrText: null,
    imagePreview: null,
    uiInstitutionId: null,
    slots,
    history: [],
  })
  const askSchool = result.messages.some(
    (m) => m.role === 'assistant' && /institution|school/i.test(m.text),
  )
  check('asks for institution', askSchool && !result.diagnosed)
}

console.log('\nConversation: email draft does not return FAQ-only')
{
  const slots = conversation.createInitialSlots(null)
  const result = conversation.processUserTurn({
    userText: 'Draft me an email concerning my NELFUND missing information issue',
    ocrText: null,
    imagePreview: null,
    uiInstitutionId: null,
    slots,
    history: [],
  })
  // Should ask for school first OR produce draft capability
  const isDraftPath =
    result.capability === 'email-draft' ||
    result.messages.some((m) => m.role === 'assistant' && /draft|email|institution|school/i.test(m.text))
  check('email-draft capability path', result.capability === 'email-draft' && isDraftPath, `cap=${result.capability}`)
}

console.log('\nConversation: LASU contact in one message')
{
  const slots = conversation.createInitialSlots(null)
  const result = conversation.processUserTurn({
    userText: 'My school is LASU. I need to contact my school through their email concerning the NELFUND missing information issue.',
    ocrText: null,
    imagePreview: null,
    uiInstitutionId: null,
    slots,
    history: [],
  })
  check('contact-lookup capability', result.capability === 'contact-lookup', `got ${result.capability}`)
  check('resolves LASU', result.slots.institutionId === 'lasu', `inst=${result.slots.institutionId}`)
  const asst = result.messages.find((m) => m.role === 'assistant')
  const notFaqDump = asst && !/only answers from verified NELFUND information stored/i.test(asst.text || '')
  check('actionable contact response', Boolean(result.diagnosed && notFaqDump))
}

console.log('\nConversation: current information path')
{
  const slots = conversation.createInitialSlots(null)
  const result = conversation.processUserTurn({
    userText: "What's the current information on NELFUND as of today?",
    ocrText: null,
    imagePreview: null,
    uiInstitutionId: null,
    slots,
    history: [],
  })
  check('current-information capability', result.capability === 'current-information', `got ${result.capability}`)
  const asst = result.messages.find((m) => m.role === 'assistant' && m.answer)
  check('mentions official portal or last checked', Boolean(asst?.answer?.answer && /portal|last checked|nelf\.gov/i.test(asst.answer.answer)))
}

console.log('\nConversation with institution provided')
{
  const slots = conversation.createInitialSlots(null)
  let result = conversation.processUserTurn({
    userText: 'Portal shows Missing Information – Student Records',
    ocrText: null,
    imagePreview: null,
    uiInstitutionId: null,
    slots,
    history: [],
  })
  result = conversation.processUserTurn({
    userText: 'University of Lagos',
    ocrText: null,
    imagePreview: null,
    uiInstitutionId: null,
    slots: result.slots,
    history: result.messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, text: m.text })),
  })
  const hasAnswer = result.diagnosed || result.messages.some((m) => m.answer)
  check('resolves UNILAG and diagnoses', result.slots.institutionId === 'unilag' && hasAnswer, `inst=${result.slots.institutionId} diagnosed=${result.diagnosed}`)
  check('keeps institution slot', result.slots.institutionId === 'unilag')
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
