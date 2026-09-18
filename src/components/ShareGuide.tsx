import { useCallback, useEffect, useId, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { trackFeature } from '../lib/analytics'

/** Prefer live origin so share links match whatever domain the student is on */
function getSiteUrl() {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/`
  }
  return 'https://nelfund-student-guide.vercel.app/'
}

function buildShareText(url: string) {
  return (
    'PIN THIS IN YOUR CLASS WHATSAPP GROUP\n' +
    'Before you apply or wait on the portal, open this first.\n' +
    'Clear steps for application, pending status, and common portal errors.\n' +
    'Search your class or department group name and post there, not to one classmate.\n' +
    `Link ${url}`
  )
}
