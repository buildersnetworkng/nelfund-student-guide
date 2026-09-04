const PORTAL = 'https://portal.nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

export type RecoveryResult = {
  message: string
  actions: string[]
}

export function recoveryForUnknownInstitution(userText: string): RecoveryResult {
  return {
    message:
      "I couldn't verify that institution in the curated directory. Share the full official name (or short form like LASU, UNILAG). I can still help you draft a message and point you to NELFUND official support — I will not invent an email address.",
    actions: [
      'Share the full school name',
      `Portal: ${PORTAL}`,
      `Report issues to NELFUND support: ${ESUPPORT}`,
    ],
  }
}

export function recoveryForToolFailure(kind: string): RecoveryResult {
  return {
    message:
      'Something went wrong looking that up. You can still use the official portal and report problems to NELFUND official support. Tell me what you are trying to do and we can continue safely.',
    actions: [`Portal: ${PORTAL}`, `Report issues to NELFUND support: ${ESUPPORT}`],
  }
}

export function recoveryForPortalStuck(): RecoveryResult {
  return {
    message:
      'If the portal keeps failing after your school confirms your record, report the problem to NELFUND official support with a screenshot of the exact error (do not send your password).',
    actions: [
      `Report the problem to NELFUND support: ${ESUPPORT}`,
      `Portal: ${PORTAL}`,
    ],
  }
}
