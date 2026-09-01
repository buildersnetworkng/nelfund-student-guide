const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'

/** Level-aware eligibility + document checklist. */
export function eligibilityAnswer(ctx: { userText?: string | null }): string {
  const raw = (ctx.userText || '').toLowerCase()
  const levelMatch =
    raw.match(/\b(\d{2,3})\s*-?\s*level\b/) || raw.match(/\byear\s*(one|1|two|2|three|3|four|4|five|5)\b/)
  let levelLabel = 'your level'
  if (levelMatch) {
    const g = levelMatch[1]
    if (/^\d+$/.test(g)) levelLabel = `${g}-level`
    else {
      const map: Record<string, string> = {
        one: '100-level',
        '1': '100-level',
        two: '200-level',
        '2': '200-level',
        three: '300-level',
        '3': '300-level',
        four: '400-level',
        '4': '400-level',
        five: '500-level',
        '5': '500-level',
      }
      levelLabel = map[g] || 'your level'
    }
  } else if (/fresher|freshman|new\s*student|just\s*admitted|newly\s*admitted/.test(raw)) {
    levelLabel = '100-level / newly admitted'
  }
  const levelLine =
    levelLabel === 'your level'
      ? '• **Full-time** students with valid admission (any level — 100, 200, 300, etc.)'
      : `• **Full-time** students with valid admission — **${levelLabel}** is covered`
  const levelNote =
    levelLabel === 'your level'
      ? `Your **year of study does not by itself** block you.`
      : `Being **${levelLabel}** does **not** by itself block you.`
  return (
    `**Eligibility (official FAQ)**\n\n` +
    `• Nigerian citizen\n` +
    `• Admission into a **public** university, polytechnic, college of education, or vocational school\n` +
    `${levelLine}\n\n` +
    `**Before you apply, confirm you have all required details ready:**\n` +
    `• **Matriculation number** (very important — your school must have issued and uploaded it)\n` +
    `• JAMB registration number\n` +
    `• NIN\n` +
    `• BVN and your own bank account details\n` +
    `• Admission letter / proof of admission\n` +
    `• Name and date of birth matching across NIN, JAMB, and school records\n\n` +
    `${levelNote} What blocks many students is **missing or unmatched school data** — especially **matric number** not yet on the portal.\n\n` +
    `If matric is not ready, ask your school ICT / Registry / NELFUND desk to upload your record first, then retry ${PORTAL}.\n\n` +
    `Exact checklist for the open cycle: ${PORTAL} · ${SITE}\n\n` +
    `This guide does not invent individual approval decisions.`
  )
}
