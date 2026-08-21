/**
 * Support email / message drafts grounded in slots (no invented contacts).
 */

import type { IntentId } from './types'

export function draftSupportEmail(opts: {
  institutionName?: string | null
  problemSummary?: string | null
  exactError?: string | null
  studentName?: string | null
  matric?: string | null
  jamb?: string | null
  intent?: IntentId | null
}): string {
  const school = opts.institutionName || '[Your institution name]'
  const who = opts.studentName || '[Your full name]'
  const matric = opts.matric || '[Matric number if available]'
  const jamb = opts.jamb || '[JAMB reg number]'
  const problem =
    opts.exactError ||
    opts.problemSummary ||
    'Missing information / student record not matching on the NELFUND portal'

  return [
    `**Draft for ${school} ICT / Registry / NELFUND desk**`,
    ``,
    `Subject: NELFUND portal — student record / missing information`,
    ``,
    `Dear Sir/Madam`,
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
    `${who}`,
    ``,
    `---`,
    `Copy this into your email or WhatsApp to the school desk. Do **not** share passwords or OTP with anyone.`,
  ].join('\n')
}

export function describeContactLookup(institutionName?: string | null): string {
  if (institutionName) {
    return `For **${institutionName}**, start with **ICT / Registry / the campus NELFUND desk**.\n\nIf the school confirms your record is correct but the portal still fails, open a ticket at https://nelfund.esupport.ng/create (no passwords/OTP).\n\nOfficial portal: https://portal.nelf.gov.ng/`
  }
  return `Tell me your **school name** so I can point you to the right desk.\n\nIn general: school ICT / Registry / NELFUND desk first, then https://nelfund.esupport.ng/create if needed.\n\nPortal: https://portal.nelf.gov.ng/`
}
