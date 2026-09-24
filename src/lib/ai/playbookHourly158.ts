const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const LOGIN = 'https://portal.nelf.gov.ng/auth/login'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hourly 158: eligibility variants, window, fees-vs-upkeep, guarantor Pidgin. No invented amounts. */
export function playbookHourly158(intent: string, userText: string): string | null {
  const t = userText || ''

  if (
    /guarantor|surety|who\s*(go|will)\s*stand\s*for\s*me|need\s*(a\s*)?guarantor/i.test(t)
  ) {
    return (
      '**Guarantor**\n\n' +
      'Official FAQ: the student loan has **no guarantor requirement**.\n' +
      `Apply on ${PORTAL}. Confirm live wording on ${SITE}.`
    )
  }

  if (
    /difference\s*(between|btw)\s*(upkeep|fees|institutional)|fees?\s*(vs|versus|or)\s*upkeep|upkeep\s*(vs|versus|or)\s*(fees|charg)/i.test(
      t,
    )
  ) {
    return (
      '**Fees vs upkeep**\n\n' +
      '1. **Institutional charges** (school fees) → paid **to the school**.\n' +
      '2. **Upkeep** (optional) → paid **to you** if you tick it in the same session.\n' +
      `Confirm figures only on ${PORTAL}. I will not invent amounts.`
    )
  }

  if (
    /still\s*(dey\s*)?(open|close)|dem\s*don\s*close|window\s*(open|close)|fit\s*still\s*apply|application\s*(still\s*)?(dey|open|close)/i.test(
      t,
    )
  ) {
    return (
      '**Application window**\n\n' +
      'Confirm live open/closed status only on the official pages — windows change.\n' +
      `Open ${PORTAL} or ${SITE}. Login: ${LOGIN}.\n` +
      'I will not invent a private closing date.'
    )
  }

  if (
    intent === 'eligibility' ||
    /who\s*(fit|can|dey)\s*apply|i\s*(fit|can)\s*apply|am\s*i\s*eligible|200\s*l(evel)?|100\s*l|private\s*(uni|school)|part[\s-]*time|sandwich|post\s*grad/i.test(
      t,
    )
  ) {
    if (
      /who\s*(fit|can|dey)\s*apply|i\s*(fit|can)\s*apply|am\s*i\s*eligible|eligib|200\s*l|100\s*l|private|part[\s-]*time|sandwich|post\s*grad/i.test(
        t,
      )
    ) {
      const levelBit = /200\s*l/i.test(t)
        ? '200-level students can apply if they meet official rules — year of study is not a substitute for uploaded school data.\n\n'
        : /100\s*l|fresher|newly\s*admit/i.test(t)
          ? '100-level / newly admitted students can apply once the school has uploaded the record.\n\n'
          : /private/i.test(t)
            ? 'Official coverage is for eligible students in **public** tertiary institutions — confirm private-school questions only on the portal.\n\n'
            : /part[\s-]*time|sandwich|post\s*grad/i.test(t)
              ? 'Mode of study must match what the official portal accepts for your school record. Confirm there — I will not invent extra categories.\n\n'
              : 'Any level / year of study can apply if official eligibility is met.\n\n'
      return (
        '**Eligibility**\n\n' +
        levelBit +
        '• Nigerian citizen\n' +
        '• Full-time student in a **public** tertiary institution\n' +
        '• Valid admission; have Matriculation number (when issued), JAMB, NIN, BVN, bank in your name ready\n\n' +
        `Confirm on ${PORTAL}.`
      )
    }
  }

  if (/how\s*(i\s*)?(go|fit)\s*(log|login|sign)\s*in|abeg\s*(help\s*)?(me\s*)?(log|login)/i.test(t)) {
    return (
      `**How to log in / sign in**\n\n1. Open ${LOGIN}\n2. Enter your NELFUND account email and password.\n3. Read the exact error if login fails.\n4. New account / signup: ${PORTAL}\n5. Portal hangs: refresh once, try another network, then ${ESUPPORT}.`
    )
  }

  return null
}
