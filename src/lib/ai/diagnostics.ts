import type { IntentId, EvidenceItem, IntentResult } from './types'

const OFFICIAL_PORTAL = 'https://portal.nelf.gov.ng/'
const OFFICIAL_SITE = 'https://nelf.gov.ng/'

function dedupeActions(actions: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const a of actions) {
    const key = a.trim().toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(a.trim())
  }
  return out.slice(0, 7)
}

export function diagnosticAssemble(intent: IntentId, evidence: EvidenceItem[], intentMeta: IntentResult) {
  const troubleshooting = evidence.find((e) => e.kind === 'troubleshooting')
  const factOrFaq = evidence.find((e) => e.kind === 'fact' || e.kind === 'faq')
  const guide = evidence.find((e) => e.kind === 'guide')
  const primary = troubleshooting || factOrFaq || evidence[0]
  const factBody = factOrFaq?.body ?? primary?.body ?? ''
  const meanBody = troubleshooting?.body ?? factBody
  const steps = troubleshooting?.steps ?? guide?.steps ?? []
  const avoid = troubleshooting?.avoid ?? []
  const stillStuck = troubleshooting?.still_stuck

  let answer = ''
  let whatThisMeans: string | null = null
  const nextActions: string[] = []
  const clarifyingQuestions: string[] = []

  switch (intent) {
    case 'jamb-verification':
      answer = 'If the NELFUND portal is rejecting or not accepting your JAMB registration number, do not keep changing random details yet. First confirm that the number you entered matches the JAMB record linked to your admission exactly (same digits, no extra spaces).'
      whatThisMeans = meanBody || 'JAMB-related failures are often a data match issue between what you typed, your JAMB record, and what your institution has on file.'
      nextActions.push(
        'Re-enter your JAMB registration number carefully and match it to your JAMB slip or admission letter.',
        'Confirm your name, admission, and institution details match your official records.',
        'If the number is correct and the portal still rejects it, the issue may be verification or data sync rather than the number itself.',
      )
      if (steps.length) nextActions.push(...steps.slice(0, 3))
      if (stillStuck) nextActions.push(stillStuck)
      clarifyingQuestions.push('What exact error message does the portal show?', 'Are you a new (UTME) or Direct Entry student?')
      break
    case 'nin-verification':
      answer = 'If your NIN is not verifying on the NELFUND portal, pause and check that the NIN is entered exactly as on your NIN slip or NIMC record.'
      whatThisMeans = meanBody || 'NIN verification failures are usually data mismatches or temporary system issues, not proof that you are ineligible.'
      if (steps.length) nextActions.push(...steps.slice(0, 4))
      else nextActions.push('Confirm your NIN digits against your official NIN document.', 'Ensure the name and date of birth on your NELFUND profile match your NIN record.')
      if (stillStuck) nextActions.push(stillStuck)
      clarifyingQuestions.push('What exact error message appears when NIN verification fails?')
      break
    case 'missing-information':
      answer = 'When the portal shows "missing information" or "no school information found," it usually means NELFUND cannot yet match your student record with data from your institution — not that you invented a school.'
      whatThisMeans = meanBody || 'This is typically an institutional data upload or verification gap.'
      if (steps.length) nextActions.push(...steps.slice(0, 4))
      else nextActions.push(
        'Confirm you selected the correct institution and session.',
        'Double-check matriculation number, JAMB number, and name against official school records.',
        "Ask your institution's NELFUND coordination office whether your record has been uploaded to NELFUND.",
      )
      if (stillStuck) nextActions.push(stillStuck)
      clarifyingQuestions.push('Which institution are you applying from?', 'What exact message do you see on the portal?')
      break
    case 'school-not-found':
      answer = 'If your school is not showing on the portal, first check spelling and try the full official institution name. If it still does not appear, the list may not have loaded correctly, or your school data is not yet available the way the portal expects.'
      whatThisMeans = meanBody || 'Institution lookup problems are common and are not always permanent exclusion.'
      if (steps.length) nextActions.push(...steps.slice(0, 4))
      else nextActions.push(
        'Search using the full official name of your institution, not only the abbreviation.',
        'Refresh the page or try again later in case the list failed to load.',
        'If your school still does not appear, contact the office responsible for NELFUND at your institution.',
      )
      if (stillStuck) nextActions.push(stillStuck)
      clarifyingQuestions.push('Which institution are you trying to select?')
      break
    case 'pending-application':
      answer = 'A pending status means your application has been submitted and is still being processed or verified. Waiting is normal at this stage. Avoid submitting duplicate applications or paying anyone who claims they can speed it up.'
      whatThisMeans = meanBody || 'Pending is a process state, not a rejection. Institutional verification and NELFUND checks can take time.'
      if (steps.length) nextActions.push(...steps.slice(0, 4))
      else nextActions.push(
        'Check your status periodically on the official NELFUND portal only.',
        'Ensure your profile details remain accurate while you wait.',
        "If pending continues for an unusually long time, ask your institution's NELFUND desk whether your verification was submitted.",
      )
      if (stillStuck) nextActions.push(stillStuck)
      clarifyingQuestions.push('When did you submit the application (approximate date)?')
      break
    case 'rejected-application':
      answer = 'If your application was rejected, the next step is to understand the reason shown on the portal (when available) and correct what you can — for example data mismatches — before considering a new attempt in an open cycle.'
      whatThisMeans = meanBody || factBody || 'Rejection is not always final forever. Many cases relate to verification or data issues that can be addressed.'
      if (steps.length) nextActions.push(...steps.slice(0, 4))
      else nextActions.push(
        'Read any rejection or status note on the official portal carefully.',
        'Correct profile or document mismatches where the portal allows edits.',
        'Confirm with your institution that your student record was properly uploaded for verification.',
      )
      if (stillStuck) nextActions.push(stillStuck)
      clarifyingQuestions.push('Does the portal show a specific rejection reason?')
      break
    case 'refund':
      answer = 'If you already paid school fees before your NELFUND application completed, this guide cannot confirm a single national refund rule. Outcomes depend on your institution bursary procedures and any current NELFUND guidance.'
      whatThisMeans = meanBody || 'Do not assume an automatic refund or an automatic loss of institutional-charges support. Confirm with your school and the official portal.'
      if (steps.length) nextActions.push(...steps.slice(0, 4))
      else nextActions.push(
        'Keep all payment receipts and related documents.',
        "Contact your institution's bursary or NELFUND coordination office for local options.",
        `Check the official portal for any current guidance: ${OFFICIAL_PORTAL}`,
      )
      break
    case 'upkeep':
      answer = factBody || 'The currently confirmed upkeep amount on this guide is ₦20,000 per month. Upkeep is the living-allowance component of NELFUND funding, separate from institutional charges paid to the school.'
      whatThisMeans = 'Treat any other figure you see online as unconfirmed unless an official NELFUND source states a change.'
      if (steps.length) nextActions.push(...steps.slice(0, 3))
      nextActions.push('Apply through the official portal and select the components you are eligible for.', `Confirm current figures on the official site: ${OFFICIAL_SITE}`)
      break
    case 'school-fees':
    case 'institutional-charges':
      answer = factBody || 'Institutional charges (school fees and related charges) are paid by NELFUND to the institution, not paid as cash into the student personal account.'
      whatThisMeans = meanBody || null
      nextActions.push('Use only the official portal to apply for institutional charges where available.', `Verify details on: ${OFFICIAL_PORTAL}`)
      break
    case 'repayment':
    case 'gsi':
      answer = factBody || 'NELFUND is a loan. It must be repaid. Repayment generally begins after a grace period following completion of study; GSI is a recovery mechanism that may be linked to bank accounts.'
      whatThisMeans = meanBody || 'Exact timing and mechanics can change; confirm current repayment rules on official NELFUND channels.'
      if (steps.length) nextActions.push(...steps.slice(0, 3))
      nextActions.push(`Confirm repayment rules on the official website: ${OFFICIAL_SITE}`)
      break
    case 'loan-or-scholarship':
      answer = factBody || 'NELFUND is a loan, not a scholarship or free grant. Funding must be repaid under the applicable repayment rules.'
      nextActions.push('Plan for repayment after your studies before you rely on the funds.', `Read official explanations on: ${OFFICIAL_SITE}`)
      break
    case 'how-to-apply':
      answer = guide?.body || factBody || 'Apply only through the official NELFUND portal. Prepare your documents (including NIN, JAMB details, admission and bank information) before you start.'
      nextActions.push(`Start on the official portal: ${OFFICIAL_PORTAL}`, 'Use the Am I ready checklist on this guide before you submit.')
      break
    case 'documents-needed':
      answer = factBody || 'You will typically need identity and admission-related details such as NIN, JAMB registration information, admission/matriculation details, and bank account information. Confirm the exact checklist on the official portal for the current cycle.'
      nextActions.push('Open the readiness checklist on this guide.', `Confirm requirements on the official portal: ${OFFICIAL_PORTAL}`)
      break
    case 'what-is-nelfund':
      answer = factBody || 'NELFUND is the Nigerian Education Loan Fund. It provides student financing for eligible tertiary students, covering institutional charges and/or upkeep. It is a loan, not a scholarship.'
      nextActions.push('Read the How to apply guide on this site when you are ready.', `Official website: ${OFFICIAL_SITE}`)
      break
    case 'academic-session':
    case 'deadline':
      answer = 'This guide does not invent application opening or closing dates. Whether you can still apply depends on the current cycle status on the official NELFUND portal.'
      whatThisMeans = 'Session windows and deadlines change. Only the official portal and NELFUND announcements are authoritative for can I still apply.'
      nextActions.push(`Check live status on the official portal: ${OFFICIAL_PORTAL}`, `Check announcements on: ${OFFICIAL_SITE}`)
      clarifyingQuestions.push('Are you asking about a specific session (for example 2025/2026 or 2026/2027)?')
      break
    case 'scam-safety': {
      const tips = evidence.filter((e) => e.kind === 'scam').map((e) => e.body)
      answer = tips[0] || 'Do not pay anyone who claims they can process or speed up your NELFUND application. Apply only through the official portal and never share your OTP.'
      nextActions.push(...tips.slice(0, 4), `Use only the official portal: ${OFFICIAL_PORTAL}`)
      break
    }
    case 'official-sources':
    case 'contact-support':
      answer = 'Use only official NELFUND channels for applications and status checks. Third-party sites and social media posts are not official instructions.'
      nextActions.push(`NELFUND website: ${OFFICIAL_SITE}`, `NELFUND application portal: ${OFFICIAL_PORTAL}`)
      break
    case 'readiness':
      answer = 'Use the readiness checklist on this guide to prepare documents (NIN, JAMB, admission details, matriculation number, bank account/BVN). Confirm final requirements on the official portal before you apply.'
      nextActions.push('Open the Am I ready checklist on this site.', `Confirm requirements on the official portal: ${OFFICIAL_PORTAL}`)
      break
    case 'bank-information':
      answer = meanBody || 'If bank details fail, check that your account number, bank name, and BVN match the account in your own name as required by the portal.'
      if (steps.length) nextActions.push(...steps.slice(0, 4))
      else nextActions.push('Confirm account number and bank name carefully.', 'Ensure the account is in your name where required.', 'Retry after correcting any mismatch.')
      clarifyingQuestions.push('What exact bank error message do you see?')
      break
    case 'profile-update':
      answer = 'If you need to correct profile or account information, use the official portal profile or edit options where available. Avoid third-party agents who ask for payment to update your data.'
      nextActions.push(`Sign in only at: ${OFFICIAL_PORTAL}`, 'Update the fields the portal allows, then save and re-check verification steps.')
      break
    case 'guarantor':
      answer = factBody || 'Guarantor requirements can depend on the current application rules. Confirm on the official portal whether a guarantor is required for your application type.'
      nextActions.push(`Check current requirements on: ${OFFICIAL_PORTAL}`)
      break
    case 'eligibility':
      answer = factBody || 'Eligibility depends on official NELFUND rules for the current cycle. This guide does not invent eligibility decisions for individual students.'
      nextActions.push(`Review eligibility on the official site: ${OFFICIAL_SITE}`, `Apply only via: ${OFFICIAL_PORTAL}`)
      break
    case 'institution-verification':
      answer = meanBody || 'Institutional verification is the step where NELFUND confirms your student record with your school. Delays here are often on the institution data submission side.'
      if (steps.length) nextActions.push(...steps.slice(0, 4))
      clarifyingQuestions.push('Which institution are you registered with?')
      break
    case 'reapplication':
      answer = factBody || 'If you need to apply again after a previous attempt, follow the official portal rules for the open cycle. Correct any data issues that caused problems before.'
      nextActions.push(`Use only the official portal: ${OFFICIAL_PORTAL}`, 'Fix verification or document issues before a new submission.')
      break
    default:
      answer = factBody || meanBody || primary?.body || ''
      if (steps.length) nextActions.push(...steps.slice(0, 4))
      break
  }

  for (const a of avoid.slice(0, 2)) nextActions.push(`Avoid: ${a}`)
  if (primary) {
    if (primary.verification_status === 'guidance' || primary.verification_status === 'unverified') {
      nextActions.push('Treat this as general guidance and confirm against official NELFUND sources before relying on it.')
    }
    if (primary.verification_status === 'may_change') {
      nextActions.push('This information may change between application cycles. Confirm the current rule on the official portal.')
    }
  }
  if (nextActions.length === 0) {
    if (primary?.path) nextActions.push(`Read the full guide entry: ${primary.path}`)
    nextActions.push(`Verify on the official NELFUND portal: ${OFFICIAL_PORTAL}`)
  }
  if (intentMeta.confidence >= 0.85 && nextActions.length >= 3 && clarifyingQuestions.length > 1) {
    clarifyingQuestions.length = 1
  }
  return { answer: answer.trim(), whatThisMeans, nextActions: dedupeActions(nextActions), clarifyingQuestions: clarifyingQuestions.slice(0, 2) }
}
