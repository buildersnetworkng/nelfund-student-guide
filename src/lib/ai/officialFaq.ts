/**
 * Official NELFUND FAQ answers from https://nelf.gov.ng/faq
 * Matched by flexible English / Pidgin phrasing so students get the same fact
 * whether they quote the FAQ title or ask in their own words.
 */

import type { IntentId } from './types'

const FAQ = 'https://nelf.gov.ng/faq'
const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'

export type OfficialFaqHit = {
  id: string
  intent: IntentId
  answer: string
}

type Entry = {
  id: string
  intent: IntentId
  /** Any match wins; keep patterns specific enough to avoid collisions */
  patterns: RegExp[]
  answer: string
}

const ENTRIES: Entry[] = [
  {
    id: 'act-2024',
    intent: 'what-is-nelfund',
    patterns: [
      /students?\s*loans?\s*\(?access\s*to\s*higher\s*education\)?\s*act/i,
      /what\s*(is|be)\s*(the\s*)?(students?\s*)?loan\s*act/i,
      /loan\s*act\s*,?\s*2024/i,
      /wetin\s*(be|mean)\s*(the\s*)?loan\s*act/i,
    ],
    answer: `**Students Loans (Access to Higher Education) Act** (official FAQ)\n\nIt is an Act of Parliament that lets eligible Nigerian students access **zero-interest** loans for **institutional charges** and **upkeep** at higher institutions in Nigeria.\n\nFull FAQ: ${FAQ}`,
  },
  {
    id: 'not-education-bank',
    intent: 'what-is-nelfund',
    patterns: [
      /same\s*as\s*(the\s*)?nigerian\s*education\s*bank/i,
      /education\s*bank\s*(vs|versus|or)\s*(nelfund|student\s*loan)/i,
      /is\s*(nelfund|the\s*loan)\s*(the\s*)?same\s*as\s*(education\s*bank|neb)/i,
    ],
    answer: `**Not the Nigerian Education Bank** (official FAQ)\n\nNo. The Student’s Loan Act **repealed** the Nigerian Education Bank Act and set up a framework for **zero-interest** loans to eligible students in higher education.\n\nFAQ: ${FAQ}`,
  },
  {
    id: 'who-administers',
    intent: 'what-is-nelfund',
    patterns: [
      /who\s*(administers?|runs?|manages?|controls?)\s*(the\s*)?(loans?|nelfund)/i,
      /who\s*(is\s*)?(in\s*charge|head)\s*of\s*(nelfund|the\s*fund|the\s*loan)/i,
      /managing\s*director\s*(of\s*)?nelfund/i,
    ],
    answer: `**Who administers the loans** (official FAQ)\n\nThe **Nigerian Education Loan Fund (NELFUND)** administers the loans day to day. It is headed by a Managing Director appointed by the President of Nigeria.\n\nFAQ: ${FAQ}`,
  },
  {
    id: 'all-tertiary',
    intent: 'eligibility',
    patterns: [
      /open\s*to\s*all\s*tertiary/i,
      /all\s*(tertiary|higher)\s*institutions?/i,
      /private\s*(university|poly|school)\s*(eligible|apply|qualify)/i,
      /only\s*federal\s*(schools?|institutions?)/i,
      /state\s*(university|poly)\s*(fit|eligible|apply)/i,
    ],
    answer: `**Which institutions** (official FAQ)\n\nThe loan is open to **public** tertiary institutions. Early phases focused on federal institutions; later phases are announced by NELFUND. Always confirm your school appears on ${PORTAL}.\n\nPrivate institutions are not described as part of the public scheme on the official FAQ.\n\nFAQ: ${FAQ}`,
  },
  {
    id: 'who-eligible',
    intent: 'eligibility',
    patterns: [
      /who\s*(is\s*)?eligible\s*(to\s*apply)?/i,
      /who\s*can\s*apply\s*(for\s*)?(the\s*)?(loan|nelfund)/i,
      /eligibility\s*(for\s*)?(the\s*)?loan/i,
      /can\s*i\s*apply\s*if\s*i\s*(get|got|have)\s*admission/i,
    ],
    answer: `**Who is eligible** (official FAQ)\n\nStudents with admission into **public** Nigerian universities, polytechnics, colleges of education, or vocational schools, with proof of admission including name, date of birth, admission details, **JAMB number**, matriculation number, and **BVN**. New and existing students in those institutions can apply.\n\nConfirm live requirements on ${PORTAL}. FAQ: ${FAQ}`,
  },
  {
    id: 'direct-entry',
    intent: 'eligibility',
    patterns: [
      /direct\s*entry/i,
      /\bde\s*student/i,
      /jamb\s*(for\s*)?direct\s*entry/i,
    ],
    answer: `**Direct Entry** (official FAQ)\n\nYes, Direct Entry students can apply, but they **must have a JAMB number**.\n\nPortal: ${PORTAL} · FAQ: ${FAQ}`,
  },
  {
    id: 'all-students-or-applicants',
    intent: 'eligibility',
    patterns: [
      /only\s*applicants\s*will\s*benefit/i,
      /all\s*students\s*or\s*only\s*applicants/i,
      /must\s*(i|you)\s*apply\s*to\s*benefit/i,
    ],
    answer: `**All students vs applicants** (official FAQ)\n\nAll **full-time** students in covered institutions are eligible in principle, but **only those who apply** benefit from the loan.\n\nFAQ: ${FAQ}`,
  },
  {
    id: 'how-much',
    intent: 'how-to-apply',
    patterns: [
      /how\s*much\s*(loan|money|can\s*i\s*(get|apply))/i,
      /loan\s*amount/i,
      /maximum\s*(loan|amount)/i,
      /wetin\s*(be\s*)?(the\s*)?(loan\s*)?amount/i,
    ],
    answer: `**How much can you apply for** (official FAQ)\n\nIt is based on each institution’s **institutional charges**. The loan can cover institutional charges and **upkeep** if you request it. Institutional charges go **to the school**; upkeep is paid **to you** monthly.\n\nExact figures only on ${PORTAL}. FAQ: ${FAQ}`,
  },
  {
    id: 'payment-before-disburse',
    intent: 'scam-safety',
    patterns: [
      /pay\s*(before|to)\s*(disburse|get\s*(the\s*)?loan)/i,
      /any\s*payment\s*(before|required)\s*(disbursement|loan)/i,
      /application\s*fee/i,
      /do\s*(i|we)\s*(need\s*to\s*)?pay\s*(anything|money)\s*(before|first)/i,
    ],
    answer: `**Payment before disbursement** (official FAQ)\n\n**No payment** is required before the loan is disbursed.\n\nAnyone asking you to pay an agent or “processing fee” on WhatsApp is a scam. Use only ${SITE} and ${PORTAL}. FAQ: ${FAQ}`,
  },
  {
    id: 'interest',
    intent: 'loan-or-scholarship',
    patterns: [
      /interest\s*(on\s*)?(the\s*)?loan/i,
      /zero\s*interest/i,
      /is\s*(the\s*)?loan\s*interest\s*free/i,
      /do\s*(i|we)\s*pay\s*interest/i,
    ],
    answer: `**Interest** (official FAQ)\n\n**Zero interest** on the loan.\n\nFAQ: ${FAQ}`,
  },
  {
    id: 'open-to-every-student',
    intent: 'eligibility',
    patterns: [
      /open\s*to\s*every\s*student/i,
      /only\s*(new|existing)\s*students/i,
      /new\s*and\s*existing\s*students/i,
    ],
    answer: `**Who the loan is open to** (official FAQ)\n\nThe loan is open to **new and existing full-time** students in tertiary institutions covered by the scheme.\n\nConfirm your school and session on ${PORTAL}. FAQ: ${FAQ}`,
  },
  {
    id: 'processing-timeline',
    intent: 'pending-application',
    patterns: [
      /disbursement\s*timeline/i,
      /how\s*(are\s*)?loan\s*applications?\s*processed/i,
      /within\s*30\s*days/i,
      /how\s*long\s*(before|to)\s*(disburse|approval|approve)/i,
      /when\s*(will|go)\s*(dem|they)\s*(pay|disburse)/i,
    ],
    answer: `**Processing and disbursement** (official FAQ)\n\nApplications are **online**. You enter details such as institution, admission number, JAMB number, date of birth, NIN, and BVN.\n\nNELFUND states it will disburse **within 30 days of approval** of successful applications. Your own portal status is the source of truth: ${PORTAL}.\n\nFAQ: ${FAQ}`,
  },
  {
    id: 'age-limit',
    intent: 'eligibility',
    patterns: [
      /age\s*limit/i,
      /maximum\s*age/i,
      /too\s*old\s*to\s*apply/i,
      /age\s*(requirement|restriction)/i,
    ],
    answer: `**Age limit** (official FAQ)\n\n**No** age limit for applicants, per the official FAQ.\n\nFAQ: ${FAQ}`,
  },
  {
    id: 'who-repays',
    intent: 'repayment',
    patterns: [
      /who\s*(is\s*)?responsible\s*for\s*(the\s*)?(loan\s*)?repayment/i,
      /who\s*(pays?|go\s*pay)\s*(back\s*)?(the\s*)?loan/i,
      /parents?\s*(pay|repay)/i,
    ],
    answer: `**Who repays** (official FAQ)\n\nThe **beneficiary** (the student who received the loan) is responsible for repayment.\n\nFAQ: ${FAQ}`,
  },
  {
    id: 'apply-once',
    intent: 'reapplication',
    patterns: [
      /applied?\s*(for\s*)?only\s*once/i,
      /apply\s*every\s*(academic\s*)?session/i,
      /one\s*time\s*(loan|application)/i,
      /must\s*i\s*apply\s*again\s*next\s*(year|session)/i,
    ],
    answer: `**Apply once or every session?** (official FAQ)\n\nThe loan is applied for **every academic session** by the student (not a one-time lifetime application).\n\nUse the same account on ${SITE}. FAQ: ${FAQ}`,
  },
  {
    id: 'know-approved',
    intent: 'pending-application',
    patterns: [
      /how\s*(do\s*)?(i|applicants?)\s*know\s*(if\s*)?(my\s*)?(application\s*)?(is\s*)?approved/i,
      /approval\s*notification/i,
      /how\s*(to\s*)?check\s*(if\s*)?(approved|approval)/i,
    ],
    answer: `**How you know you are approved** (official FAQ)\n\nApplicants receive a **notification**, and the status is visible on the **applicant’s profile** on the portal.\n\nCheck ${PORTAL} for the live status word. FAQ: ${FAQ}`,
  },
  {
    id: 'when-repay',
    intent: 'repayment',
    patterns: [
      /when\s*(is\s*)?(the\s*)?loan\s*due\s*(for\s*)?repayment/i,
      /when\s*(do\s*)?(i|we)\s*(start\s*)?repay/i,
      /2\s*years?\s*after\s*(nysc|service)/i,
      /repayment\s*(start|begins?|due)/i,
    ],
    answer: `**When repayment is due** (official FAQ)\n\nThe loan is due for repayment **2 years after completion of NYSC**.\n\nConfirm your personal schedule on official channels. FAQ: ${FAQ}`,
  },
  {
    id: 'no-job-after-nysc',
    intent: 'repayment',
    patterns: [
      /no\s*job\s*after\s*(two\s*years?|2\s*years?|nysc)/i,
      /unemployed\s*(after\s*)?(nysc|two\s*years?)/i,
      /affidavit\s*every\s*3\s*months/i,
      /cannot\s*find\s*(work|job).*repay/i,
    ],
    answer: `**No job after 2 years post-NYSC** (official FAQ)\n\nNotify NELFUND with a **sworn court affidavit every 3 months** if you are still unable to gain employment after that window.\n\nFAQ: ${FAQ}`,
  },
  {
    id: 'repay-process',
    intent: 'repayment',
    patterns: [
      /how\s*(will|does)\s*(the\s*)?loan\s*repayment\s*process\s*work/i,
      /10%\s*of\s*(salary|profit)/i,
      /how\s*(do\s*)?(i|we)\s*repay/i,
      /salary\s*deduction/i,
    ],
    answer: `**How repayment works** (official FAQ)\n\n• Employed: **10% of salary** deducted at source by the employer.\n• Self-employed: remit **10% of monthly profit** to the Fund.\n• You may repay **more** than 10% if you choose.\n\nFAQ: ${FAQ}`,
  },
  {
    id: 'repay-early',
    intent: 'repayment',
    patterns: [
      /pay\s*(back\s*)?before\s*(i\s*)?(get\s*)?(a\s*)?job/i,
      /repay\s*early/i,
      /money\s*to\s*pay\s*back\s*before/i,
    ],
    answer: `**Pay before you get a job** (official FAQ)\n\nYes. You can repay once you have money, **even before** you gain employment.\n\nFAQ: ${FAQ}`,
  },
  {
    id: 'repay-abroad',
    intent: 'repayment',
    patterns: [
      /repay\s*(when\s*)?(i\s*am\s*)?(relocating|abroad|outside\s*nigeria)/i,
      /travel(ling)?\s*abroad.*repay/i,
      /live\s*abroad.*loan/i,
    ],
    answer: `**Repaying while abroad** (official FAQ)\n\nContact NELFUND and **sign an agreement** with modalities to repay.\n\nUse official support channels, not random social media numbers. FAQ: ${FAQ}`,
  },
  {
    id: 'guarantor',
    intent: 'guarantor',
    patterns: [
      /guarantor/i,
      /surety/i,
      /need\s*(a\s*)?guarantor/i,
    ],
    answer: `**Guarantor** (official FAQ)\n\nThe student loan has **no requirement for a guarantor**.\n\nAnyone charging you to “stand as guarantor” is not following the official FAQ. FAQ: ${FAQ}`,
  },
  {
    id: 'appeal-denied',
    intent: 'rejected-application',
    patterns: [
      /appeal\s*(process|when|if)\s*(application\s*)?(is\s*)?(denied|rejected)/i,
      /application\s*(denied|rejected).*appeal/i,
      /how\s*to\s*appeal/i,
    ],
    answer: `**Appeal if denied** (official FAQ)\n\nRaise a **complaint from the portal**, or contact NELFUND through official channels listed on ${SITE}.\n\nPortal: ${PORTAL} · FAQ: ${FAQ}`,
  },
  {
    id: 'documents-upload',
    intent: 'documents-needed',
    patterns: [
      /documents?\s*to\s*upload/i,
      /what\s*(documents?|papers?)\s*(do\s*i\s*)?(need|upload)/i,
      /admission\s*letter\s*(compulsory|required)/i,
      /student\s*(id|identification)\s*card/i,
    ],
    answer: `**Documents to upload** (official FAQ)\n\n• **Scanned admission letter** for new students (**compulsory**)\n• **Scanned student ID card** (optional)\n\nConfirm the live form fields on ${PORTAL}. FAQ: ${FAQ}`,
  },
  {
    id: 'deny-application',
    intent: 'rejected-application',
    patterns: [
      /circumstances?\s*(would\s*)?nelfund\s*deny/i,
      /why\s*(would|can)\s*(they|nelfund)\s*(deny|reject)/i,
      /reasons?\s*(for\s*)?(denial|rejection)/i,
      /defaulted\s*(previous\s*)?loan|fake\s*(documents?|admission)|exam\s*malpractice|cultism|forgery/i,
    ],
    answer: `**When NELFUND may deny an application** (official FAQ)\n\nExamples include if the applicant:\n• Defaulted on a previous loan from a licensed financial institution\n• Submitted fake or fraudulent documents, or was dismissed for exam malpractice\n• Was convicted of fraud, forgery, drug offences, cultism, felony, or offences involving dishonesty\n\nFAQ: ${FAQ}`,
  },
  {
    id: 'part-time',
    intent: 'eligibility',
    patterns: [
      /part[-\s]?time\s*students?/i,
      /only\s*full[-\s]?time/i,
      /full[-\s]?time\s*(or|vs)\s*part[-\s]?time/i,
    ],
    answer: `**Part-time students** (official FAQ)\n\nAs long as the student has a **JAMB number**, they are able to apply for the loan (per the official FAQ).\n\nConfirm your case on ${PORTAL}. FAQ: ${FAQ}`,
  },
  {
    id: 'default-consequences',
    intent: 'repayment',
    patterns: [
      /consequences?\s*of\s*default/i,
      /default(ing)?\s*on\s*(the\s*)?loan/i,
      /what\s*(if\s*)?(i\s*)?(no\s*pay|don't\s*repay|fail\s*to\s*repay)/i,
      /credit\s*score.*loan/i,
    ],
    answer: `**Defaulting on the loan** (official FAQ)\n\nDeliberate default can result in **penalties, legal action, and potential damage to your credit score**.\n\nFAQ: ${FAQ}`,
  },
  {
    id: 'deferred-dropout',
    intent: 'repayment',
    patterns: [
      /admission\s*(is\s*)?deferred/i,
      /drop\s*out/i,
      /withdraw\s*from\s*(school|the\s*programme)/i,
      /deferred\s*(admission|session)/i,
    ],
    answer: `**Deferred admission or dropout** (official FAQ)\n\nBeneficiaries must **notify NELFUND immediately**. Loan repayment obligations **may still apply**.\n\nFAQ: ${FAQ}`,
  },
  {
    id: 'forgiveness',
    intent: 'repayment',
    patterns: [
      /loan\s*forgiveness/i,
      /write\s*off\s*(the\s*)?loan/i,
      /severe\s*(disability|permanent)/i,
      /death\s*(and\s*)?(loan|forgiveness)/i,
      /if\s*(the\s*)?student\s*dies/i,
    ],
    answer: `**Loan forgiveness** (official FAQ)\n\nNELFUND provides loan forgiveness in the event of **death**, and may write off the loan for individuals with **severe or permanent disabilities**.\n\nFAQ: ${FAQ}`,
  },
  {
    id: 'monthly-upkeep',
    intent: 'upkeep',
    patterns: [
      /how\s*(can\s*)?(i\s*)?get\s*(the\s*)?(student\s*)?monthly\s*upkeep/i,
      /monthly\s*upkeep/i,
      /apply\s*(for\s*)?upkeep/i,
      /upkeep\s*(allowance|money|loan)/i,
      /stipend|living\s*allowance/i,
    ],
    answer: `**Monthly upkeep** (official FAQ)\n\nTo receive monthly upkeep, apply for **both** the institutional loan (fees) **and** the upkeep loan **at registration**.\n\nIf you only apply for institutional charges without upkeep, you are **not** eligible for the upkeep allowance later.\n\nPortal: ${PORTAL} · FAQ: ${FAQ}`,
  },
]

/**
 * Match student text (any wording) to an official FAQ answer.
 * Returns the first strong pattern hit.
 */
export function matchOfficialFaq(userText: string): OfficialFaqHit | null {
  const t = (userText || '').trim()
  if (t.length < 4) return null

  for (const entry of ENTRIES) {
    for (const re of entry.patterns) {
      if (re.test(t)) {
        return { id: entry.id, intent: entry.intent, answer: entry.answer }
      }
    }
  }
  return null
}

/** Intent hint for residual routing when FAQ matches */
export function officialFaqIntent(userText: string): IntentId | null {
  return matchOfficialFaq(userText)?.intent ?? null
}
