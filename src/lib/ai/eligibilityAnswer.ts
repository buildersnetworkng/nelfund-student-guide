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
      ? '• **Full-time** students with valid admission (any level: 100, 200, 300, etc.)'
      : `• **Full-time** students with valid admission: **${levelLabel}** is covered`
  const levelNote =
    levelLabel === 'your level'
      ? `Your **year of study does not by itself** block you.`
      : `Being **${levelLabel}** does **not** by itself block you.`
  const typeNote = /parent(s)?\s*(fit|can|wan)\s*apply|apply\s*for\s*(my\s*)?(child|son|daughter)|guardian\s*apply|i\s*be\s*parent/.test(raw)
    ? 'The portal account is for the **student**. A parent can help gather NIN / BVN / JAMB details, but do not create a parent-only profile or pay an agent to apply on the child\'s behalf.\n\n'
    : /international\s*student|foreign\s*student|i\s*no\s*be\s*nigerian|not\s*a\s*nigerian/.test(raw)
    ? 'Official FAQ language is **Nigerian citizens** in public tertiary institutions. This chat will not invent a foreign-student exception.\n\n'
    : /private/.test(raw)
    ? 'Private universities/polys are **not** in the current public-institution scheme described on nelf.gov.ng.\n\n'
    : /part[\s-]*time|sandwich|evening\s*(programme|program|student)|weekend\s*(programme|program)|distance\s*learn|\bodl\b/.test(raw)
      ? 'Official FAQ language is **full-time** students in public tertiary institutions. This chat will **not invent** a part-time, sandwich, evening, or distance-learning exception. Confirm the live portal list only.\n\n'
      : /post\s*grad|postgraduate|masters?|\bmsc\b|\bphd\b|pgd/.test(raw)
        ? 'This chat will not invent a postgraduate / Masters / PhD rule. Confirm whether that cycle is on the official portal before you apply.\n\n'
        : /direct\s*entry|\bde\s*student\b|transfer\s*student/.test(raw)
          ? 'Direct Entry and transfer students still need a **JAMB number** and a school record the institution has uploaded. Confirm on the live portal; do not open a second account if one already exists.\n\n'
        : /no\s*admission|never\s*(get|got|collect)\s*admission|awaiting\s*admission|admission\s*(no|not|never)\s*(dey|ready|come)|defer(red)?\s*admission/.test(raw)
          ? 'Official FAQ language is students with **admission** into a public tertiary institution. If admission is not yet out, wait for the school record and matric upload before treating the portal as ready. This chat will not invent a pre-admission exception.\n\n'
        : /\bijmb\b|\bjupeb\b|a[\s-]*level|pre[\s-]*degree|remedial|preliminary/.test(raw)
          ? 'IJMB, JUPEB, A-level, pre-degree, and remedial programmes are **not** confirmed as standalone NELFUND cycles on the public FAQ. Confirm only if the live portal lists that school and session after a real tertiary admission.\n\n'
        : /i\s*dey\s*nysc|during\s*nysc|serving\s*(now|currently)|corps\s*member/.test(raw)
          ? 'Official FAQ repayment clock is **2 years after NYSC**. Serving now does not automatically open a new student-loan cycle. Confirm any current-student rule on the live portal; do not assume corps members can start a fresh loan here.\n\n'
        : /\bcgpa\b|\bgpa\b|grade\s*point|minimum\s*(grade|score|cgpa)|age\s*limit|how\s*old|maximum\s*age/.test(raw)
          ? 'This chat will not invent a CGPA cut-off or age cap. Official student-facing pages emphasise citizenship, public-institution admission, and matching NIN / JAMB / school data. Confirm any extra field on the live form only.\n\n'
        : /graduate|graduated|finish(ed)?\s*school|don\s*done\s*nysc|no\s*dey\s*school\s*again/.test(raw)
          ? 'NELFUND on the official FAQ is for **current** students in public tertiary institutions. If you have already finished and left school, do not assume a new loan. Confirm any graduate / NYSC-only case on the live portal.\n\n'
        : /\b(coe|college\s*of\s*education|vocational|nce|\bnd\b|\bhnd\b|polytechnic)\b/.test(raw)
          ? 'Public **polytechnics, colleges of education, and vocational schools** are in the official institution types. Private campuses are not.\n\n'
        : /hostel|accommodation|school\s*lodge/.test(raw)
          ? 'Hostel or accommodation is **not** a separate NELFUND product on the public FAQ. Institutional charges go to the school; optional **upkeep** is living money to you if you ticked it in the same application. This chat will not invent a hostel-only loan.\n\n'
        : /hnd\s*(to|2)\s*bsc|top[\s-]*up|conversion/.test(raw)
          ? 'HND-to-BSc / conversion only counts if you have a current **full-time public** admission the school has uploaded, plus a JAMB number. Confirm that programme on the live portal list; do not assume every conversion campus is covered.\n\n'
        : /disab(led|ility)|physically\s*challenged|special\s*need/.test(raw)
          ? 'Official student-facing pages do **not** list a separate disability quota here. Eligibility still turns on citizenship, public-institution admission, and matching NIN / JAMB / school data. Confirm any extra portal field live; do not pay an agent for a “special list”.\n\n'
        : /orphan|indigent|i\s*(dey|am)\s*poor|no\s*sponsor/.test(raw)
          ? 'Need or poverty is **not** a published extra form on nelf.gov.ng. The scheme is an interest-free **loan** for eligible public-institution students, not a hardship grant. Apply only on the official portal if you meet the published checks.\n\n'
        : /state\s*of\s*origin|catchment|indigene|federal\s*character/.test(raw)
          ? 'This chat will not invent a catchment / indigene quota. Official pages emphasise Nigerian citizenship and a public-institution record, not state-of-origin ranking.\n\n'
        : ''
  return (
    `**Eligibility (official FAQ)**\n\n` +
    typeNote +
    `• Nigerian citizen\n` +
    `• Admission into a **public** university, polytechnic, college of education, or vocational school\n` +
    `${levelLine}\n\n` +
    `**Before you apply, confirm you have all required details ready:**\n` +
    `• **Matriculation number** (very important: your school must have issued and uploaded it)\n` +
    `• JAMB registration number\n` +
    `• NIN\n` +
    `• BVN and your own bank account details\n` +
    `• Admission letter / proof of admission\n` +
    `• Name and date of birth matching across NIN, JAMB, and school records\n\n` +
    `${levelNote} What blocks many students is **missing or unmatched school data**, especially **matric number** not yet on the portal.\n\n` +
    `If matric is not ready, ask your school ICT / Registry / NELFUND desk to upload your record first, then retry ${PORTAL}.\n\n` +
    `Exact checklist for the open cycle: ${PORTAL} · ${SITE}\n\n` +
    `This guide does not invent individual approval decisions.`
  )
}
