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
]

export function needsInstitutionForEscalation(intent: IntentId): boolean {
  return ESCALATION_INTENTS.includes(intent)
}

export function resolveInstitutionFromText(text: string): string | null {
  const lower = text.toLowerCase()
  for (const inst of institutions) {
    if (
      lower.includes(inst.id.toLowerCase()) ||
      lower.includes(inst.short_name.toLowerCase()) ||
      lower.includes(inst.name.toLowerCase())
    ) {
      return inst.id
    }
  }
  const aliases: Record<string, string> = {
    'olabisi onabanjo': 'oou',
    'university of lagos': 'unilag',
    'university of ibadan': 'ui',
    'lagos state university': 'lasu',
    'university of nigeria': 'unn',
    'ahmadu bello': 'abu',
    'university of ilorin': 'unilorin',
  }
  for (const [alias, id] of Object.entries(aliases)) {
    if (lower.includes(alias)) return id
  }
  return null
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
}

const UNDERSTANDING: Partial<Record<IntentId, string>> = {
  'missing-information':
    'The portal cannot match your student record with data from your institution. This is often a record availability or data-sync issue, not proof that you invented a school.',
  'school-not-found':
    'Your institution is not appearing in the portal list or search. This can be a search/spelling issue, a temporary list load problem, or missing institutional data.',
  'jamb-verification':
    'The portal is rejecting or not accepting your JAMB registration number. Common causes are a typing mismatch, admission/record mismatch, or upstream data sync.',
  'nin-verification':
    'NIN verification is failing. This is usually a digit or personal-details mismatch, or a temporary verification service issue.',
  'institution-verification':
    'Institutional verification is the step where NELFUND confirms your student status with your school. Delays are often on the institutional data side.',
  'pending-application':
    'Your application is still processing. Pending is not a rejection, but long delays can involve institutional verification.',
  'rejected-application':
    'The application was not approved. The portal reason (when shown) and data mismatches are the first things to check.',
  refund:
    'You paid school fees before NELFUND processing completed. Outcomes depend on your institution bursary rules and current NELFUND guidance.',
  'bank-information':
    'Bank or BVN details failed verification. Account ownership and digit accuracy are the usual issues.',
  'profile-update':
    'You need to correct profile or account information on the official portal.',
  reapplication:
    'You need to apply again after a previous attempt. Fix underlying data issues before resubmitting.',
}

const DIAGNOSIS: Partial<Record<IntentId, string[]>> = {
  'missing-information': [
    'Student record not yet uploaded or visible to NELFUND',
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
    'Verification/data sync delay between systems',
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
    'Bursary refund/credit policy varies by institution',
    'NELFUND institutional-charges payment may not auto-refund prior payments',
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

  const nelfundContacts: EscalationContactView[] = getNelfundSupportContacts()
    .filter((c) => c.handles.includes(intent) || c.handles.includes('contact-support'))
    .slice(0, 2)
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
    'Full name as on your admission/school records',
    'Institution name',
    'Matriculation number (if assigned)',
    'JAMB registration number (if relevant)',
    'Exact error message shown on the portal',
    'Screenshot of the error (hide passwords, OTP, PIN, and full account numbers)',
    'Application session / cycle if shown on the portal',
  ]

  const screenshotAdvice =
    'If you have a screenshot of the error, it can help support teams. Before sharing, hide passwords, OTP, PIN, and other secrets. Never send login credentials to anyone.'

  let supportMessage: SupportMessageDraft | null = null
  if (institutionId && inst) {
    const err = studentHints?.errorMessage || '[exact error message from the portal]'
    const name = studentHints?.name || '[Your full name]'
    supportMessage = {
      subject: `NELFUND support request – ${intent.replace(/-/g, ' ')} – ${inst.short_name}`,
      body: `Dear Support Team,\n\nI am a student of ${inst.name}.\n\nI am trying to use the NELFUND portal, but I encounter this issue:\n\n"${err}"\n\nMy details are:\nName: ${name}\nInstitution: ${inst.name}\nMatriculation number: [if available]\nJAMB registration number: [if relevant]\nDepartment / programme: [if relevant]\n\nI have attached a screenshot of the error (with sensitive information hidden).\n\nPlease help me confirm whether my student record is available and correctly set up for NELFUND verification/processing, or advise the next step on your side.\n\nThank you.\nRegards,\n${name}`,
    }
  }

  const followUp = institutionId
    ? 'Start with the primary institutional contact for this issue. If they confirm your record is correct and uploaded but the portal still fails, contact NELFUND through the official portal/website with the same evidence.'
    : 'Tell me which school you attend so I can point you to the most relevant institutional office for this problem.'

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
  }
}
