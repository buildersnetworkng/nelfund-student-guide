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
    const escalation = await import(pathToFileURL(path.join(root, 'src/lib/escalation.ts')).href)
    return { intent, conversation, escalation }
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
]

const INST_CASES = [
  { text: 'University of Lagos', expectId: 'unilag' },
  { text: 'FUTA', expectId: 'futa' },
  { text: 'yabatech', expectId: 'yabatech' },
  { text: 'NOUN', expectId: 'nou' },
  { text: 'Olabisi Onabanjo University', expectId: 'oou' },
  { text: 'poly ibadan', expectId: 'polyibadan' },
]

const { intent, conversation, escalation } = await load()

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

console.log('\nInstitution resolve')
for (const c of INST_CASES) {
  const id = escalation.resolveInstitutionFromText(c.text)
  check(`${c.expectId} <= "${c.text}"`, id === c.expectId, `got ${id}`)
}

console.log('\nConversation follow-ups (missing info, no school)')
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
