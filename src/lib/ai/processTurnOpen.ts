/** Open-window / current-status copy. Never invent cycle dates as confirmed policy. */
import type { LiveApplicationStatus } from '../knowledge/client'

export function openWindowReply(): string {
  return [
    '**Is the application open?**',
    'Open / close dates **change by cycle**. Confirm the banner on the official site \u2014 I will not invent a deadline here.',
    '\u2022 Portal: https://portal.nelf.gov.ng/ \u00b7 Site: https://nelf.gov.ng/',
    '\u2022 Login: https://portal.nelf.gov.ng/auth/login \u2014 if you can start or continue a form, the window is live for that account.',
    '\u2022 If Home says the institution has not opened a session, that is a **school** block, not always a national close.',
  ].join('\n')
}

/** Format knowledge/status payload for the student — honesty over certainty. */
export function formatLiveStatusReply(live: LiveApplicationStatus): string {
  const lines: string[] = ['**Application window / current status**']
  const verifiedOpen = live.verified === true && live.status === 'open'
  const verifiedClosed = live.verified === true && live.status === 'closed'

  if (verifiedOpen) {
    lines.push(`Guide status: **open** for cycle ${live.cycle || 'current'} (verified check).`)
  } else if (verifiedClosed) {
    lines.push(`Guide status: **closed** for cycle ${live.cycle || 'current'} (verified check).`)
  } else {
    lines.push(
      'I do **not** have a verified live open/closed reading from the portal in this guide.',
    )
    lines.push(
      `Cycle label in guide pack: **${live.cycle || 'see portal'}**. Status: **confirm on portal**.`,
    )
  }

  if (live.window_note) {
    lines.push(live.window_note)
  } else if (live.freshness === 'static_fallback' || live.verified === false) {
    lines.push(
      'Any dates stored in the guide are metadata only — **not** a guarantee of what the portal shows today.',
    )
  }

  if (live.freshness) {
    lines.push(`Freshness: **${live.freshness}** · confidence: **${live.confidence || 'low'}**.`)
  }
  lines.push('\u2022 Portal: https://portal.nelf.gov.ng/ \u00b7 Site: https://nelf.gov.ng/')
  lines.push(
    '\u2022 Login: https://portal.nelf.gov.ng/auth/login — if Request Loan works on your account, the window is live for you.',
  )
  lines.push(
    '\u2022 Institution session blocks on Home can still appear while a national window is open.',
  )
  return lines.join('\n')
}

export function formatLatestAnnouncementReply(): string {
  return [
    '**Latest NELFUND announcement**',
    'I **cannot verify** a specific latest official announcement from static guide sources alone.',
    'A portal link alone is **not** proof of a new announcement. Check:',
    '\u2022 Site: https://nelf.gov.ng/',
    '\u2022 Portal: https://portal.nelf.gov.ng/',
    '\u2022 Login: https://portal.nelf.gov.ng/auth/login',
    'I will not invent headlines, open/closed claims, or deadline dates for "latest update" questions.',
  ].join('\n')
}
