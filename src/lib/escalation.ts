import {
  getInstitution,
  getInstitutionContacts,
  getNelfundSupportContacts,
  getProblemRouting,
  institutions,
} from './data'
import type { VerificationStatus } from './types'
import type { IntentId } from './ai/types'

export const ESCALATION_INTENTS: IntentId[] = [
  'missing-information',
  'school-not-found',
  'jamb-verification',
  'nin-verification',
  'institution-verification',
  'pending-application',
  'rejected-application',
  'refund',
  'bank-information',
  'profile-update',
  'reapplication',
  'school-fees',
  'institutional-charges',
]

export function needsInstitutionForEscalation(intent: IntentId): boolean {
  return ESCALATION_INTENTS.includes(intent)
}

export function resolveInstitutionFromText(text: string): string | null {
  const lower = text.toLowerCase().replace(/\s+/g, ' ').trim()
  if (!lower) return null

  const candidates: { id: string; score: number }[] = []
  for (const inst of institutions) {
    let score = 0
    const id = inst.id.toLowerCase()
    const short = inst.short_name.toLowerCase()
    const name = inst.name.toLowerCase()
    if (lower === id || lower === short) score = 100
    else if (lower.includes(name)) score = 90
    else if (new RegExp(`\\b${short.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(lower)) score = 80
    else if (lower.includes(short) && short.length >= 3) score = 50
    if (score > 0) candidates.push({ id: inst.id, score })
  }

  const aliases: Record<string, string> = {
    'olabisi onabanjo': 'oou',
    'oou agoiwoye': 'oou',
    'ago iwoye': 'oou',
    'university of lagos': 'unilag',
    'uni lag': 'unilag',
    unilag: 'unilag',
    'university of ibadan': 'ui',
    'lagos state university': 'lasu',
    lasu: 'lasu',
    'university of nigeria': 'unn',
    nsukka: 'unn',
    unn: 'unn',
    'ahmadu bello': 'abu',
    'abu zaria': 'abu',
    'university of ilorin': 'unilorin',
    unilorin: 'unilorin',
    'university of benin': 'uniben',
    uniben: 'uniben',
    'obafemi awolowo': 'oau',
    'oau ile ife': 'oau',
    oau: 'oau',
    'university of port harcourt': 'uniport',
    uniport: 'uniport',
    'federal university of technology akure': 'futa',
    'federal university of technology, akure': 'futa',
    futa: 'futa',
    'federal university of technology owerri': 'futo',
    'federal university of technology, owerri': 'futo',
    futo: 'futo',
    'university of calabar': 'unical',
    unical: 'unical',
    'university of jos': 'unijos',
    unijos: 'unijos',
    'national open university': 'nou',
    'open university': 'nou',
    noun: 'nou',
    'yaba college of technology': 'yabatech',
    yabatech: 'yabatech',
    'the polytechnic ibadan': 'polyibadan',
    'polytechnic ibadan': 'polyibadan',
    'poly ibadan': 'polyibadan',
  }
  for (const [alias, id] of Object.entries(aliases)) {
    if (lower.includes(alias)) {
      const existing = candidates.find((c) => c.id === id)
      if (existing) existing.score = Math.max(existing.score, 85)
      else candidates.push({ id, score: 85 })
    }
  }

  candidates.sort((a, b) => b.score - a.score)
  return candidates[0]?.id ?? null
}

export interface EscalationContactView {
  id: string
  label: string
  office: string
  why: string
  email: string | null
  phone: string | null
  url: string | null
  verification_status: VerificationStatus
  notes: string | null
  priority: 'primary' | 'secondary' | 'national'
}

export interface SupportMessageDraft {
  subject: string
  body: string
}

export interface EscalationPlan {
  needsInstitution: boolean
  institutionId: string | null
  institutionName: string | null
  understanding: string
  diagnosis: string[]
  institutionContacts: EscalationContactView[]
  nelfundContacts: EscalationContactView[]
  evidenceChecklist: string[]
  supportMessage: SupportMessageDraft | null
  followUp: string | null
  screenshotAdvice: string
  contactOrderExplanation: string | null
}

const UNDERSTANDING: Partial<Record<IntentId, string>> = {
  'missing-information':
    'NELFUND cannot currently match your student record with information from your institution. This usually needs your school (ICT / records) and/or NELFUND support — not a final rejection of eligibility.',
  'school-not-found':
    'Your school is not appearing in the portal list. Confirm the official institution name, then ask your school ICT/registry whether records are available for NELFUND.',
  'jamb-verification':
    'The portal is rejecting your JAMB registration number. First confirm it matches your JAMB profile exactly, then check with your institution if the number is correctly on your student record.',
  'nin-verification':
    'NIN verification is failing. Confirm your NIN is entered correctly, then use official NELFUND support if the error continues.',
  'institution-verification':
    'Your institution or student record has not completed the verification NELFUND needs. Your school ICT/records office is usually the first stop.',
  'pending-application':
    'Your application is still processing. Institutional verification and NELFUND checks can take time. Escalate only if it has stayed pending unusually long with no movement.',
  'rejected-application':
    'The portal shows a rejection or unsuccessful outcome. Use the stated reason (if any), then contact NELFUND support and your institution with evidence.',
  refund:
    'Refund outcomes depend on your institution bursary rules and current NELFUND guidance. Start with bursary and official NELFUND support.',
  'bank-information':
    'Bank or account verification failed. Confirm account ownership and digits, then use NELFUND support if needed.',
  'profile-update':
    'Profile corrections should be done on the official portal. Contact NELFUND support if the portal blocks required updates.',
  reapplication:
    'Fix underlying data or verification issues before reapplying through the official portal.',
}

const DIAGNOSIS: Partial<Record<IntentId, string[]>> = {
  'missing-information': [
    'Student record not yet matched with NELFUND',
    'Name, matriculation, or JAMB details do not match institutional records',
    'Wrong institution or session selected on the portal',
  ],
  'school-not-found': [
    'Institution name search does not match the official name in the list',
    'Institution list failed to load fully',
    'Institution data not yet available for NELFUND selection',
  ],
  'jamb-verification': [
    'JAMB number typed incorrectly',
    'JAMB number does not match the admission record held by your school',
    'Verification or data sync delay between systems',
  ],
  'nin-verification': [
    'NIN digits entered incorrectly',
    'Name or date of birth mismatch with NIMC record',
    'Temporary verification service failure',
  ],
  'institution-verification': [
    'Institution has not completed submission of your record',
    'Mismatch between portal profile and school records',
  ],
  'pending-application': [
    'Normal processing time after submission',
    'Institutional verification still outstanding',
  ],
  'rejected-application': [
    'Data or verification mismatch',
    'Eligibility or document issue flagged by the portal',
  ],
  refund: [
    'Bursary refund policy varies by institution',
    'NELFUND payment may not auto-refund prior payments',
  ],
}

function whyForOffice(office: string): string {
  const map: Record<string, string> = {
    ict: 'This often involves system data, portal records, or technical verification.',
    student_records: 'This appears related to the availability or accuracy of your student record.',
    registry: 'Official registration and institutional records may need to be confirmed.',
    admissions: 'Admission or JAMB-linked identity details may need review.',
    bursary: 'Fee payment, charges, or refund handling sits with finance.',
    nelfund_desk: 'Campus NELFUND coordination handles institutional verification submissions.',
    helpdesk: 'They can route you to the correct unit if you are unsure where to start.',
    student_affairs: 'They can help route student administrative issues.',
  }
  return map[office] || 'They may be able to assist with this institutional process.'
}

export function buildEscalationPlan(
  intent: IntentId,
  institutionId: string | null,
  studentHints?: { errorMessage?: string | null; name?: string | null },
): EscalationPlan | null {
  if (!needsInstitutionForEscalation(intent)) return null

  const inst = getInstitution(institutionId)
  const understanding =
    UNDERSTANDING[intent] ||
    'This looks like a problem that may need self-checks and, if needed, institutional or NELFUND support.'

  const diagnosis = DIAGNOSIS[intent] || [
    'Portal or data mismatch',
    'Institutional verification delay',
    'Temporary system issue',
  ]

  const institutionContacts: EscalationContactView[] = []
  if (institutionId) {
    const routing = getProblemRouting(intent)
    const all = getInstitutionContacts(institutionId)
    let priorityAssigned = false
    for (const office of routing) {
      const match = all.find((c) => c.office === office)
      if (!match) continue
      institutionContacts.push({
        id: match.id,
        label: match.label,
        office: match.office,
        why: whyForOffice(match.office),
        email: match.email,
        phone: match.phone,
        url: match.url,
        verification_status: match.verification_status,
        notes: match.notes,
        priority: priorityAssigned ? 'secondary' : 'primary',
      })
      priorityAssigned = true
      if (institutionContacts.length >= 3) break
    }
  }

  const nelfundRaw = getNelfundSupportContacts().filter(
    (c) => c.handles.includes(intent) || c.handles.includes('contact-support'),
  )
  const nelfundOrder = (id: string) => {
    if (id.includes('esupport') || id.includes('ticket')) return 0
    if (id.includes('email') || id.includes('client')) return 1
    if (id.includes('portal')) return 2
    return 3
  }
  const nelfundContacts = [...nelfundRaw]
    .sort((a, b) => nelfundOrder(a.id) - nelfundOrder(b.id))
    .slice(0, 4)
    .map((c) => ({
      id: c.id,
      label: c.label,
      office: 'nelfund',
      why: c.purpose,
      email: c.email,
      phone: c.phone,
      url: c.url,
      verification_status: c.verification_status,
      notes: c.notes,
      priority: 'national' as const,
    }))

  const evidenceChecklist = [
    'Full name as on your admission / school records',
    'Institution name (official form)',
    'Matriculation number (if assigned)',
    'JAMB registration number (when relevant)',
    'Exact error or status message shown on the portal',
    'Screenshot of the error or status page (hide passwords, OTP, PIN)',
  ]

  const screenshotAdvice =
    'Attach a screenshot when contacting support. Hide passwords, OTP, PIN, and other secrets. Never send login credentials to anyone.'

  let supportMessage: SupportMessageDraft | null = null
  if (institutionId && inst) {
    const err = studentHints?.errorMessage || '[exact error or status message from the portal]'
    const name = studentHints?.name || '[Your full name]'
    supportMessage = {
      subject: `NELFUND Registration – ${intent.replace(/-/g, ' ')} – ${inst.short_name}`,
      body: `Hello,\n\nI am a student of ${inst.name} trying to complete my NELFUND registration.\n\nThe portal is displaying: \"${err}\"\n\nI have attached a screenshot of the error (sensitive information hidden).\n\nKindly help me confirm whether my student record has been submitted and correctly matched with NELFUND, or advise the appropriate next step.\n\nName: ${name}\nInstitution: ${inst.name}\nMatriculation number: [if available]\nJAMB registration number: [if relevant]\n\nThank you.\n\nRegards,\n${name}`,
    }
  }

  let contactOrderExplanation: string | null = null
  if (institutionId && institutionContacts.length > 0) {
    const primary = institutionContacts.find((c) => c.priority === 'primary')
    const parts: string[] = []
    if (primary) {
      parts.push(`Start with your school's ${primary.label} for this issue.`)
    }
    if (nelfundContacts.length) {
      parts.push(
        'If the institution confirms your record is correct but the portal still fails, open a NELFUND support ticket with the same evidence.',
      )
    }
    contactOrderExplanation = parts.join(' ')
  } else if (!institutionId) {
    contactOrderExplanation =
      'Tell me which school you attend so I can point you to the most relevant institutional office, then the appropriate NELFUND channel.'
  }

  const followUp = institutionId
    ? 'Start with the primary institutional contact. If they confirm your record is correct but the portal still fails, open a NELFUND support ticket with the same evidence.'
    : 'Reply with the name of your school (full name or common short form). I will then show the relevant institutional offices and a ready-to-send support message.'

  return {
    needsInstitution: !institutionId,
    institutionId,
    institutionName: inst?.name ?? null,
    understanding,
    diagnosis,
    institutionContacts,
    nelfundContacts,
    evidenceChecklist,
    supportMessage,
    followUp,
    screenshotAdvice,
    contactOrderExplanation,
  }
}
