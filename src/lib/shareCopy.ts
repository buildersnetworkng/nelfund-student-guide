import { stripLongDashes } from './copyHygiene'
import { trackFeature } from './analytics'

export const SHARE_TITLE = 'NELFUND Student Guide'
export const GROUP_NAME_KEY = 'nelfund-share-group-name'
export const GROUP_NAME_EVENT = 'nelfund-share-group-name'
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
export const MORE_GROUPS = ['department', 'faculty', 'SUG']

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

export function buildShareText(url: string, groupName = '') {
  const searchLine = groupName
    ? `Search this exact group in WhatsApp: ${groupName}`
    : 'In WhatsApp, tap Search at the top. Type your class or department group. Do not tap one classmate.'
  return stripLongDashes(
    'PIN THIS IN YOUR CLASS WHATSAPP GROUP\n' +
      'Before you apply or wait on the portal, open this first.\n' +
      'Clear steps for application, pending status, and common portal issues.\n' +
      `${searchLine}\n` +
      'Send in the group, then pin so new classmates see it.\n' +
      'If you are class rep, pin it after you send.\n' +
      `Link ${url}`,
  )
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
