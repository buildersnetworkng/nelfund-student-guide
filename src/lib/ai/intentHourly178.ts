import type { IntentResult } from './types'

function hit(intent: IntentResult['intent'], problem: string): IntentResult {
  return {
    intent,
    confidence: 0.95,
    topics: ['hourly-178'],
    problem,
    stage: 'exploring',
    entities: [],
    isTroubleshooting: true,
  }
}

export function earlyIntent178(text: string): IntentResult | null {
  const raw = (text || '').trim()
  if (!raw) return null
  if (/draft\s*(an?\s*)?email|write\s*(me\s*)?(an?\s*)?email|compose\s*(an?\s*)?email/i.test(raw)) {
    return hit('email-draft', 'Draft campus email')
  }
  if (/otp|whatsapp\s*(man|agent|guy)|pay\s*(am\s*)?\d|scam|never\s*share/i.test(raw)) {
    return hit('scam-safety', 'OTP / scam safety')
  }
  if (/jamb.{0,24}(fail|invalid|reject)|invalid\s*(jamb|utme)|utme.{0,12}(fail|invalid)/i.test(raw)) {
    return hit('jamb-verification', 'JAMB verification')
  }
  if (
    /school\s*(no|not|never)\s*(dey|show|list)|not\s*on\s*(the\s*)?list|no\s*result\s*found|cannot\s*find\s*(my\s*)?school/i.test(
      raw,
    )
  ) {
    return hit('school-not-found', 'School not listed')
  }
  if (
    /pending|how\s*far\s*(my\s*)?(loan|money)|money\s*never\s*(enter|drop)|wetin\s*dey\s*hold|when\s*(go|will)\s*(money|upkeep)\s*(enter|drop)/i.test(
      raw,
    )
  ) {
    return hit('pending-application', 'Pending / disbursement wait')
  }
  if (
    /how\s*(i\s*go|do\s*i|to)\s*(yarn|reach|contact)|official\s*(email|phone|support)|esupport|help\s*desk/i.test(raw)
  ) {
    return hit('contact-support', 'Official contact')
  }
  if (
    /still\s*(dey\s*)?open|dem\s*don\s*close|can\s*i\s*still\s*apply|application\s*(open|close|window)|deadline|nelfund\s*(currently\s*)?(open|closed)/i.test(
      raw,
    )
  ) {
    return hit('current-information', 'Application window')
  }
  if (/interest[- ]?free|zero\s*interest|does\s*(e|am|it)\s*get\s*interest|interest\s*dey/i.test(raw)) {
    return hit('loan-or-scholarship', 'Interest-free loan')
  }
  if (/loan\s*(or|vs)\s*(scholarship|grant)|na\s*(scholarship|grant|free\s*money)/i.test(raw)) {
    return hit('loan-or-scholarship', 'Loan vs scholarship')
  }
  if (/wetin\s*(i|una)\s*(go|suppose|need)\s*(upload|carry)|which\s*(file|document)|documents?\s*(do\s*i|i\s*)?need/i.test(raw)) {
    return hit('documents-needed', 'Documents')
  }
  return null
}
