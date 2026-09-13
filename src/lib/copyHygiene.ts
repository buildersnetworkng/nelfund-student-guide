/** Replace Unicode long dashes so student-facing copy stays comma/hyphen/colon clean. */
const LONG_DASH = /[\u2010\u2011\u2012\u2013\u2014\u2015\u2212\uFE58\uFE63\uFF0D]/g

export function stripLongDashes(input: string): string {
  return (input || '').replace(LONG_DASH, '-')
}
