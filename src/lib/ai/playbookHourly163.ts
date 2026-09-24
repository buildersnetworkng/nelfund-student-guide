const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const LOGIN = 'https://portal.nelf.gov.ng/auth/login'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hourly 163: hostel vs upkeep, hanging portal, batch/mates paid, ND/HND, double apply. No invented amounts. */
export function playbookHourly163(intent: string, userText: string): string | null {
  const t = userText || ''

  if (/hostel|accommodation|accomodation|rent\s*(money|fee)|feeding\s*money/i.test(t)) {
    return (
      '**Hostel / feeding vs upkeep**\n\n' +
      'NELFUND does not pay a separate hostel bill to a landlord. Optional **upkeep** (if you tick it) is living support paid **to your bank account**. Institutional charges still go **to the school**.\n' +
      `Tick upkeep in the same session on ${PORTAL}. I will not invent a hostel figure.`
    )
  }

  if (/portal\s*(hang|hanging|blank|no\s*load|not\s*loading)|page\s*(no|not)\s*(open|load)|site\s*no\s*dey\s*open/i.test(t)) {
    return (
      '**Portal not loading**\n\n' +
      `1. Open ${LOGIN} on another network or browser.\n` +
      '2. Refresh once. Do not create a second account while it hangs.\n' +
      `3. Still blank: ${ESUPPORT} with a screenshot of the exact page.`
    )
  }

  if (/mates?\s*(don|have)\s*(collect|receive)|batch|dem\s*don\s*pay\s*(my\s*)?(school|mates)/i.test(t)) {
    return (
      '**Mates paid / batch**\n\n' +
      'Disbursement is not always the same day for every student. Institutional charges go to the school; upkeep (if ticked) goes to you after approval.\n' +
      `Official FAQ: within **30 days of approval**. Check your own status at ${LOGIN}. I will not invent your batch date.`
    )
  }

  if (/\bnd\b|\bhnd\b|higher\s*national|national\s*diploma/i.test(t) && /eligib|apply|fit|can/i.test(t)) {
    return (
      '**ND / HND**\n\n' +
      'Students in public polytechnics can apply if the institution is on the official list and the school has uploaded the record.\n' +
      `Confirm on ${PORTAL}. I will not invent extra programme types.`
    )
  }

  if (/apply\s*(two|2|twice)|second\s*application|double\s*apply|two\s*accounts/i.test(t)) {
    return (
      '**One official account**\n\n' +
      `Use the same email at ${LOGIN}. Do not open a second account for the same session. Reset password on ${PORTAL} if needed, then ${ESUPPORT} if status is stuck.`
    )
  }

  if (intent === 'upkeep' && /hostel|feeding|rent/i.test(t)) {
    return (
      '**Upkeep is not a hostel invoice**\n\n' +
      `Optional living support is paid to you if ticked. Confirm on ${PORTAL}.`
    )
  }

  return null
}
