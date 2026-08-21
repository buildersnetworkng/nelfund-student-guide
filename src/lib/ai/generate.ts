/**
 * Response generation helpers — email drafts and contact guidance.
 */

export function draftSupportEmail(opts: {
  institutionName?: string | null
  problemSummary?: string | null
  exactError?: string | null
  studentName?: string | null
  objective?: string | null
}): { subject: string; body: string } {
  const school = opts.institutionName || '[Your Institution]'
  const problem = opts.problemSummary || opts.exactError || 'missing school information / portal error'
  const who = opts.studentName || '[Your Full Name]'
  return {
    subject: `NELFUND registration assistance – ${school}`,
    body: [
      `Dear ICT / Registry / NELFUND Desk,`,
      ``,
      `I am a student of ${school} currently trying to complete my NELFUND application.`,
      ``,
      `The portal is showing: ${problem}`,
      ``,
      `Kindly help me confirm whether my student record has been submitted and correctly matched with NELFUND, or advise the next step.`,
      ``,
      `Name: ${who}`,
      `Institution: ${school}`,
      `Matriculation number: [if available]`,
      `JAMB registration number: [if relevant]`,
      ``,
      `Thank you.`,
      who,
    ].join('\n'),
  }
}

export function describeContactLookup(
  institutionName?: string | null,
): string {
  if (institutionName) {
    return `For **${institutionName}**, start with **ICT / Registry / the campus NELFUND desk**.\n\nIf the school confirms your record is correct but the portal still fails, open a ticket at https://nelfund.esupport.ng/create (no passwords/OTP).\n\nOfficial portal: https://portal.nelf.gov.ng/`
  }
  return `Tell me your **school name** so I can point you to the right desk.\n\nIn general: school ICT / Registry / NELFUND desk first, then https://nelfund.esupport.ng/create if needed.\n\nPortal: https://portal.nelf.gov.ng/`
}
