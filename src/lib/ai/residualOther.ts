import type { IntentId, IntentResult } from './types'

function hit(
  intent: IntentId,
  confidence: number,
  topics: string[],
  problem: string,
  stage: IntentResult['stage'],
  entities: string[],
  isTroubleshooting = false,
): IntentResult {
  return { intent, confidence, topics, problem, stage, entities, isTroubleshooting }
}

function liveish(q: string): boolean {
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close/i.test(q)
}

/** Extra leftover routes for the admin unknown topic bucket `other`. */
export function residualOtherRoute(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null

  if (/\bgsi\b|global\s*standing\s*instruction|standing\s*order|auto[\s-]*debit/i.test(q)) {
    return hit('gsi', 0.86, ['repayment', 'gsi'], 'GSI / standing instruction', 'repaying', entities)
  }
  if (/life\s*imprison|prison|jail|go\s*gaol|go\s*jail|criminal\s*(case|charge)|police\s*go\s*arrest/i.test(q)) {
    return hit('repayment', 0.86, ['repayment', 'penalty-rumour'], 'Penalty / imprisonment rumour', 'repaying', entities)
  }
  if (/refund|dem\s*go\s*return\s*(my\s*)?(school\s*)?fee|get\s*(my\s*)?money\s*back|reimburse/i.test(q)) {
    return hit('refund', 0.8, ['refund', 'fees'], 'Refund after self-pay', 'waiting', entities, true)
  }
  if (/already\s*paid\s*(my\s*)?(school\s*)?fee|i\s*(don|have)\s*pay\s*(school\s*)?fee|self[\s-]*pay|paid\s*from\s*pocket|i\s*pay\s*school\s*fee\s*(myself|already)/i.test(q)) {
    return hit('refund', 0.82, ['refund', 'already-paid'], 'Already paid school fees leftover', 'waiting', entities, true)
  }
  if (/no\s*matric|don.?t\s*have\s*(a\s*)?matric|without\s*matric|admission\s*letter\s*only/i.test(q)) {
    return hit('documents-needed', 0.82, ['documents', 'matric'], 'No matric number yet', 'preparing', entities)
  }
  if (/without\s*jamb|no\s*jamb|don.?t\s*have\s*(a\s*)?jamb|apply\s*without\s*utme/i.test(q)) {
    return hit('jamb-verification', 0.8, ['jamb'], 'Apply without JAMB leftover', 'preparing', entities, true)
  }
  if (/2025\s*\/\s*2026|2024\s*\/\s*2025|this\s*academic\s*session|which\s*session/i.test(q) && !liveish(q)) {
    return hit('academic-session', 0.8, ['session'], 'Which academic session leftover', 'preparing', entities)
  }
  if (/apply\s*again|re-?apply|second\s*round|renew\s*(the\s*)?loan/i.test(q) && !liveish(q)) {
    return hit('reapplication', 0.8, ['how-to-apply', 'reapply'], 'Re-apply / next session leftover', 'preparing', entities)
  }
  if (/vocational|skills?\s*acquisition|innovation\s*enterprise|iea|monotechnic/i.test(q)) {
    return hit('eligibility', 0.8, ['eligibility', 'vocational'], 'Vocational / skills school leftover', 'exploring', entities)
  }
  if (/two\s*account|dual\s*account|second\s*account|i\s*create\s*(another|two)|double\s*registration/i.test(q)) {
    return hit('portal-login', 0.82, ['login', 'dual-account'], 'Two accounts leftover', 'applying', entities, true)
  }
  if (/edit\s*(my\s*)?(profile|name|dob|date\s*of\s*birth)|change\s*(my\s*)?(name|phone|email|profile)|wrong\s*(name|dob|date\s*of\s*birth)/i.test(q)) {
    return hit('profile-update', 0.84, ['profile'], 'Profile edit leftover', 'applying', entities, true)
  }
  if (/how\s*(do\s*i|to|i\s*go)\s*contact|complain|open\s*(a\s*)?ticket|esupport|official\s*email|customer\s*care|helpline/i.test(q)) {
    return hit('contact-support', 0.86, ['contact'], 'Contact / ticket leftover', 'waiting', entities)
  }
  if (/when\s*(will|go)\s*(they|dem|una|nelfund)?\s*(pay|send|disburse)|how\s*long\s*(does|go)\s*(approval|disburse|pay)|pay\s*date|disbursement\s*date/i.test(q) && !liveish(q)) {
    return hit('pending-application', 0.82, ['pending-status', 'pay-date'], 'When will they pay leftover', 'waiting', entities, true)
  }
  if (/name\s*(no|not|never)\s*(match|gree)|bvn\s*(no|not|never)\s*match|nin\s*(no|not|never)\s*match|data\s*mismatch/i.test(q)) {
    return hit('nin-verification', 0.82, ['nin', 'bvn'], 'Name / NIN / BVN mismatch leftover', 'applying', entities, true)
  }
  if (/^(abeg(\s*check(\s*am)?)?|check\s*am|look\s*am|una\s*don\s*pay|don\s*pay\s*\??)[.!? ]*$/i.test(q)) {
    return hit('pending-application', 0.7, ['pending-status'], 'Short pidgin check / pay ask', 'waiting', entities, true)
  }
  if (/e\s*no\s*(move|change|dey\s*move)|application\s*(still|dey)\s*(there|there\s*so|pending)|status\s*(still|dey)\s*(the\s*same|same|pending)|nothing\s*(don|has)\s*happen|no\s*update/i.test(q)) {
    return hit('pending-application', 0.84, ['pending-status', 'no-move'], 'Status not moving leftover', 'waiting', entities, true)
  }
  if (/\b(third|3rd|fourth|4th|first|second)\s*batch\b|\bbatch\s*[1-9]\b|which\s*batch|una\s*don\s*pay\s*(my\s*)?school|school\s*(don|has)\s*(collect|receive)/i.test(q) && !liveish(q)) {
    return hit('pending-application', 0.84, ['pending-status', 'batch'], 'Batch / school already paid leftover', 'waiting', entities, true)
  }
  if (/otp\s*(no|not|never)|no\s*otp|otp\s*(no|not)\s*(dey|come|enter|arrive)|one[\s-]*time\s*(pin|password)\s*(no|not)/i.test(q)) {
    return hit('portal-login', 0.84, ['login', 'otp'], 'OTP not arriving leftover', 'applying', entities, true)
  }
  if (/institution(al)?\s*verif|school\s*(data|record)\s*(no|not|never)|upload\s*(my\s*)?(data|record)|school\s*never\s*verify/i.test(q)) {
    return hit('institution-verification', 0.84, ['missing', 'institution-verification'], 'School / institution verification leftover', 'applying', entities, true)
  }
  if (/wallet|opay|palmpay|moniepoint|virtual\s*account|fintech\s*account/i.test(q) && /bank|account|upkeep|alert|pay/i.test(q)) {
    return hit('bank-information', 0.82, ['bank', 'wallet'], 'Wallet vs bank leftover', 'preparing', entities, true)
  }
  if (/\b(declin(ed|e)|reject(ed)?|unsuccessful)\b/i.test(q) && !liveish(q)) {
    return hit('rejected-application', 0.84, ['pending-status', 'declined'], 'Declined / rejected leftover', 'rejected', entities, true)
  }
  if (/noun|national\s*open\s*university|part[\s-]*time|weekend\s*programme/i.test(q) && /eligib|qualify|fit\s*apply|can\s*(i|we)\s*apply/i.test(q)) {
    return hit('eligibility', 0.82, ['eligibility', 'noun'], 'NOUN / part-time leftover', 'exploring', entities)
  }
  if (/guarantor|surety|who\s*(go|will)\s*stand/i.test(q)) {
    return hit('guarantor', 0.82, ['guarantor'], 'Guarantor leftover', 'preparing', entities)
  }
  if (/change\s*(my\s*)?(bank|account)|wrong\s*(bank\s*)?account|update\s*(my\s*)?(bank|account)/i.test(q)) {
    return hit('bank-information', 0.84, ['bank'], 'Bank change leftover', 'preparing', entities, true)
  }
  if (/change\s*(of\s*)?(institution|school)|i\s*(don|have)\s*transfer|transfer(red)?\s*(to|from)\s*(another|new)\s*school|new\s*school\s*(no|not)\s*(dey|show)/i.test(q)) {
    return hit('school-not-found', 0.84, ['missing', 'change-school'], 'Change of institution leftover', 'applying', entities, true)
  }
  if (/session\s*(no|not|never)\s*(dey|show|appear)|no\s*session|cannot\s*see\s*session|request\s*(for\s*)?(student\s*)?loan\s*(button)?\s*(no|not|never)|button\s*(no|not)\s*(dey|show)/i.test(q)) {
    return hit('missing-information', 0.84, ['missing', 'session-button'], 'Session / apply button missing leftover', 'applying', entities, true)
  }
  if (/verif(y|ication)\s*(mail|email)|email\s*(no|not|never)\s*(come|drop|enter|arrive)|no\s*(verification\s*)?(mail|email)|didn'?t\s*get\s*(the\s*)?(mail|email)/i.test(q)) {
    return hit('portal-login', 0.84, ['login', 'email'], 'Verification email leftover', 'applying', entities, true)
  }
  if (/\binterest\b|interest[\s-]*free|dem\s*dey\s*charge\s*interest|is\s*it\s*free\s*loan/i.test(q) && !liveish(q)) {
    return hit('loan-or-scholarship', 0.84, ['loan', 'interest'], 'Interest / free-loan leftover', 'exploring', entities)
  }
  if (/\bnysc\b|after\s*(service|youth\s*service)|when\s*(do|go)\s*i\s*(start\s*)?pay/i.test(q) && !liveish(q)) {
    return hit('repayment', 0.84, ['repayment', 'nysc'], 'NYSC / when repayment starts leftover', 'repaying', entities)
  }
  if (/i\s*(don|have)\s*(graduate|finish(\s*school)?)|already\s*graduate|alumni|i\s*don\s*pass\s*out/i.test(q) && !/pending|how\s*far/i.test(q)) {
    return hit('eligibility', 0.84, ['eligibility', 'graduate'], 'Already graduated leftover', 'exploring', entities)
  }
  if (/phone\s*number|nelfund\s*number|call\s*nelfund|wetin\s*be\s*(una|their)\s*number/i.test(q)) {
    return hit('contact-support', 0.84, ['contact', 'phone'], 'Phone / call leftover', 'waiting', entities)
  }
  if (/invalid\s*(bvn|nin)|(bvn|nin)\s*(invalid|fail|reject|no\s*gree)|verify\s*(my\s*)?(bvn|nin)/i.test(q)) {
    return hit('nin-verification', 0.86, ['nin', 'bvn'], 'Invalid BVN / NIN leftover', 'applying', entities, true)
  }
  if (/when\s*(dem|they|una)\s*(go|will)\s*pay|una\s*don\s*pay|dem\s*don\s*pay|e\s*never\s*(show|reflect)|alert\s*never\s*(enter|drop)|no\s*alert/i.test(q)) {
    return hit('pending-application', 0.84, ['pending-status', 'payout'], 'When will they pay / no alert leftover', 'waiting', entities, true)
  }
  if (/i\s*don\s*(submit|apply|register|fill)|application\s*(don|has)\s*(go|submit)|i\s*don\s*finish\s*(am|the\s*form)/i.test(q) && !liveish(q)) {
    return hit('pending-application', 0.8, ['pending-status', 'submitted'], 'Already submitted leftover', 'waiting', entities, true)
  }
  if (/^(nelfund|dis\s*loan|the\s*loan|student\s*loan)[.!? ]*$/i.test(q) || /tell\s*me\s*(about\s*)?(nelfund|dis\s*loan)|explain\s*(nelfund|dis\s*loan)/i.test(q)) {
    return hit('what-is-nelfund', 0.78, ['what-is', 'other'], 'Bare NELFUND / explain leftover', 'exploring', entities)
  }
  if (/^(apply|i\s*wan\s*apply|help\s*me\s*apply|guide\s*me)[.!? ]*$/i.test(q) || /wetin\s*i\s*go\s*do\s*now|how\s*i\s*go\s*take\s*start/i.test(q)) {
    return hit('how-to-apply', 0.78, ['how-to-apply', 'other'], 'Bare apply / what next leftover', 'preparing', entities)
  }
  if (/^(unilag|lasu|oou|yabatech|unilorin|ui|oau|uniben|futa|futo|abu|noun|nou)[.!? ]*$/i.test(q)) {
    return hit('missing-information', 0.6, ['school-list', 'other'], 'School-name-only leftover', 'applying', entities)
  }
  if (/how\s*much|loan\s*amount|maximum\s*(loan|amount)|wetin\s*(dem|they)\s*dey\s*(pay|give)|how\s*many\s*naira|una\s*dey\s*pay\s*how\s*much/i.test(q) && !liveish(q)) {
    if (/\bupkeep\b|stipend|allowance|20,?000/.test(q) && !/school\s*fees|tuition|institutional/.test(q)) {
      return hit('upkeep', 0.84, ['upkeep', 'amount'], 'How much upkeep leftover', 'exploring', entities)
    }
    if (/school\s*fees|tuition|institutional/.test(q) && !/\bupkeep\b/.test(q)) {
      return hit('school-fees', 0.84, ['fees', 'amount'], 'How much school fees leftover', 'exploring', entities)
    }
    return hit('loan-or-scholarship', 0.78, ['loan', 'amount', 'other'], 'How much is the loan leftover', 'exploring', entities)
  }
  if (/hostel|accommodation|accomodation|house\s*rent|where\s*(i|to)\s*(go\s*)?stay|school\s*lodge/i.test(q)) {
    return hit('upkeep', 0.82, ['upkeep', 'hostel'], 'Hostel / rent leftover', 'exploring', entities)
  }
  if (/foreign\s*student|international\s*student|non[\s-]*nigerian|i\s*be\s*foreigner|not\s*a\s*nigerian/i.test(q)) {
    return hit('eligibility', 0.86, ['eligibility', 'foreign'], 'Foreign student leftover', 'exploring', entities)
  }
  if (/\b(masters?|msc|mba|post\s*graduate|postgraduate|pgd)\b/i.test(q) && !liveish(q) && !/pending|how\s*far/.test(q)) {
    return hit('eligibility', 0.84, ['eligibility', 'postgrad'], 'Postgraduate leftover', 'exploring', entities)
  }
  if (/freshers?|100\s*level|\b100l\b|nd\s*1|year\s*one|first\s*year|can\s*(a\s*)?(fresher|100l|year\s*1)/i.test(q) && !liveish(q)) {
    return hit('eligibility', 0.84, ['eligibility', 'level'], 'Fresher / 100L leftover', 'exploring', entities)
  }
  if (/application\s*id|loan\s*id|reference\s*number|where\s*(is|dey)\s*(my\s*)?(id|number)/i.test(q) && !liveish(q)) {
    return hit('pending-application', 0.78, ['pending-status', 'app-id'], 'Application ID leftover', 'waiting', entities, true)
  }
  if (/wetin\s*i\s*go\s*(gain|benefit|collect|see)|what\s*(do\s*i|will\s*i)\s*(get|gain|benefit)|benefit\s*of\s*(the\s*)?(loan|nelfund)/i.test(q) && !liveish(q)) {
    return hit('what-is-nelfund', 0.8, ['what-is', 'benefit'], 'What do I get leftover', 'exploring', entities)
  }
  if (/can\s*i\s*apply\s*now|i\s*wan(t)?\s*apply\s*now|apply\s*today|start\s*application\s*now/i.test(q) && liveish(q)) {
    return hit('current-information', 0.86, ['open-status'], 'Apply now / live window leftover', 'exploring', entities)
  }
  if (/how\s*long|how\s*many\s*(days|weeks|months)|processing\s*time|take\s*(how\s*)?long|when\s*go\s*dem\s*finish/i.test(q) && !liveish(q)) {
    return hit('pending-application', 0.82, ['pending-status', 'sla'], 'How long processing leftover', 'waiting', entities, true)
  }
  if (/part[\s-]*time|sandwich\s*programme|distance\s*learning|weekend\s*programme/i.test(q) && !liveish(q)) {
    return hit('eligibility', 0.84, ['eligibility', 'part-time'], 'Part-time / sandwich leftover', 'exploring', entities)
  }
  if (/private\s*(uni|university|poly|school|campus)/i.test(q) && !liveish(q)) {
    return hit('eligibility', 0.86, ['eligibility', 'private'], 'Private institution leftover', 'exploring', entities)
  }
  if (/\b(hnd|nd\b|nce)\b|higher\s*national\s*diploma|ordinary\s*national\s*diploma/i.test(q) && !liveish(q) && !/pending|how\s*far/.test(q)) {
    return hit('eligibility', 0.82, ['eligibility', 'nd-hnd'], 'ND / HND leftover', 'exploring', entities)
  }
  if (/parent\s*(fit|can|wan)|my\s*(papa|mama|parent)s?\s*(fit|can)\s*apply|apply\s*for\s*(my\s*)?(child|son|daughter)/i.test(q)) {
    return hit('how-to-apply', 0.78, ['how-to-apply', 'parent'], 'Parent applying leftover', 'preparing', entities)
  }
  if (/change\s*(of\s*)?course|i\s*(don|have)\s*change\s*(my\s*)?course|new\s*department/i.test(q)) {
    return hit('profile-update', 0.8, ['profile', 'course'], 'Change of course leftover', 'applying', entities, true)
  }
  if (/una\s*email|nelfund\s*email|which\s*mail\s*(i|to)\s*send|contact\s*email/i.test(q)) {
    return hit('contact-support', 0.84, ['contact', 'email'], 'Email contact leftover', 'waiting', entities)
  }
  if (/wetin\s*dey\s*happen|i\s*no\s*understand|make\s+you\s+guide\s+me|explain\s+am\s+small|break\s+am\s+down/i.test(q)) {
    return hit('official-sources', 0.7, ['guidance'], 'Vague help leftover', 'exploring', entities)
  }
  return null
}
