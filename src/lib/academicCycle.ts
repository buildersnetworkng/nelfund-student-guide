/**
 * Nigerian tertiary academic session label used for NELFUND cycles.
 * Sessions typically roll in August–September.
 * Example: on 29 Aug 2026 → "2026/2027"
 */
export function getCurrentAcademicCycle(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = date.getMonth() // 0 = Jan … 7 = Aug
  // From August onward, the new session year is current calendar year.
  const startYear = month >= 7 ? year : year - 1
  return `${startYear}/${startYear + 1}`
}

/** Display string used in hero / status chips */
export function getCycleLabel(date: Date = new Date()): string {
  return `${getCurrentAcademicCycle(date)} cycle`
}
