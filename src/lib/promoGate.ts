/**
 * Lightweight coordination so Share soft prompt and BENIN popup
 * do not stack on the same viewport at the same time.
 * In-memory only (resets on full page reload; session cooldowns still apply).
 */

let shareSoftOpen = false

export function setShareSoftOpen(open: boolean) {
  shareSoftOpen = open
  try {
    window.dispatchEvent(new CustomEvent('nsg:share-soft-visibility', { detail: { open } }))
  } catch {
    /* ignore */
  }
}

export function isShareSoftOpen(): boolean {
  return shareSoftOpen
}
