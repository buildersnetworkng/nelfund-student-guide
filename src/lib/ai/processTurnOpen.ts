/** Open-window copy used by processTurn. Never invent cycle dates. */
export function openWindowReply(): string {
  return [
    '**Is the application open?**',
    'Open / close dates **change by cycle**. Confirm the banner on the official site \u2014 I will not invent a deadline here.',
    '\u2022 Portal: https://portal.nelf.gov.ng/ \u00b7 Site: https://nelf.gov.ng/',
    '\u2022 Login: https://portal.nelf.gov.ng/auth/login \u2014 if you can start or continue a form, the window is live for that account.',
    '\u2022 If Home says the institution has not opened a session, that is a **school** block, not always a national close.',
  ].join('\n')
}
