/**
 * Generative assistance (emails/messages). Task capability — not FAQ retrieval.
 * Placeholders only — never invent student PII or institutional emails.
 */
import type { EscalationPlan } from '../escalation'
import { getInstitution } from '../data'

export type DraftRecipient = 'school' | 'nelfund'

export function draftSupportEmail(opts: {
  institutionId: string | null
  institutionName: string | null
  exactError: string | null
  intentLabel?: string
  studentName?: string | null
  matric?: string | null
  recipient?: DraftRecipient
  requestedAction?: string | null
}): { subject: string; body: string; recipient: DraftRecipient } {
  const recipient: DraftRecipient = opts.recipient || 'school'
  const instName =
    opts.institutionName ||
    (opts.institutionId ? getInstitution(opts.institutionId)?.name : null) ||
    '[Your institution name]'
  const err = opts.exactError || 'Missing Information – Student Records'
  const name = opts.studentName || '[Your full name]'
  const matric = opts.matric || '[Matriculation number if available]'
  const topic = opts.intentLabel || 'missing information / student record issue'
  const action =
    opts.requestedAction ||
    (recipient === 'nelfund'
      ? 'Kindly advise the next official step on my application.'
      : 'Kindly help me confirm whether my student record has been submitted and correctly matched for NELFUND, or advise the appropriate next step.')

  if (recipient === 'nelfund') {
    const subject = `Student support request — ${topic} — ${instName}`
    const body = `Dear NELFUND Support Team,

I am a student of ${instName} and I need assistance with the NELFUND application portal.

Portal message / issue:
"${err}"

My details:
Name: ${name}
Institution: ${instName}
Matriculation number: ${matric}
JAMB registration number: [if relevant]
Application reference: [if available]

${action}

I can attach a screenshot with sensitive information hidden (no passwords, OTP, or PIN).

Thank you for your assistance.

Kind regards,
${name}`
    return { subject, body, recipient }
  }

  const subject = `NELFUND Application — ${topic} — ${instName}`
  const body = `Dear Sir/Madam,

I am writing to request assistance with an issue I am experiencing while accessing the NELFUND student loan portal.

The portal is displaying the following message:
"${err}"

My details are:
Name: ${name}
Institution: ${instName}
Matriculation number: ${matric}
JAMB registration number: [if relevant]

${action}

I can attach a screenshot of the error with sensitive information hidden (no passwords, OTP, or PIN).

Thank you for your assistance.

Kind regards,
${name}`

  return { subject, body, recipient }
}

export function describeContactLookup(
  institutionName: string | null,
  plan: EscalationPlan | null,
): string {
  if (!plan || plan.needsInstitution) {
    return 'I can help you find the right office to contact. Tell me which institution you attend so I can point you to the most relevant official channel.'
  }
  const primary = plan.institutionContacts.find((c) => c.priority === 'primary')
  const parts: string[] = []
  parts.push(
    `For ${institutionName || plan.institutionName || 'your institution'}, start with the campus office that handles student records / ICT / NELFUND coordination for this kind of issue.`,
  )
  if (primary) {
    parts.push(`Primary suggested office: ${primary.label}. ${primary.why}`)
    if (primary.email) {
      parts.push(`Published contact: ${primary.email}`)
    } else if (primary.url) {
      parts.push(
        `No dedicated unit email is stored in this guide. Use the official institution website to confirm the current email: ${primary.url}`,
      )
    }
  }
  parts.push(
    'Do not send passwords, OTP, or PIN to anyone. Prefer official websites and the NELFUND support ticket system when the school confirms your record is correct but the portal still fails.',
  )
  return parts.join(' ')
}
