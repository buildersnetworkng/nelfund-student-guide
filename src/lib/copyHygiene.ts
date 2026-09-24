/**
 * Light copy hygiene for student-facing answers.
 */
import type { GroundedAnswer } from './ai/types'

/** Replace em/en dashes that render poorly on some devices. */
export function stripLongDashes(text: string): string {
  if (!text) return text
  return text.replace(/[\u2013\u2014\u2015]/g, '-').replace(/\u2026/g, '...')
}

/** Sanitize grounded answer text for safe display. */
export function sanitizeGroundedAnswer(answer: GroundedAnswer): GroundedAnswer {
  if (!answer) return answer
  return {
    ...answer,
    answer: stripLongDashes(answer.answer || ''),
    whatThisMeans: answer.whatThisMeans ? stripLongDashes(answer.whatThisMeans) : answer.whatThisMeans,
    nextActions: [], // never show 'What to do next' URL lists
    clarifyingQuestions: (answer.clarifyingQuestions || []).map(stripLongDashes),
  }
}
