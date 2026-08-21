/**
 * Support email / message drafts grounded in slots (no invented contacts).
 * Returns structured draft for UI + string helpers for contact lookup.
 */

export type SupportDraft = {
  subject: string
  body: string
  toHint: string
}

export function draftSupportEmail(opts: {
  institutionId?: string | null
  institutionName?: string | null
  problemSummary?: string | null
  exactError?: string | null
  studentName?: string | null
  matric?: string | null
  jamb?: string | null
  recipient?: 'school' | 'nelfund' | string | null
}): SupportDraft {
  const school = opts.institutionName || '[Your institution name]'
  const who = opts.studentName || '[Your full name]'
  const matric = opts.matric || '[Matric number if available]'
  const jamb = opts.jamb || '[JAMB reg number]'
  const problem =
    opts.exactError ||
    opts.problemSummary ||
    'Missing information / student record not matching on the NELFUND portal'
  const toNelfund = opts.recipient === 'nelfund' || /nelfund/i.test(String(opts.recipient || ''))

  if (toNelfund) {
    return {
      subject: 'NELFUND portal — student record / missing information',
      toHint: 'https://nelfund.esupport.ng/create',
      body: [
        `My name is ${who}.`,
        `Institution: ${school}`,
        `Matric: ${matric}`,
        `JAMB: ${jamb}`,
        ``,
        `When I use https://portal.nelf.gov.ng/ I see:`,
        `“${problem}”`,
        ``,
        `I have asked my school ICT/Registry to confirm upload. Please advise next steps.`,
        ``,
        `Thank you.`,
        who,
      ].join('\n'),
    }
  }

  return {
    subject: 'NELFUND portal — student record / missing information',
    toHint: `${school} ICT / Registry / NELFUND desk`,
    body: [
      `Dear Sir/Madam,`,
      ``,
      `My name is ${who}, a student of ${school}.`,
      `Matric: ${matric}`,
      `JAMB: ${jamb}`,
      ``,
      `When I try to use the NELFUND student portal (https://portal.nelf.gov.ng/), I see:`,
      `“${problem}”`,
      ``,
      `Please confirm whether my admission and student biodata (name as on NIN, NIN, JAMB registration number, and matriculation number where available) have been correctly uploaded for NELFUND verification.`,
      ``,
      `Kindly advise if any correction is needed on my part.`,
      ``,
      `Thank you.`,
      who,
    ].join('\n'),
  }
}

export function describeContactLookup(
  institutionName?: string | null,
  _escalation?: unknown,
): string {
  if (institutionName) {
    return `For **${institutionName}**, start with **ICT / Registry / the campus NELFUND desk**.\n\nIf the school confirms your record is correct but the portal still fails, open a ticket at https://nelfund.esupport.ng/create (no passwords/OTP).\n\nOfficial portal: https://portal.nelf.gov.ng/`
  }
  return `Tell me your **school name** so I can point you to the right desk.\n\nIn general: school ICT / Registry / NELFUND desk first, then https://nelfund.esupport.ng/create if needed.\n\nPortal: https://portal.nelf.gov.ng/`
}
