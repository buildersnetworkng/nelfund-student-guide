import { useCallback, useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { trackFeature } from '../lib/analytics'
import { stripLongDashes } from '../lib/copyHygiene'

function getSiteUrl() {
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://nelfund-student-guide.vercel.app'
  return `${origin}/?from=class-wa`
}

const SHARE_TITLE = 'NELFUND Student Guide'
const GROUP_NAME_KEY = 'nelfund-share-group-name'
const GROUP_NAME_EVENT = 'nelfund-share-group-name'
const GROUP_SEARCH_HINTS = [
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
const MORE_GROUPS = ['department', 'faculty', 'SUG']
let shareDeepLinkConsumed = false
