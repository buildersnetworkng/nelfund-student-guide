const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const LOGIN = 'https://portal.nelf.gov.ng/auth/login'
const ESUPPORT = 'https://nelfund.esupport.ng/create'
const FAQ = 'https://nelf.gov.ng/faq'

/** Hourly 183: DE/JAMB, forgot email, photo upload, transfer, NYSC apply, ticket, loan vs grant, interest. */
export function playbookHourly183(intent: string, userText: string): string | null {
  const t = userText || ''

  if (/direct\s*entry|ijmb|jupeb|no\s*utme|i\s*(no|never|don.?t)\s*write\s*jamb|jamb\s*(number|reg).{0,20}(lost|forget|no\s*dey)/i.test(t)) {
    return (
      '**Direct Entry / JAMB number**\n\n' +
      'Use the JAMB registration number that matches your admission letter (including Direct Entry / IJMB / JUPEB routes when JAMB issued a number).\n' +
      'If you lost the number, recover it from JAMB first, then retry the portal. This chat cannot change JAMB CAPS.\n\n' +
      `Portal: ${PORTAL}\nStuck after a correct number: campus desk + ${ESUPPORT}`
    )
  }

  if (/forgot\s*(the\s*)?(email|gmail)|which\s*email\s*(i\s*)?(use|used)|email\s*(i\s*)?(use|used)\s*(don\s*)?(forget|lost)/i.test(t)) {
    return (
      '**Forgot the email used to register**\n\n' +
      `1. Try emails you used for JAMB / school mail at ${LOGIN}.\n` +
      '2. If one of them hits **email already used**, that is the account — use Forgot password on that same email.\n' +
      `3. Do not open a second account. Ticket with a screenshot: ${ESUPPORT}`
    )
  }

  if (/passport\s*(photo|photograph)|upload\s*(my\s*)?(picture|photo|id\s*card)|student\s*id\s*(card)?\s*(upload|needed|compulsory)/i.test(t)) {
    return (
      '**Photo / student ID upload**\n\n' +
      'Admission letter is the usual required upload. Passport photograph and student ID are extra if the form asks.\n' +
      'Clear JPEG or PDF, your name readable. Upload only on the official portal.\n\n' +
      `Start: ${PORTAL}`
    )
  }

  if (/change\s*of\s*institution|i\s*change\s*(school|uni)|transfer\s*(student|to\s*another)|i\s*leave\s*(the\s*)?(old\s*)?school/i.test(t)) {
    return (
      '**Change of institution / transfer**\n\n' +
      'The portal follows the school record that was uploaded for this cycle. If you moved schools, the new campus NELFUND / ICT desk must have your current record.\n' +
      'Do not open a second NELFUND account for the new school.\n\n' +
      `Retry the institution search on ${PORTAL}. Ticket: ${ESUPPORT}`
    )
  }

  if (/i\s*dey\s*(do|serve)\s*nysc|serving\s*(corps|nysc)|after\s*graduation\s*(fit|can)\s*i\s*still\s*apply/i.test(t)) {
    return (
      '**NYSC / after graduation**\n\n' +
      'The student loan is for eligible students in public tertiary institutions with an uploaded school record.\n' +
      'If you have already left school / are serving NYSC, confirm on the official site whether a new application is still offered for your case — I will not invent an extra category.\n' +
      'Repayment is described as starting after the study / NYSC window.\n\n' +
      `Eligibility on ${PORTAL} · FAQ: ${FAQ}`
    )
  }

  if (/how\s*(i\s*go|to|do\s*i)\s*(open|raise|create)\s*(esupport|e-?support|ticket)|ticket\s*(no|not|never)\s*(reply|answer)/i.test(t)) {
    return (
      '**Official support ticket**\n\n' +
      `Open a ticket at ${ESUPPORT} with the exact portal wording and a screenshot.\n` +
      'School-record problems still start at the campus NELFUND desk.\n' +
      `Login: ${LOGIN} · Site: ${SITE}`
    )
  }

  if (/na\s*(loan|scholarship|grant)\s*(or|abi)\s*(loan|scholarship|grant)|dem\s*go\s*collect\s*(am\s*)?back|free\s*money\s*abi\s*loan/i.test(t)) {
    return (
      '**Loan, not a grant**\n\n' +
      'NELFUND is an **interest-free loan**, not a scholarship and not free money.\n' +
      `Repayment follows official study / NYSC rules — confirm on ${SITE}. I will not invent rates.`
    )
  }

  if (/interest\s*(rate|free)|does\s*(e|it)\s*get\s*interest|dem\s*go\s*add\s*interest|zero\s*interest/i.test(t) || intent === 'repayment' && /interest/i.test(t)) {
    return (
      '**Interest**\n\n' +
      'Official descriptions treat the student loan as **interest-free**.\n' +
      `Confirm live wording on ${SITE} and ${PORTAL}. I will not invent a rate.\n` +
      `FAQ: ${FAQ}`
    )
  }

  return null
}
