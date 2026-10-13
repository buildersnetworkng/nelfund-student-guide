/**
 * BENIN.AI promotional popup — storage, cooldowns, analytics helpers.
 * Independent channel; not affiliated with NELFUND.
 * Uses existing feature_use analytics only (no free-text / PII).
 */

import { trackFeature } from './analytics'
import { isShareSoftOpen } from './promoGate'

/** Official channel (verified). Campaign params for outbound measurement only — not subscription proof. */
export const BENIN_AI_URL =
  'https://www.youtube.com/@BENINAI_Official?utm_source=nelfund_student_guide&utm_medium=popup&utm_campaign=benin_ai_pilot_v1'

/** Verified og:image from youtube.com/@BENINAI_Official (fetched 2026-10-13). */
export const BENIN_AI_AVATAR_URL =
  'https://yt3.googleusercontent.com/GBWDGz2opD7383toi-lvxOyY-sxz52AxbrhBclG_ulblrP0cO9vSiYj_1W8PkBx48pihE_TUE54=s176-c-k-c0x00ffffff-no-rj'

/** v2 key: prior v1 dismissals during pilot rollout no longer hide the panel. */
export const BENIN_POPUP_STORAGE_KEY = 'nsg_benin_popup_v2'
export const BENIN_SESSION_SHOWN_KEY = 'nsg_benin_popup_shown_v2'

/** ~24h after X dismiss — temporary, not permanent. */
export const DISMISS_COOLDOWN_MS = 24 * 60 * 60 * 1000
/** Longer quiet period after CTA click (engaged with channel). */
export const CLICK_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000

export const FEATURE_IMPRESSION = 'benin_ai_popup_impression'
export const FEATURE_CLICK = 'benin_ai_popup_click'
export const FEATURE_DISMISS = 'benin_ai_popup_dismiss'

export type BeninPopupState = {
  dismissedAt?: number
  clickedAt?: number
  version: 2
}

function readState(): BeninPopupState {
  try {
    const raw = localStorage.getItem(BENIN_POPUP_STORAGE_KEY)
    if (!raw) return { version: 2 }
    const parsed = JSON.parse(raw) as BeninPopupState
    if (!parsed || parsed.version !== 2) return { version: 2 }
    return parsed
  } catch {
    return { version: 2 }
  }
}

function writeState(partial: Partial<BeninPopupState>) {
  try {
    const next: BeninPopupState = { ...readState(), ...partial, version: 2 }
    localStorage.setItem(BENIN_POPUP_STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* private mode / quota — still allow one-shot session suppression */
  }
}

export function wasShownThisSession(): boolean {
  try {
    return sessionStorage.getItem(BENIN_SESSION_SHOWN_KEY) === '1'
  } catch {
    return false
  }
}

export function markShownThisSession() {
  try {
    sessionStorage.setItem(BENIN_SESSION_SHOWN_KEY, '1')
  } catch {
    /* ignore */
  }
}

/** True if dismiss (24h) or click (7d) cooldown is still active. Survives navigation. */
export function isInCooldown(now = Date.now()): boolean {
  const s = readState()
  if (s.clickedAt && now - s.clickedAt < CLICK_COOLDOWN_MS) return true
  if (s.dismissedAt && now - s.dismissedAt < DISMISS_COOLDOWN_MS) return true
  return false
}

export function canShowPopup(pathname: string): boolean {
  if (!pathname) return false
  if (pathname.startsWith('/admin')) return false
  if (wasShownThisSession()) return false
  if (isInCooldown()) return false
  if (isShareSoftOpen()) return false
  return true
}

export function recordDismiss() {
  writeState({ dismissedAt: Date.now() })
  markShownThisSession()
  try {
    trackFeature(FEATURE_DISMISS)
  } catch {
    /* analytics must not block UI */
  }
}

export function recordClick() {
  writeState({ clickedAt: Date.now() })
  markShownThisSession()
  try {
    trackFeature(FEATURE_CLICK)
  } catch {
    /* analytics must not block UI */
  }
}

/** Impression only when the panel is actually shown. */
export function recordImpression() {
  markShownThisSession()
  try {
    trackFeature(FEATURE_IMPRESSION)
  } catch {
    /* ignore */
  }
}

/** Custom event Ask dispatches after first completed assistant answer. */
export const AI_ANSWER_READY_EVENT = 'nsg:ai-answer-ready'

export function emitAiAnswerReady() {
  try {
    window.dispatchEvent(new CustomEvent(AI_ANSWER_READY_EVENT))
  } catch {
    /* ignore */
  }
}
