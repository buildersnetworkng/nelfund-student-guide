/**
 * Offline unit checks for BENIN popup cooldowns, session rules, and share gate.
 * Run: node scripts/test-benin-popup.mjs
 */
import assert from 'node:assert/strict'

const store = new Map()
const session = new Map()
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
}
globalThis.sessionStorage = {
  getItem: (k) => (session.has(k) ? session.get(k) : null),
  setItem: (k, v) => session.set(k, String(v)),
  removeItem: (k) => session.delete(k),
}
globalThis.window = { dispatchEvent: () => {} }

const KEY = 'nsg_benin_popup_v1'
const SESSION_KEY = 'nsg_benin_popup_shown_v1'
const DISMISS_COOLDOWN_MS = 24 * 60 * 60 * 1000
const CLICK_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000
const SHARE_KEY = 'nelfund-share-soft-v2'
const SHARE_DISMISS_MS = 1000 * 60 * 60 * 6

let shareSoftOpen = false
function setShareSoftOpen(open) {
  shareSoftOpen = open
}
function isShareSoftOpen() {
  return shareSoftOpen
}

function readState() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { version: 1 }
    const parsed = JSON.parse(raw)
    if (!parsed || parsed.version !== 1) return { version: 1 }
    return parsed
  } catch {
    return { version: 1 }
  }
}
function writeState(partial) {
  const next = { ...readState(), ...partial, version: 1 }
  localStorage.setItem(KEY, JSON.stringify(next))
}
function wasShownThisSession() {
  return sessionStorage.getItem(SESSION_KEY) === '1'
}
function markShownThisSession() {
  sessionStorage.setItem(SESSION_KEY, '1')
}
function isInCooldown(now = Date.now()) {
  const s = readState()
  if (s.clickedAt && now - s.clickedAt < CLICK_COOLDOWN_MS) return true
  if (s.dismissedAt && now - s.dismissedAt < DISMISS_COOLDOWN_MS) return true
  return false
}
function canShowPopup(pathname) {
  if (!pathname) return false
  if (pathname.startsWith('/admin')) return false
  if (wasShownThisSession()) return false
  if (isInCooldown()) return false
  if (isShareSoftOpen()) return false
  return true
}
function recordDismiss() {
  writeState({ dismissedAt: Date.now() })
  markShownThisSession()
}
function recordClick() {
  writeState({ clickedAt: Date.now() })
  markShownThisSession()
}
function recordImpression() {
  markShownThisSession()
}

function shareAlreadyDismissed() {
  try {
    const raw = localStorage.getItem(SHARE_KEY)
    if (!raw) return false
    const at = Number(raw)
    if (!Number.isFinite(at)) return false
    return Date.now() - at < SHARE_DISMISS_MS
  } catch {
    return false
  }
}
function canShowShare(pathname) {
  const skip = ['/ask', '/apply', '/fees', '/upkeep', '/troubleshooting', '/faq', '/videos', '/sources', '/readiness', '/admin']
  if (skip.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return false
  if (shareAlreadyDismissed()) return false
  return true
}

// --- BENIN: eligible by default ---
assert.equal(canShowPopup('/'), true)
assert.equal(canShowPopup('/ask'), true)
assert.equal(canShowPopup('/admin'), false)
assert.equal(canShowPopup('/admin/analytics'), false)

// Session dedup
markShownThisSession()
assert.equal(canShowPopup('/'), false)
session.clear()
assert.equal(canShowPopup('/'), true)

// Dismiss → 24h cooldown; survives "navigation" (session clear only)
recordDismiss()
assert.equal(canShowPopup('/ask'), false)
session.clear()
assert.equal(isInCooldown(), true)
assert.equal(canShowPopup('/'), false)

// After ~24h dismiss cooldown expires, eligible again
writeState({ dismissedAt: Date.now() - DISMISS_COOLDOWN_MS - 1000 })
session.clear()
assert.equal(canShowPopup('/faq'), true)

// CTA click → 7d cooldown (still blocked after 24h)
store.clear()
session.clear()
recordClick()
assert.equal(canShowPopup('/videos'), false)
session.clear()
writeState({ clickedAt: Date.now() - DISMISS_COOLDOWN_MS - 1000 }) // 24h+ later, click still active
assert.equal(isInCooldown(), true)
assert.equal(canShowPopup('/'), false)
writeState({ clickedAt: Date.now() - CLICK_COOLDOWN_MS - 1000 })
session.clear()
assert.equal(canShowPopup('/'), true)

// Share soft open blocks Benin (no overlap)
store.clear()
session.clear()
setShareSoftOpen(true)
assert.equal(canShowPopup('/'), false)
setShareSoftOpen(false)
assert.equal(canShowPopup('/'), true)

// Impression marks session (no double show same session)
recordImpression()
assert.equal(wasShownThisSession(), true)
assert.equal(canShowPopup('/ask'), false)

// --- Share soft prompt eligibility (home) ---
store.clear()
session.clear()
assert.equal(canShowShare('/'), true)
assert.equal(canShowShare('/ask'), false)
assert.equal(canShowShare('/faq'), false)
localStorage.setItem(SHARE_KEY, String(Date.now()))
assert.equal(canShowShare('/'), false)
localStorage.setItem(SHARE_KEY, String(Date.now() - SHARE_DISMISS_MS - 1000))
assert.equal(canShowShare('/'), true)

// Coexistence: share eligible on home does not permanently disable Benin
store.clear()
session.clear()
setShareSoftOpen(false)
assert.equal(canShowShare('/'), true)
assert.equal(canShowPopup('/'), true)

console.log('All benin popup + share gate unit checks passed.')
