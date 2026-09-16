/** Replace Unicode long dashes so student-facing copy stays comma/hyphen/colon clean. */
const LONG_DASH = /[\u2010\u2011\u2012\u2013\u2014\u2015\u2212\uFE58\uFE63\uFF0D]/g

export function stripLongDashes(input: string): string {
  return (input || '').replace(LONG_DASH, '-')
}

type AnswerLike = {
  answer: string
  whatThisMeans?: string | null
  nextActions: string[]
  clarifyingQuestions: string[]
  insufficientReason?: string | null
  draft?: { subject: string; body: string }
}

/** Keep grounded / AI answers free of em and en dashes. */
export function sanitizeGroundedAnswer<T extends AnswerLike>(answer: T): T {
  return {
    ...answer,
    answer: stripLongDashes(answer.answer),
    whatThisMeans:
      answer.whatThisMeans == null ? answer.whatThisMeans : stripLongDashes(answer.whatThisMeans),
    nextActions: (answer.nextActions || []).map(stripLongDashes),
    clarifyingQuestions: (answer.clarifyingQuestions || []).map(stripLongDashes),
    insufficientReason:
      answer.insufficientReason == null
        ? answer.insufficientReason
        : stripLongDashes(answer.insufficientReason),
    draft: answer.draft
      ? {
          subject: stripLongDashes(answer.draft.subject),
          body: stripLongDashes(answer.draft.body),
        }
      : answer.draft,
  }
}
