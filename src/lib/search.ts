import { faqs, troubleshootingItems, videos, guides, sources, institutions } from './data'
import type { InformationScope, SearchableEntry, SearchSuggestion } from './types'

// Extends each indexed entry with the same scope fields used everywhere else
// in the app, so search can apply the identical national/institution
// filtering rule instead of a second, separately-maintained implementation.
interface ScopedSearchableEntry extends SearchableEntry {
  scope: InformationScope
  institution_id: string | null
}

// A small hand-rolled search index (no external dependency needed for a
// dataset this size). Each entry carries extra "keywords" so common student
// phrasing ("my nin failed", "how much is upkeep") matches even when it
// doesn't share exact words with the stored title.
function buildIndex(): ScopedSearchableEntry[] {
  const entries: ScopedSearchableEntry[] = []

  for (const f of faqs) {
    entries.push({
      id: f.id,
      type: 'faq',
      title: f.title,
      snippet: f.content,
      keywords: [f.category],
      path: `/faq#${f.id}`,
      scope: f.scope,
      institution_id: f.institution_id,
    })
  }

  for (const t of troubleshootingItems) {
    entries.push({
      id: t.id,
      type: 'troubleshooting',
      title: t.problem,
      snippet: t.what_it_usually_means,
      keywords: [t.category],
      path: `/troubleshooting/${t.id}`,
      scope: t.scope,
      institution_id: t.institution_id,
    })
  }

  for (const v of videos) {
    entries.push({
      id: v.id,
      type: 'video',
      title: v.title,
      snippet: v.description,
      keywords: [v.category],
      path: '/videos',
      scope: v.scope,
      institution_id: v.institution_id,
    })
  }

  for (const g of guides) {
    entries.push({
      id: g.id,
      type: 'guide',
      title: g.title,
      snippet: g.summary,
      keywords: g.steps.map((s) => s.title),
      path: '/apply',
      // The application guide is NELFUND-wide; institution-specific steps
      // are surfaced within it as tips, not as separate scoped content.
      scope: 'nelfund-wide',
      institution_id: null,
    })
  }

  for (const s of sources) {
    if (!s.url) continue
    entries.push({
      id: s.id,
      type: 'source',
      title: s.label,
      snippet: s.url,
      keywords: [],
      path: '/sources',
      scope: s.scope,
      institution_id: s.institution_id,
    })
  }

  for (const i of institutions) {
    entries.push({
      id: i.id,
      type: 'institution',
      title: i.name,
      snippet: i.verification_status === 'unverified'
        ? `${i.short_name} — institution-specific guidance not yet available`
        : `${i.short_name} — institution-specific guidance available`,
      keywords: [i.short_name, i.state, i.type],
      path: '/#institution',
      // The institution picker itself is always visible to everyone,
      // regardless of what a student has (or hasn't) selected.
      scope: 'nelfund-wide',
      institution_id: null,
    })
  }

  return entries
}

const INDEX = buildIndex()

// Phrasing aliases mapped to extra query terms, so natural student questions
// match content indexed under different words. Each pattern is checked
// against the raw query; matches append their terms to the search.
const SYNONYMS: [RegExp, string][] = [
  [/school.*(not|isn'?t|is n['o]t).*show/i, 'school information not found verification lookup'],
  [/school information not found/i, 'school not showing verification lookup'],
  [/no school information/i, 'school not showing verification lookup'],
  [/upkeep/i, 'upkeep monthly allowance 20000'],
  [/can i get upkeep|apply for upkeep/i, 'upkeep both components eligibility'],
  [/how much/i, 'amount upkeep fees'],
  [/fee/i, 'fees institutional charges school'],
  [/already paid/i, 'already paid fees refund'],
  [/nin/i, 'nin verification identity nimc'],
  [/jamb/i, 'jamb registration caps'],
  [/reject/i, 'rejected rejection'],
  [/repay/i, 'repayment gsi loan'],
  [/gsi/i, 'global standing instruction repayment'],
  [/pending/i, 'pending status checking'],
  [/apply|application/i, 'application steps apply how to'],
  [/document|what.*need/i, 'documents needed requirements checklist'],
  [/guarantor/i, 'guarantor eligibility requirements'],
  [/directly|pay me|pay student/i, 'direct payment disbursement'],
  [/scam|fraud|safe/i, 'scam prevention stay safe otp guarantor'],
  [/oou|institution/i, 'oou-specific institution verification'],
  [/cgpa|grade/i, 'cgpa eligibility'],
  [/bank/i, 'bank details bvn account'],
]

/**
 * Search respects the same national/institution content-scope rule as every
 * other list on the site:
 *   - No institution selected -> only NELFUND-wide content is searched.
 *   - An institution selected -> NELFUND-wide + that institution's own
 *     content is searched, with that institution's results ranked slightly
 *     ahead so an institution-specific match (e.g. "I already paid my school
 *     fees" while OOU is selected) surfaces before generic results.
 * A student who selects UNILAG will never have OOU's institution-specific
 * results returned, searched, or ranked — those entries are excluded from
 * the candidate pool entirely, not just hidden in the UI.
 */
export function search(query: string, institutionId: string | null = null): SearchableEntry[] {
  const q = query.trim().toLowerCase()
  if (!q) return []

  let expanded = q
  for (const [pattern, extra] of SYNONYMS) {
    if (pattern.test(q)) expanded += ' ' + extra
  }
  const terms = Array.from(new Set(expanded.split(/\s+/).filter((t) => t.length > 1)))

  const candidates = INDEX.filter(
    (entry) => entry.scope === 'nelfund-wide' || entry.institution_id === institutionId,
  )

  const scored = candidates.map((entry) => {
    const haystack = [entry.title, entry.snippet, ...entry.keywords].join(' ').toLowerCase()
    let score = 0
    for (const term of terms) {
      if (entry.title.toLowerCase().includes(term)) score += 3
      if (haystack.includes(term)) score += 1
    }
    // Once an institution is selected, give its own content a small boost so
    // it's prioritized over generic NELFUND-wide matches of similar strength.
    if (score > 0 && institutionId && entry.institution_id === institutionId) score += 2
    return { entry, score }
  })

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map((s): SearchableEntry => {
      const { id, type, title, snippet, keywords, path } = s.entry
      return { id, type, title, snippet, keywords, path }
    })
}

// Clickable example searches shown when the search box is empty, per the
// product spec's "add search suggestions" requirement.
export const SEARCH_SUGGESTIONS: SearchSuggestion[] = [
  { label: 'How do I apply?', query: 'how do I apply' },
  { label: 'How much is upkeep?', query: 'how much is upkeep' },
  { label: "My school isn't showing", query: "my school isn't showing" },
  { label: 'I already paid my fees', query: 'I already paid my fees' },
  { label: 'What documents do I need?', query: 'what documents do I need' },
  { label: 'When do I repay?', query: 'when do I repay' },
]
