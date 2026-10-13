/**
 * Independent student-guide footer card promoting BENIN.AI YouTube.
 * Does not imply NELFUND endorsement or formal partnership.
 * Uses existing feature_use analytics only; no AI/routing changes.
 */
import { useCallback, useRef } from 'react'
import { trackFeature } from '../lib/analytics'

export const BENIN_AI_URL = 'https://www.youtube.com/@BENINAI_Official'

/** Allowlisted feature id for analytics (coarse, no PII) */
export const BENIN_FEATURE_CLICK = 'benin_ai_card_click'
export const BENIN_PLACEMENT_ASK_FOOTER = 'ask_footer'

const SESSION_DEDUP_KEY = 'nsg_benin_ai_click_v1'

function alreadyCountedThisSession(): boolean {
  try {
    return sessionStorage.getItem(SESSION_DEDUP_KEY) === '1'
  } catch {
    return false
  }
}

function markCountedThisSession() {
  try {
    sessionStorage.setItem(SESSION_DEDUP_KEY, '1')
  } catch {
    /* ignore */
  }
}

/**
 * Fires feature_use once per browser session for this placement.
 * Does not measure YouTube subscriptions (impossible client-side without YouTube API).
 */
export function trackBeninAiCardClick(placement: string = BENIN_PLACEMENT_ASK_FOOTER) {
  try {
    if (alreadyCountedThisSession()) return { counted: false, reason: 'session_dedup' as const }
    // feature string is allowlist-style: name + placement, max length handled by trackFeature
    trackFeature(`${BENIN_FEATURE_CLICK}:${placement}`)
    markCountedThisSession()
    return { counted: true, reason: 'recorded' as const }
  } catch {
    return { counted: false, reason: 'error' as const }
  }
}

type Props = {
  placement?: string
  className?: string
}

/**
 * Compact mobile-friendly card.
 * Copy: Discover BENIN.AI · Follow & Subscribe CTA
 * Branding: independent guide only — no NELFUND partnership claim.
 */
export default function BeninAiCard({
  placement = BENIN_PLACEMENT_ASK_FOOTER,
  className = '',
}: Props) {
  const clickedRef = useRef(false)

  const onClick = useCallback(() => {
    // Prevent double-fire on multi-touch / rapid repeat in same navigation
    if (clickedRef.current) {
      trackBeninAiCardClick(placement)
      return
    }
    clickedRef.current = true
    trackBeninAiCardClick(placement)
  }, [placement])

  return (
    <aside
      className={`rounded-xl border border-ink/10 bg-white/90 px-3 py-2.5 text-center ${className}`}
      aria-label="Discover BENIN.AI"
    >
      <p className="text-[12px] font-semibold text-ink/80">Discover BENIN.AI</p>
      <p className="mt-0.5 text-[11px] leading-snug text-ink/50">
        AI, education & African innovation — independent channel, not affiliated with NELFUND.
      </p>
      <a
        href={BENIN_AI_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        className="mt-2 inline-flex min-h-9 items-center justify-center rounded-full bg-[#1B5E3B] px-3.5 text-[12px] font-semibold text-white shadow-sm hover:opacity-95"
      >
        Follow & Subscribe
      </a>
      <p className="mt-1.5 text-[10px] text-ink/35">
        Opens YouTube in a new tab · NELFUND Student Guide remains independently branded
      </p>
    </aside>
  )
}
