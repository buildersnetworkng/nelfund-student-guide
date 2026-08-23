import type { IntentId, IntentResult, StudentStage, ConversationTurn } from './types'

interface IntentRule {
  intent: IntentId
  patterns: RegExp[]
  topics: string[]
  problem: string
  stage: StudentStage
  entities: string[]
  troubleshooting: boolean
  weight: number
}

function isLoanCounterNoise(q: string): boolean {
  return (
    /total\s*loans/i.test(q) ||
    /approved\s*loans/i.test(q) ||
    /pending\s*loans/i.test(q) ||
    /declined\s*loans/i.test(q) ||
    /welcome\s+to\s+student\s+loan\s+portal/i.test(q)
  )
}

const RULES: IntentRule[] = [
  {
    intent: 'email-draft',
    patterns: [
      /draft\s*(me\s*)?(an?\s*)?(email|mail|message|letter)/i,
      /write\s*(me\s*)?(an?\s*)?(email|mail|message|letter)/i,
      /compose\s*(an?\s*)?(email|mail)/i,
      /abeg\s*draft\s*(email|mail|message)/i,
      /help\s*me\s*(write|draft)\s*(an?\s*)?(email|mail)/i,
    ],
    topics: ['email', 'draft'],
    problem: 'Draft a support email or message',
    stage: 'applying',
    entities: ['email'],
    troubleshooting: false,
    weight: 20,
  },
  {
    intent: 'contact-lookup',
    patterns: [
      /(school|institution|lasu|unilag|oou|futa).{0,50}(email|contact|phone)/i,
      /(email|contact|phone).{0,50}(school|institution|lasu|unilag|ict|registry)/i,
      /need\s*to\s*contact\s*(my\s*)?(school|institution)/i,
      /who\s*(do\s*i|should\s*i)\s*contact/i,
      /how\s*(do\s*i|to)\s*contact\s*(my\s*)?(school|institution)/i,
      /find\s*(the\s*)?(official\s*)?(contact|email)\s*(for\s*)?(my\s*)?(school|institution)/i,
      /school.?s?\s*(email|contact)/i,
    ],
    topics: ['contact', 'institution'],
    problem: 'Find official institution or support contact',
    stage: 'applying',
    entities: ['school', 'support'],
    troubleshooting: false,
    weight: 19,
  },
  {
    intent: 'current-information',
    patterns: [
      /as\s*of\s*today/i,
      /current\s*(info|information|status|update)/i,
      /latest\s*(update|news|info|information|announcement)/i,
      /latest\s*nelfund/i,
      /nelfund\s*(update|latest|news)/i,
      /what.?s\s*the\s*latest\s*(on\s*)?nelfund/i,
      /still\s*accepting\s*(applications?)?/i,
      /is\s*nelfund\s*still\s*accepting/i,
      /accepting\s*applications?/i,
      /what.?s\s*new/i,
      /has\s*nelfund\s*announced/i,
      /any\s*latest\s*update/i,
      /what\s*is\s*happening\s*with\s*(nelfund|2026)/i,
      /has\s*2026\s*\/?\s*2027\s*(application\s*)?opened/i,
      /is\s*(application|portal)\s*(still\s*)?open/i,
      /is\s*nelfund\s*(still\s*)?(open|closed)/i,
      /nelfund\s*(still\s*)?(open|closed)\??/i,
      /is\s*(the\s*)?(loan\s*)?(portal|application)\s*open/i,
      /can\s*i\s*(still\s*)?apply\s*(now|today|this\s*year)?/i,
      /latest\s*official\s*nelfund/i,
      /what\s*changed\s*(about|on|with)?\s*nelfund/i,
      /session\s*registration/i,
      /when\s*(will|is|does).{0,40}(expire|close|end|open)/i,
      /when\s*(will|is).{0,30}(registration|application)/i,
      /registration.{0,20}(expire|deadline|close)/i,
      /(expire|deadline).{0,30}(registration|application|account)/i,
      /don'?t\s*have\s*(a\s*)?bvn/i,
      /no\s*bvn\s*yet/i,
      /i\s*don'?t\s*have\s*bvn/i,
      /bvn\s*yet/i,
      /sort\s*out\s*(my\s*)?bvn/i,
      /them\s*never\s*open/i,
      /dem\s*never\s*open/i,
      /window\s*(still\s*)?(open|close)/i,
    ],
    topics: ['current', 'latest', 'open', 'deadline', 'bvn'],
    problem: 'Current or time-sensitive NELFUND information',
    stage: 'exploring',
    entities: ['session'],
    troubleshooting: false,
    weight: 18,
  },
  {
    intent: 'portal-login',
    patterns: [
      /\blogin\b/i,
      /log\s*in/i,
      /sign\s*in/i,
      /forgot\s*(my\s*)?password/i,
      /reset\s*(my\s*)?password/i,
      /password\s*(not\s*work|reset|issue)/i,
      /can.?t\s*(login|log\s*in|sign\s*in)/i,
      /unable\s*to\s*(login|log\s*in)/i,
      /which\s*(link|url|site).{0,40}(login|log\s*in|sign\s*in)/i,
      /(login|log\s*in|sign\s*in).{0,40}(link|url|portal)/i,
      /not\s*(that\s*)?i\s*(just\s*)?want\s*to\s*fill/i,
      /i\s*want\s*to\s*(login|log\s*in)/i,
      /existing\s*(account|application)/i,
      /already\s*(have|created)\s*(an?\s*)?account/i,
      /portal\s*link/i,
      /nelfund\s*website/i,
      /where\s*(i\s*)?(go|enter|open)\s*(the\s*)?(portal|site)/i,
    ],
    topics: ['login', 'portal'],
    problem: 'Official link to login or continue an existing application',
    stage: 'applying',
    entities: ['portal'],
    troubleshooting: false,
    weight: 17,
  },
  {
    intent: 'institution-verification',
    patterns: [
      /institutional\s*verif/i,
      /school\s*verif/i,
      /verif.*(institution|school)/i,
      /data\s*(been\s*)?uploaded/i,
      /uploaded\s*(to\s*)?(nelfund|portal)/i,
      /school\s*(has\s*)?uploaded/i,
      /has\s*(my\s*)?(school|institution)\s*uploaded/i,
      /how\s*(do\s*i|to)\s*know\s*if\s*(my\s*)?(data|record|school)/i,
      /know\s*if\s*(my\s*)?(data|record).{0,40}upload/i,
      /whether\s*(my\s*)?(school|data|record).{0,40}upload/i,
      /student\s*record\s*(upload|submit)/i,
      /school\s*(don|doesn|no)\s*(upload|submit)/i,
      /my\s*school\s*(never|no)\s*upload/i,
    ],
    topics: ['institution verification', 'upload'],
    problem: 'Whether institution has uploaded student record to NELFUND',
    stage: 'waiting',
    entities: ['verification', 'school'],
    troubleshooting: true,
    weight: 16,
  },
  {
    intent: 'eligibility',
    patterns: [
      /eligib/i,
      /can\s*i\s*apply/i,
      /am\s*i\s*(eligible|qualified)/i,
      /who\s*can\s*apply/i,
      /cgpa/i,
      /disqualif/i,
      /deny\s*(an?\s*)?application/i,
      /what\s*can\s*disqualif/i,
      /anything\s*that\s*can\s*disqualif/i,
      /reasons?\s*(for\s*)?(rejection|denial|disqualif)/i,
      /who\s*(cannot|can'?t|can\s*not)\s*apply/i,
      /ineligib/i,
    ],
    topics: ['eligibility', 'disqualification'],
    problem: 'Eligibility or what can disqualify an applicant',
    stage: 'exploring',
    entities: ['eligibility'],
    troubleshooting: false,
    weight: 15,
  },
  {
    intent: 'jamb-verification',
    patterns: [
      /jamb.*(not|isn'?t|no|keep|reject|invalid|fail|accept|work|go)/i,
      /(not|isn'?t|no|keep|reject|invalid|fail).*jamb/i,
      /jamb.*(number|reg|registration).*(wrong|reject|invalid|not|fail)/i,
      /(reject|invalid|not\s*accept).*(jamb|registration\s*number)/i,
      /my\s*jamb.*(correct|right).*(but|still|keep)/i,
      /portal.*(no\s*dey|not|isn'?t).*accept.*jamb/i,
      /no\s*dey\s*accept\s*my\s*jamb/i,
      /jamb.*(no\s*dey|won'?t|wont)\s*(enter|work|go)/i,
      /can'?t\s*(enter|use|input).*jamb/i,
      /jamb\s*issue/i,
      /problem\s*with\s*(my\s*)?jamb/i,
    ],
    topics: ['jamb', 'verification'],
    problem: 'JAMB registration number rejected or not verifying',
    stage: 'applying',
    entities: ['jamb'],
    troubleshooting: true,
    weight: 12,
  },
  {
    intent: 'nin-verification',
    patterns: [
      /nin.*(not|isn'?t|no|keep|reject|invalid|fail|verify|work|mismatch|match)/i,
      /(not|isn'?t|no|keep|reject|invalid|fail|mismatch).*nin/i,
      /nin.*(verif|fail|reject|mismatch)/i,
      /fix\s*(my\s*)?nin/i,
      /nin\s*issue/i,
      /problem\s*with\s*(my\s*)?nin/i,
    ],
    topics: ['nin', 'verification'],
    problem: 'NIN is not verifying',
    stage: 'applying',
    entities: ['nin'],
    troubleshooting: true,
    weight: 12,
  },
  {
    intent: 'missing-information',
    patterns: [
      /missing\s*(info|information|data)/i,
      /no\s*school\s*(info|information)/i,
      /school\s*(info|information)\s*(not\s*found|missing)/i,
      /showing\s*missing/i,
      /it\s*(is\s*)?showing\s*missing/i,
      /nelfund.*showing\s*missing/i,
      /trying\s*to\s*open.*missing/i,
      /information\s*not\s*found/i,
      /no\s*information\s*found/i,
      /keeps?\s*saying\s*(no|missing)\s*(info|information)/i,
      /e\s*dey\s*show\s*missing/i,
      /dey\s*show\s*missing/i,
      /my\s*nelfund.*(missing|no\s*info)/i,
      /student\s*record.*(missing|not\s*found)/i,
      /record\s*not\s*found/i,
      /no\s*dey\s*show\s*(my\s*)?(info|information|data)/i,
      /portal\s*no\s*dey\s*work/i,
      /e\s*no\s*dey\s*work/i,
      /nelfund\s*thing\s*no\s*dey\s*work/i,
      /wahala\s*(with\s*)?(missing|info|portal)/i,
    ],
    topics: ['missing information'],
    problem: 'Portal shows missing or no school information',
    stage: 'applying',
    entities: ['school', 'portal'],
    troubleshooting: true,
    weight: 12,
  },
  {
    intent: 'school-not-found',
    patterns: [
      /school.*(not|isn'?t|no\s*dey|no).*(show|appear|come|list|found)/i,
      /(not|isn'?t|no\s*dey|no).*(show|appear|come).*school/i,
      /my\s*school\s*(no\s*dey|not\s*showing|isn'?t\s*showing)/i,
      /institution\s*(not|isn'?t).*(on|in|show|list|found)/i,
      /school\s*no\s*dey\s*show/i,
      /can'?t\s*find\s*(my\s*)?school/i,
      /school\s*not\s*on\s*(the\s*)?(list|portal)/i,
    ],
    topics: ['school not showing'],
    problem: 'School or institution is not appearing on the portal',
    stage: 'applying',
    entities: ['school'],
    troubleshooting: true,
    weight: 12,
  },
  {
    intent: 'pending-application',
    patterns: [
      /(?<!pending\s)(?<!total\s)(?<!approved\s)\bpending\b(?!\s*loans)/i,
      /application\s*(is\s*)?pending/i,
      /status\s*(is\s*)?pending/i,
      /under\s*review/i,
      /still\s*under\s*review/i,
      /not\s*yet\s*approv/i,
      /when\s*will\s*(my\s*)?(application|loan)\s*(be\s*)?approv/i,
      /approval\s*status/i,
      /e\s*still\s*dey\s*pending/i,
      /still\s*(waiting|processing)(?!\s*loans)/i,
      /submitted.*(still|nothing|pending)/i,
      /nothing\s*is\s*happening/i,
      /i'?ve\s*submitted.*(since|and|but)/i,
      /this\s*thing\s*is\s*still\s*pending/i,
      /how\s*long.*(pending|wait|processing)/i,
      /since\s*(last\s*)?(week|month).*(pending|nothing)/i,
      /my\s*application\s*(still|no)\s*(move|change)/i,
      /status\s*no\s*dey\s*change/i,
    ],
    topics: ['pending', 'status'],
    problem: 'Application is still pending',
    stage: 'waiting',
    entities: ['application'],
    troubleshooting: true,
    weight: 11,
  },
  {
    intent: 'rejected-application',
    patterns: [
      /\bapplication\s*(was\s*)?reject(?:ed|ion)?\b/i,
      /\breject(?:ed|ion)?\s*(my\s*)?application\b/i,
      /(?<!declined\s)\bdeclined\b(?!\s*loans)/i,
      /not\s*approv/i,
      /failed\s*(verification|application)/i,
      /nelfund\s*rejected\s*me/i,
      /my\s*application\s*was\s*rejected/i,
      /i\s*got\s*rejected\b/i,
    ],
    topics: ['rejected'],
    problem: 'Application was rejected',
    stage: 'rejected',
    entities: ['application'],
    troubleshooting: true,
    weight: 11,
  },
  {
    intent: 'bank-information',
    patterns: [
      /bank.*(detail|account|info|fail|reject|not)/i,
      /my\s*bank\s*details/i,
      /bank\s*details\s*(were\s*)?(reject|fail|not)/i,
      /bank\s*account\s*(reject|fail|not)/i,
      /bvn.*(fail|reject|not|verif)/i,
      /\bbvn\b/i,
    ],
    topics: ['bank', 'bvn'],
    problem: 'Bank details or BVN steps',
    stage: 'applying',
    entities: ['bank'],
    troubleshooting: true,
    weight: 14,
  },
  {
    intent: 'refund',
    patterns: [
      /already\s*paid/i,
      /paid\s*(my\s*)?(school\s*)?fees/i,
      /i\s*paid\s*before/i,
      /refund/i,
      /paid\s*before\s*(this\s*)?(loan|nelfund)/i,
    ],
    topics: ['already paid', 'refund'],
    problem: 'Already paid school fees before NELFUND',
    stage: 'applying',
    entities: ['fees'],
    troubleshooting: true,
    weight: 11,
  },
  {
    intent: 'profile-update',
    patterns: [
      /edit\s*(my\s*)?(profile|account|information)/i,
      /update\s*(my\s*)?(profile|account|details)/i,
      /change\s*(my\s*)?(name|details|information|bank)/i,
    ],
    topics: ['profile'],
    problem: 'Need to update profile or account information',
    stage: 'applying',
    entities: ['profile'],
    troubleshooting: true,
    weight: 10,
  },
  {
    intent: 'upkeep',
    patterns: [
      /\bupkeep\b/i,
      /how\s*much.*(allowance|monthly|upkeep|20k|20000)/i,
      /20,?000|₦\s*20|20k/i,
      /monthly\s*allowance/i,
      /how\s*(do\s*i|to)\s*get\s*(the\s*)?(20k|upkeep|allowance)/i,
      /get\s*(the\s*)?20k/i,
      /when\s*will\s*i\s*(get|receive).*(money|upkeep|allowance|20k)/i,
      /disburse/i,
      /when\s*(will|dey).*money\s*(enter|come)/i,
      /money\s*(never|no)\s*(enter|come|show)/i,
      /payment\s*(status|not\s*received|delayed)/i,
      /have\s*(they|dem)\s*pay/i,
      /dem\s*never\s*pay/i,
    ],
    topics: ['upkeep', '20k'],
    problem: 'Upkeep allowance amount or access',
    stage: 'exploring',
    entities: ['upkeep'],
    troubleshooting: false,
    weight: 10,
  },
  {
    intent: 'school-fees',
    patterns: [
      /school\s*fees/i,
      /institutional\s*charges/i,
      /will\s*nelfund\s*pay/i,
      /pay\s*(my\s*)?fees/i,
      /does\s*nelfund\s*pay\s*(school|fees)/i,
      /school\s*fees\s*and\s*upkeep/i,
      /fees\s*and\s*(upkeep|allowance)/i,
      /apply\s*for\s*(school\s*)?fees/i,
    ],
    topics: ['fees'],
    problem: 'How school fees / institutional charges are paid',
    stage: 'exploring',
    entities: ['fees'],
    troubleshooting: false,
    weight: 11,
  },
  {
    intent: 'institutional-charges',
    patterns: [/institutional\s*charges/i],
    topics: ['institutional charges'],
    problem: 'Institutional charges payment',
    stage: 'exploring',
    entities: ['fees'],
    troubleshooting: false,
    weight: 9,
  },
  {
    intent: 'repayment',
    patterns: [
      /repay/i,
      /pay\s*(this\s*)?(money\s*)?back/i,
      /do\s*i\s*(have\s*to|must)\s*pay/i,
      /when\s*do\s*i\s*(start\s*)?pay/i,
      /after\s*school.*(pay|repay)/i,
      /loan\s*repayment/i,
      /have\s*to\s*pay\s*(this\s*)?(money\s*)?back/i,
    ],
    topics: ['repayment'],
    problem: 'Repayment obligations after school',
    stage: 'repaying',
    entities: ['repayment'],
    troubleshooting: false,
    weight: 10,
  },
  {
    intent: 'gsi',
    patterns: [/\bgsi\b/i, /global\s*standing\s*instruction/i],
    topics: ['gsi'],
    problem: 'What GSI means for repayment',
    stage: 'repaying',
    entities: ['gsi'],
    troubleshooting: false,
    weight: 10,
  },
  {
    intent: 'loan-or-scholarship',
    patterns: [
      /scholarship/i,
      /free\s*money/i,
      /is\s*(it|nelfund|this)\s*(a\s*)?loan/i,
      /loan\s*or\s*scholarship/i,
      /is\s*(it|this)\s*free/i,
    ],
    topics: ['loan', 'scholarship'],
    problem: 'Whether NELFUND is a loan or scholarship',
    stage: 'exploring',
    entities: ['loan'],
    troubleshooting: false,
    weight: 10,
  },
  {
    intent: 'documents-needed',
    patterns: [
      /what\s*(documents?|do\s*i\s*need)/i,
      /documents?\s*need/i,
      /requirements?/i,
      /what\s*do\s*i\s*need\s*(to\s*)?(apply|upload|submit)/i,
    ],
    topics: ['documents'],
    problem: 'Documents required to apply',
    stage: 'preparing',
    entities: ['documents'],
    troubleshooting: false,
    weight: 9,
  },
  {
    intent: 'how-to-apply',
    patterns: [
      /how\s*(do\s*i|to)\s*apply/i,
      /application\s*steps?/i,
      /start\s*(my\s*)?application/i,
      /register\s*(for|on)\s*nelfund/i,
      /fill\s*(my\s*)?(information|application|form)/i,
      /new\s*application/i,
      /how\s*(does|do)\s*(nelfund|it)\s*work/i,
      /how\s*nelfund\s*works/i,
      /how\s*to\s*register/i,
      /steps?\s*to\s*apply/i,
      /create\s*(an?\s*)?account/i,
      /create\s*(?:[\w']+\s+){0,3}account/i,
      /account\s*creation/i,
      /sign\s*up\s*(for\s*)?nelfund/i,
      /how\s*(do\s*i|to)\s*(create|open)\s*(an?\s*)?account/i,
      /i\s*want\s*to\s*apply/i,
      /help\s*me\s*apply/i,
      /abeg\s*how\s*(i\s*)?(go|to)\s*apply/i,
    ],
    topics: ['apply'],
    problem: 'How to apply for NELFUND',
    stage: 'preparing',
    entities: ['application'],
    troubleshooting: false,
    weight: 9,
  },
  {
    intent: 'guarantor',
    patterns: [/guarantor/i, /surety/i],
    topics: ['guarantor'],
    problem: 'Whether a guarantor is required',
    stage: 'preparing',
    entities: ['guarantor'],
    troubleshooting: false,
    weight: 9,
  },
  {
    intent: 'academic-session',
    patterns: [/2026\s*\/?\s*27|2025\s*\/?\s*26|session/i],
    topics: ['session'],
    problem: 'Current application session or window',
    stage: 'exploring',
    entities: ['session'],
    troubleshooting: false,
    weight: 8,
  },
  {
    intent: 'deadline',
    patterns: [/deadline/i, /closing\s*date/i, /expire/i, /when\s*will.{0,20}close/i],
    topics: ['deadline'],
    problem: 'Application deadline',
    stage: 'exploring',
    entities: ['deadline'],
    troubleshooting: false,
    weight: 12,
  },
  {
    intent: 'scam-safety',
    patterns: [/scam/i, /fraud/i, /\botp\b/i, /agent.*(pay|money)/i, /pay\s*(an?\s*)?agent/i],
    topics: ['scam'],
    problem: 'Scam or safety concern',
    stage: 'unknown',
    entities: ['scam'],
    troubleshooting: true,
    weight: 11,
  },
  {
    intent: 'readiness',
    patterns: [/am\s*i\s*ready/i, /checklist/i, /prepared/i],
    topics: ['readiness'],
    problem: 'Application readiness checklist',
    stage: 'preparing',
    entities: ['checklist'],
    troubleshooting: false,
    weight: 8,
  },
  {
    intent: 'official-sources',
    patterns: [
      /official\s*(link|site|portal|website)/i,
      /nelf\.gov/i,
      /where\s*(do\s*i|to)\s*(apply|go)/i,
      /which\s*(link|url|website)/i,
    ],
    topics: ['official'],
    problem: 'Official NELFUND links',
    stage: 'exploring',
    entities: ['portal'],
    troubleshooting: false,
    weight: 8,
  },
  {
    intent: 'contact-support',
    patterns: [/contact\s*(nelfund|support)/i, /customer\s*(care|service)/i, /helpline/i],
    topics: ['contact'],
    problem: 'How to contact NELFUND support',
    stage: 'unknown',
    entities: ['support'],
    troubleshooting: false,
    weight: 8,
  },
  {
    intent: 'reapplication',
    patterns: [/re-?apply/i, /apply\s*again/i],
    topics: ['reapplication'],
    problem: 'Reapplying after a previous attempt',
    stage: 'applying',
    entities: ['application'],
    troubleshooting: true,
    weight: 9,
  },
  {
    intent: 'what-is-nelfund',
    patterns: [
      /what\s*is\s*nelfund/i,
      /explain\s*nelfund/i,
      /about\s*nelfund/i,
      /tell\s*me\s*about\s*nelfund/i,
      /^nelfund\??$/i,
      /wetin\s*be\s*nelfund/i,
      /how\s*did\s*nelfund\s*(start|begin|come)/i,
      /history\s*of\s*nelfund/i,
      /when\s*was\s*nelfund\s*(created|established|started)/i,
    ],
    topics: ['what is', 'nelfund'],
    problem: 'What NELFUND is',
    stage: 'exploring',
    entities: ['nelfund'],
    troubleshooting: false,
    weight: 7,
  },
]

export const QUERY_SYNONYMS: Record<string, string[]> = {
  school: ['institution', 'university', 'poly', 'polytechnic', 'college'],
  show: ['appear', 'come up', 'list', 'found', 'dey'],
  missing: ['no information', 'not found', 'empty'],
  jamb: ['jamb number', 'jamb reg', 'registration number'],
  nin: ['national identity', 'nin number'],
  pending: ['waiting', 'processing', 'still pending'],
  rejected: ['declined', 'not approved', 'failed'],
  upkeep: ['20k', '20000', 'allowance', 'monthly allowance'],
  fees: ['school fees', 'institutional charges', 'tuition'],
  repay: ['pay back', 'repayment'],
  apply: ['application', 'register', 'registration'],
}

function detectEntities(q: string): string[] {
  const entities: string[] = []
  const map: [RegExp, string][] = [
    [/\bjamb\b/i, 'jamb'],
    [/\bnin\b/i, 'nin'],
    [/\bbvn\b/i, 'bvn'],
    [/school|institution|university/i, 'school'],
    [/fee|tuition|charges/i, 'fees'],
    [/upkeep|20k|allowance/i, 'upkeep'],
    [/pending|status/i, 'status'],
    [/reject/i, 'rejection'],
    [/bank|account/i, 'bank'],
    [/portal|nelfund/i, 'portal'],
    [/login|sign\s*in/i, 'login'],
    [/disqualif|eligib/i, 'eligibility'],
  ]
  for (const [re, name] of map) {
    if (re.test(q) && !entities.includes(name)) entities.push(name)
  }
  return entities
}

function expandWithContext(question: string, history?: ConversationTurn[]): string {
  if (!history || history.length === 0) return question
  const recentUser = history
    .filter((t) => t.role === 'user')
    .slice(-2)
    .map((t) => t.text)
    .join(' ')
  if (question.trim().length < 48 && recentUser) return `${recentUser} ${question}`
  return question
}

function lastUserIntent(history?: ConversationTurn[]): IntentId | null {
  if (!history) return null
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].role === 'user' && history[i].intent) return history[i].intent as IntentId
  }
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].intent) return history[i].intent as IntentId
  }
  return null
}

function recoverPilotUnknown(q: string, entities: string[]): IntentResult | null {
  const t = q.toLowerCase()
  if (/missing|no\s*info|record\s*not|e\s*dey\s*show|no\s*dey\s*work|wahala.*(portal|nelfund)/i.test(t)) {
    return {
      intent: 'missing-information',
      confidence: 0.7,
      topics: ['missing information'],
      problem: 'Portal shows missing or no school information',
      stage: 'applying',
      entities,
      isTroubleshooting: true,
    }
  }
  if (/pending|still\s*wait|nothing\s*(is\s*)?happen|status\s*no\s*dey/i.test(t)) {
    return {
      intent: 'pending-application',
      confidence: 0.7,
      topics: ['pending'],
      problem: 'Application is still pending',
      stage: 'waiting',
      entities,
      isTroubleshooting: true,
    }
  }
  if (/bvn|expire|deadline|when\s*will|open\s*now|still\s*open|2026|2027/i.test(t)) {
    return {
      intent: 'current-information',
      confidence: 0.72,
      topics: ['current', 'deadline'],
      problem: 'Current or time-sensitive NELFUND information',
      stage: 'exploring',
      entities,
      isTroubleshooting: false,
    }
  }
  if (/upkeep|20k|allowance|disburse|when\s*will\s*i\s*(get|receive)/i.test(t)) {
    return {
      intent: 'upkeep',
      confidence: 0.7,
      topics: ['upkeep'],
      problem: 'Upkeep allowance amount or access',
      stage: 'exploring',
      entities,
      isTroubleshooting: false,
    }
  }
  if (/jamb/i.test(t)) {
    return {
      intent: 'jamb-verification',
      confidence: 0.68,
      topics: ['jamb'],
      problem: 'JAMB registration number rejected or not verifying',
      stage: 'applying',
      entities,
      isTroubleshooting: true,
    }
  }
  if (/upload|school.*(submit|sent)|know\s*if\s*(my\s*)?school/i.test(t)) {
    return {
      intent: 'institution-verification',
      confidence: 0.68,
      topics: ['upload'],
      problem: 'Whether institution has uploaded student record to NELFUND',
      stage: 'waiting',
      entities,
      isTroubleshooting: true,
    }
  }
  if (/how\s*(to|do\s*i)\s*apply|register|start\s*application/i.test(t)) {
    return {
      intent: 'how-to-apply',
      confidence: 0.68,
      topics: ['apply'],
      problem: 'How to apply for NELFUND',
      stage: 'preparing',
      entities,
      isTroubleshooting: false,
    }
  }
  if (/what\s*is\s*nelfund|wetin\s*be\s*nelfund|about\s*nelfund|how\s*did\s*nelfund|history\s*of\s*nelfund/i.test(t)) {
    return {
      intent: 'what-is-nelfund',
      confidence: 0.7,
      topics: ['what is'],
      problem: 'What NELFUND is',
      stage: 'exploring',
      entities,
      isTroubleshooting: false,
    }
  }
  if (/latest\s*nelfund|still\s*accepting|accepting\s*applications?/i.test(t)) {
    return {
      intent: 'current-information',
      confidence: 0.75,
      topics: ['current', 'latest'],
      problem: 'Current or time-sensitive NELFUND information',
      stage: 'exploring',
      entities,
      isTroubleshooting: false,
    }
  }
  if (/bank\s*details|bank\s*account.*(reject|fail)/i.test(t)) {
    return {
      intent: 'bank-information',
      confidence: 0.75,
      topics: ['bank'],
      problem: 'Bank details or BVN steps',
      stage: 'applying',
      entities,
      isTroubleshooting: true,
    }
  }
  if (/login|portal\s*link|which\s*(site|link)|forgot\s*password|reset\s*password/i.test(t)) {
    return {
      intent: 'portal-login',
      confidence: 0.68,
      topics: ['login'],
      problem: 'Official link to login or continue an existing application',
      stage: 'applying',
      entities,
      isTroubleshooting: false,
    }
  }
  if (/create\s*(?:[\w']+\s+){0,3}account|account\s*creation|sign\s*up|i\s*want\s*to\s*apply|help\s*me\s*apply/i.test(t)) {
    return {
      intent: 'how-to-apply',
      confidence: 0.7,
      topics: ['apply'],
      problem: 'How to apply for NELFUND',
      stage: 'preparing',
      entities,
      isTroubleshooting: false,
    }
  }
  if (/when\s*will.*(money|pay|disburse)|money\s*(never|no)\s*(enter|come)|dem\s*never\s*pay/i.test(t)) {
    return {
      intent: 'upkeep',
      confidence: 0.7,
      topics: ['upkeep', 'disbursement'],
      problem: 'Upkeep allowance amount or access',
      stage: 'exploring',
      entities,
      isTroubleshooting: false,
    }
  }
  if (/under\s*review|approval\s*status|not\s*yet\s*approv/i.test(t)) {
    return {
      intent: 'pending-application',
      confidence: 0.72,
      topics: ['pending'],
      problem: 'Application is still pending',
      stage: 'waiting',
      entities,
      isTroubleshooting: true,
    }
  }
  if (/hello|hi\b|good\s*(morning|afternoon|evening)|abeg|help\s*me|i\s*need\s*help|wetin|please\s*help/i.test(t) && t.length < 48) {
    return {
      intent: 'how-to-apply',
      confidence: 0.55,
      topics: ['greeting', 'help'],
      problem: 'How to apply for NELFUND',
      stage: 'preparing',
      entities,
      isTroubleshooting: false,
    }
  }
  return null
}

export function classifyIntent(question: string, history?: ConversationTurn[]): IntentResult {
  const raw = question.trim()
  if (!raw) {
    return {
      intent: 'unknown',
      confidence: 0,
      topics: [],
      problem: null,
      stage: 'unknown',
      entities: [],
      isTroubleshooting: false,
    }
  }
  const q = expandWithContext(raw, history)
  const entities = detectEntities(q)

  if (isLoanCounterNoise(q)) {
    return {
      intent: 'current-information',
      confidence: 0.8,
      topics: ['dashboard', 'portal'],
      problem: 'Portal dashboard or registration notice',
      stage: 'applying',
      entities: Array.from(new Set([...entities, 'portal'])),
      isTroubleshooting: false,
    }
  }

  if (/\bbvn\b/i.test(q) && /(expire|deadline|registr|account|apply|when|yet|don'?t|dont|no\s*bvn)/i.test(q)) {
    return {
      intent: 'current-information',
      confidence: 0.92,
      topics: ['bvn', 'deadline', 'registration'],
      problem: 'BVN timing vs registration / application window',
      stage: 'preparing',
      entities: Array.from(new Set([...entities, 'bvn'])),
      isTroubleshooting: false,
    }
  }

  let best: { rule: IntentRule; hits: number } | null = null
  for (const rule of RULES) {
    let hits = 0
    for (const pattern of rule.patterns) {
      try {
        if (pattern.test(q)) hits += 1
      } catch {
        /* ignore */
      }
    }
    if (hits === 0) continue
    const score = hits * rule.weight
    if (!best || score > best.hits * best.rule.weight) best = { rule, hits }
  }
  if (best) {
    const conf = Math.min(0.95, 0.55 + best.hits * 0.12 + best.rule.weight * 0.02)
    return {
      intent: best.rule.intent,
      confidence: conf,
      topics: best.rule.topics,
      problem: best.rule.problem,
      stage: best.rule.stage,
      entities: Array.from(new Set([...entities, ...best.rule.entities])),
      isTroubleshooting: best.rule.troubleshooting,
    }
  }

  const prev = lastUserIntent(history)
  if (prev && prev !== 'unknown' && raw.length < 48) {
    return {
      intent: prev,
      confidence: 0.55,
      topics: ['follow-up'],
      problem: null,
      stage: 'unknown',
      entities,
      isTroubleshooting: false,
    }
  }

  const recovered = recoverPilotUnknown(q, entities)
  if (recovered) return recovered

  const lower = q.toLowerCase()
  if (lower.includes('nelfund') && (lower.includes('what') || lower.includes('mean'))) {
    return {
      intent: 'what-is-nelfund',
      confidence: 0.55,
      topics: ['what is', 'nelfund'],
      problem: 'What NELFUND is',
      stage: 'exploring',
      entities,
      isTroubleshooting: false,
    }
  }
  return {
    intent: 'unknown',
    confidence: 0.2,
    topics: q
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 2)
      .slice(0, 8),
    problem: null,
    stage: 'unknown',
    entities,
    isTroubleshooting: false,
  }
}
