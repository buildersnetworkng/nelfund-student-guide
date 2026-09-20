const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

/** Hour-71 playbook. Different angle, different wording. No invented dates. No long dashes. */
export function playbookHourly71(intent: string, userText: string): string | null {
  const t = userText || ''

  if (/nothing\s*(don|has|have)\s*(drop|enter|show|come)|account\s*(still\s*)?(empty|blank|zero)|i\s*never\s*collect|collect\s*(my\s*)?(own|money)\s*abeg/i.test(t)) {
    return `**Nothing don drop / you never collect:** that is still a wait on your file.\n\n1. Sign in at ${PORTAL} and copy the exact status word. I cannot see your bank or dashboard from this chat.\n2. School charges go to the school. Empty personal account does not mean declined.\n3. Upkeep only if you ticked it in the same session.\n4. I will not invent a pay day. Same word for weeks: campus NELFUND desk, then ${ESUPPORT}.`
  }

  if (/my\s*name\s*(no|not)\s*dey|name\s*no\s*dey\s*list|tinubu\s*(never|no)\s*pay|miss\s*(the\s*)?batch|dem\s*skip\s*(my\s*)?(name|file)|batch\s*(pass|don\s*pass)/i.test(t)) {
    return `**Name no dey list / batch pass you:** there is no official public pay list I can quote here.\n\n1. Only ${PORTAL} shows *your* file. Copy the exact status word there.\n2. Classmates collecting first does not mean your file was skipped.\n3. Do not open a second account to chase a batch.\n4. Long same-word wait: campus desk, then ${ESUPPORT}. Official site: ${SITE}.`
  }

  if (/file\s*dey\s*sleep|my\s*file\s*(dey|is)\s*(sleep|stuck|freeze|frozen)|stuck\s*(on|for)\s*(pending|submitted)|application\s*hang|loan\s*hang|freeze\s*(for|on)\s*(pending|portal)/i.test(t)) {
    return `**File dey sleep / hang on pending:** the word on the portal is what counts.\n\n1. Open ${PORTAL} and write the exact phrase (pending, submitted, under review).\n2. Do not create another account while it hangs.\n3. Ask the campus NELFUND desk if the school record is uploaded for this session.\n4. Still frozen for a long time: ${ESUPPORT}. I will not invent when it will move.`
  }

  if (/wetin\s*(dey\s*)?happen\s*(to|with)\s*(my\s*)?(loan|application|file|own)|where\s*(my\s*)?(application|loan)\s*(reach|dey)|what\s*is\s*(the\s*)?(status|state)\s*of\s*(my\s*)?(loan|application)|any\s*news\s*(on|about)\s*(my\s*)?(loan|application)|follow\s*up\s*(on\s*)?(my\s*)?(loan|application)/i.test(t)) {
    return `**Wetin dey happen to your own / where e reach:** this chat cannot open the file.\n\n1. Sign in at ${SITE}, then ${PORTAL}. Copy the exact status sentence.\n2. That sentence is the update. WhatsApp lists are not official.\n3. School fees and upkeep can move on different days.\n4. Same sentence for weeks: campus NELFUND desk, then ${ESUPPORT}.`
  }

  if (/dashboard\s*(still\s*)?(say|show|dey)\s*(pending|0|zero)|total\s*loans?\s*(still\s*)?(0|zero)|portal\s*(still\s*)?show(s|ing)?\s*(pending|submitted|processing)/i.test(t)) {
    return `**Dashboard still pending or Total loans 0:** treat that as your live file, not a rumour.\n\n1. Confirm you signed in at ${SITE} with the same email. Do not create a second account.\n2. Copy the exact line you see on ${PORTAL}.\n3. Zero loans can mean the school has not uploaded this session yet. Ask the campus desk.\n4. Still the same after that: ${ESUPPORT}.`
  }

  if (intent === 'jamb-verification') {
    return `**JAMB number no gree / verification failed.**\n\n1. Type the number exactly as on the admission letter. No extra space.\n2. Name and date of birth must match JAMB and NIN.\n3. Direct Entry still needs a real JAMB registration.\n4. Still failing: campus desk, then ${ESUPPORT}. Do not open a second account.`
  }

  if (intent === 'portal-login' && /email|register|sign\s*up|old\s*account|mail/i.test(t)) {
    return `**This email don dey / you get account before.** Sign in at ${SITE}. Do not create a new account with another mail. Forgot password: reset on ${SITE}. Still locked: ${ESUPPORT}.`
  }

  if (intent === 'school-not-found') {
    return `**School no appear on the list.** Search the full official name on ${PORTAL}. Ask ICT / Registry if the record is uploaded. Private schools are outside this scheme. Still missing: ${ESUPPORT}.`
  }

  return null
}
