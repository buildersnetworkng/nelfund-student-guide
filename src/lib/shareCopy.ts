import { stripLongDashes } from './copyHygiene'

export const SHARE_TITLE = 'NELFUND Student Guide'
export const GROUP_NAME_KEY = 'nelfund-share-group-name'
export const GROUP_NAME_EVENT = 'nelfund-share-group-name'
export const DEFAULT_GROUP_SEARCH = 'class group'
export const GROUP_SEARCH_HINTS = [
  '100L',
  '200L',
  '300L',
  '400L',
  '500L',
  'ND1',
  'ND2',
  'HND1',
  'HND2',
  'class group',
  'department',
  'faculty',
  'SUG',
  'class rep',
]
export const MORE_GROUPS = ['class group', 'department', 'faculty', 'SUG', 'class rep']

export function getSiteUrl() {
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://nelfund-student-guide.vercel.app'
  return `${origin}/?from=class-wa`
}

export function getSavedGroupName() {
  if (typeof window === 'undefined') return ''
  try {
    return stripLongDashes(window.localStorage.getItem(GROUP_NAME_KEY) || '').trim()
  } catch {
    return ''
  }
}

export function persistGroupName(value: string) {
  const cleaned = stripLongDashes(value).trim()
  try {
    if (cleaned) window.localStorage.setItem(GROUP_NAME_KEY, cleaned)
  } catch {
    /* private mode */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(GROUP_NAME_EVENT))
  }
  return cleaned
}

/** Short text to paste into WhatsApp Search. Never the full share message. */
export function getGroupSearchPaste(groupName = '') {
  const named = stripLongDashes(groupName).trim()
  return named || DEFAULT_GROUP_SEARCH
}

export function buildShareText(url: string, groupName = '') {
  const body =
    '*📌 NELFUND GUIDE*\n\n' +
    'Students are advised to go through the NELFUND Guide before taking any further steps regarding NELFUND.\n\n' +
    '> Whether you’re yet to apply or have already applied, it provides the key information and guidance you need at every stage.\n\n' +
    `🔗 ${url}`
  if (groupName.trim()) {
    return stripLongDashes(body + `\n\nPost in: ${groupName.trim()}`)
  }
  return stripLongDashes(body)
}

export async function copySharePayload(value: string) {
  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = value
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      return true
    } catch {
      return false
    }
  }
}
