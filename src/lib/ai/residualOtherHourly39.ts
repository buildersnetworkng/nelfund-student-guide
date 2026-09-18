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

/**
 * Hour-39 leftover catcher: admin other=324 still the largest unknown bucket.
 * Level/final year, PG, wallet banks, OTP, approved-no-pay, already-paid fees,
 * sibling apply, NYSC serving, vocational, screenshot dumps.
 */
export function residualOtherHourly39(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null

  if (
    /wetin\s*(be|na)\s*(nelfund|dis|this)|nelfund\s*(na\s*)?wetin|why\s*(dem|una|fg|they)\s*(create|form|bring|start)\s*(nelfund|am|dis\s*loan)|purpose\s*of\s*(the\s*)?(loan|scheme|nelfund)|what\s*is\s*nelfund\s*for/i.test(
      q,
    )
  ) {
    return hit('what-is-nelfund', 0.91, ['what-is', 'other'], 'Purpose leftover 39', 'exploring', entities)
  }

  if (
    /\b(100|200|300|400|500)\s*level\b|final\s*year|fresher|freshman|i\s*(just|don)\s*(gain|got)\s*admission|direct\s*entry|\bde\s*student\b/i.test(
      q,
    )
  ) {
    return hit('eligibility', 0.86, ['other', 'eligibility'], 'Level / admission leftover 39', 'exploring', entities)
  }

  if (
    /post\s*graduate|\bmasters?\b|\bmsc\b|\bphd\b|doctorate|pgd\b|i\s*(wan|want)\s*(do|apply)\s*(msc|phd|masters)/i.test(
      q,
    )
  ) {
    return hit('eligibility', 0.88, ['other', 'eligibility'], 'PG leftover 39', 'exploring', entities)
  }

  if (
    /\b(opay|palmpay|moniepoint|kuda|fairmoney)\b|wallet\s*(account|no|not)|fintech\s*account|virtual\s*account/i.test(
      q,
    )
  ) {
    return hit('bank-information', 0.9, ['other'], 'Wallet bank leftover 39', 'applying', entities, true)
  }

  if (
    /\botp\b|one\s*time\s*password|code\s*(no|not|never)\s*(come|enter|dey)|verification\s*code\s*(no|not)/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.88, ['other', 'login'], 'OTP leftover 39', 'applying', entities, true)
  }

  if (
    /already\s*paid\s*(my\s*)?(school\s*)?fees|i\s*(don|have)\s*pay\s*(school\s*)?fees|refund\s*(my\s*)?fees|school\s*go\s*refund/i.test(
      q,
    )
  ) {
    return hit('refund', 0.9, ['other'], 'Already paid fees leftover 39', 'waiting', entities, true)
  }

  if (
    /approved\s*(but|and)\s*(no|never|money)|dem\s*approve\s*(but|am)|status\s*(na|is)\s*approved|i\s*don\s*approve/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.88, ['pending-status', 'other'], 'Approved no pay leftover 39', 'waiting', entities, true)
  }

  if (
    /my\s*(brother|sister|sibling|cousin|friend)\s*(wan|want|fit|can)\s*apply|use\s*(my\s*)?(brother|sister|friend)\s*(email|nin|bvn)/i.test(
      q,
    )
  ) {
    return hit('eligibility', 0.84, ['other'], 'Sibling apply leftover 39', 'exploring', entities)
  }

  if (/\bnysc\b|i\s*(dey|am)\s*serving|service\s*year|passing\s*out/i.test(q)) {
    if (/repay|pay\s*back|deduct/i.test(q)) {
      return hit('repayment', 0.88, ['repayment', 'other'], 'NYSC repay leftover 39', 'repaying', entities)
    }
    return hit('eligibility', 0.84, ['other'], 'NYSC leftover 39', 'exploring', entities)
  }

  if (/vocational|nabteb|nce\b|college\s*of\s*education|polytechnic\s*(fit|can)|innovation\s*enterprise/i.test(q)) {
    return hit('eligibility', 0.86, ['other', 'eligibility'], 'Vocational leftover 39', 'exploring', entities)
  }

  if (/batch\s*(1|2|one|two)|which\s*batch|next\s*batch/i.test(q)) {
    return hit('current-information', 0.84, ['open-status', 'other'], 'Batch leftover 39', 'applying', entities)
  }

  if (/error\s*500|internal\s*server|page\s*(no|not)\s*load|portal\s*(hang|freeze|down)/i.test(q)) {
    return hit('portal-login', 0.86, ['other', 'login'], 'Portal down leftover 39', 'applying', entities, true)
  }

  if (/check\s*(this|am)\s*(screenshot|photo|pic)|see\s*(my\s*)?(screenshot|picture)|wetin\s*(this|dis)\s*mean/i.test(q)) {
    if (/pending|under\s*review|processing/i.test(q)) {
      return hit('pending-application', 0.86, ['pending-status', 'other'], 'Screenshot pending leftover 39', 'waiting', entities, true)
    }
    if (/invalid\s*jamb|jamb/i.test(q)) {
      return hit('jamb-verification', 0.86, ['jamb', 'other'], 'Screenshot jamb leftover 39', 'applying', entities, true)
    }
    return hit('missing-information', 0.72, ['other'], 'Screenshot dump leftover 39', 'applying', entities, true)
  }

  if (/change\s*(of\s*)?(course|programme|program)|i\s*change\s*course/i.test(q)) {
    return hit('missing-information', 0.84, ['missing-info', 'other'], 'Change course leftover 39', 'applying', entities, true)
  }

  return null
}
