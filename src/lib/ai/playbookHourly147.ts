const PORTAL = 'https://portal.nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'
const SITE = 'https://nelf.gov.ng/'

/** Hourly 147: pending + vague-menu angles that still sounded like one dump. */
export function playbookHourly147(intent: string, t: string): string | null {
  const q = t || ''

  if (intent === 'pending-application') {
    if (/queue|on\s*hold|hold\s*no\s*clear|review\s*no\s*finish/i.test(q)) {
      return `**On hold or in a queue is still the same portal file.**\n\n1. Copy the exact status sentence on ${PORTAL}. This chat cannot see the queue.\n2. A hold can sit while the school record or a payment line moves.\n3. Do not open a second account to jump the line.\n4. I will not invent how long a hold lasts. Long same word: campus NELFUND desk, then ${ESUPPORT}.`
    }
    if (/they\s*paid\s*(everyone|everybody|others)|everybody\s*(except|but)\s*me|left\s*behind|una\s*don\s*settle\s*others|all\s*my\s*mates/i.test(q)) {
      return `**Others collecting first is not a decline for you.**\n\n1. Sign in and copy your own status word on ${PORTAL}, not a class list.\n2. School charges go to the institution. Classmates can get an alert while your line waits.\n3. Do not create another email because you feel left behind.\n4. Same word for a long time: campus desk, then ${ESUPPORT}.`
    }
    if (/any\s*movement|how\s*far\s*una\s*go|my\s*own\s*never\s*leave\s*pending|process\s*no\s*end/i.test(q)) {
      return `**Movement only shows on your dashboard.**\n\n1. Open ${PORTAL} and copy the exact word. I cannot track batches from here.\n2. Processing for a long time is still a wait, not a new apply.\n3. No SMS does not mean declined.\n4. Long same word: campus NELFUND desk, then ${ESUPPORT}.`
    }
  }

  if (intent === 'official-sources') {
    if (/menu|topics|headings|options|what\s*kind\s*help|una\s*cover|map\s*of\s*topics|help\s*desk/i.test(q)) {
      return `**Short menu (pick one).**\n\n1. What NELFUND is and who it is for\n2. Account vs loan window (live status, no invented dates)\n3. How to apply on ${PORTAL}\n4. Pending / money never enter\n5. JAMB, email already used, or school not on the list\n\nOfficial site: ${SITE}`
    }
    if (/first\s*time|i\s*come\s*online|i\s*dey\s*look\s*una|yarn\s*me\s*something/i.test(q)) {
      return `**You just landed. Start small.**\n\n1. Create or sign in only on ${PORTAL} with one email.\n2. Ask me: is the window open, how do I apply, or why is my file pending.\n3. I will not invent deadlines or amounts. Official pages: ${SITE}`
    }
  }

  return null
}
