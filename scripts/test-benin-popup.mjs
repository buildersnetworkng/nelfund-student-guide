/**
 * Offline unit checks for BENIN popup cooldown / session rules.
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
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000

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
  const t = Math.max(s.dismissedAt || 0, s.clickedAt || 0)
  if (!t) return false
  return now - t < COOLDOWN_MS
}
function canShowPopup(pathname) {
  if (!pathname) return false
  if (pathname.startsWith('/admin')) return false
  if (wasShownThisSession()) return false
  if (isInCooldown()) return false
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

assert.equal(canShowPopup('/'), true)
assert.equal(canShowPopup('/ask'), true)
assert.equal(canShowPopup('/admin'), false)
assert.equal(canShowPopup('/admin/analytics'), false)
markShownThisSession()
assert.equal(canShowPopup('/'), false)
session.clear()
assert.equal(canShowPopup('/'), true)
recordDismiss()
assert.equal(canShowPopup('/ask'), false)
session.clear()
assert.equal(isInCooldown(), true)
assert.equal(canShowPopup('/'), false)
writeState({ dismissedAt: Date.now() - COOLDOWN_MS - 1000 })
session.clear()
assert.equal(canShowPopup('/faq'), true)
store.clear()
session.clear()
recordClick()
assert.equal(canShowPopup('/videos'), false)
console.log('All benin popup unit checks passed.')
