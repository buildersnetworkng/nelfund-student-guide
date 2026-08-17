import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { getInstitution } from '../lib/data'
import type { Institution } from '../lib/types'
import { trackInstitution } from '../lib/analytics'

const STORAGE_KEY = 'nelfund-guide:institution-id'

export const OTHER_INSTITUTION = 'other'

interface InstitutionContextValue {
  institutionId: string | null
  institution: Institution | null
  setInstitutionId: (id: string | null) => void
}

const InstitutionContext = createContext<InstitutionContextValue | null>(null)

export function InstitutionProvider({ children }: { children: ReactNode }) {
  const [institutionId, setInstitutionIdState] = useState<string | null>(null)

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved) setInstitutionIdState(saved)
    } catch {
      // localStorage can be unavailable (e.g. private browsing)
    }
  }, [])

  function setInstitutionId(id: string | null) {
    setInstitutionIdState(id)
    try {
      if (id) {
        window.localStorage.setItem(STORAGE_KEY, id)
        trackInstitution(id)
      } else {
        window.localStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      // Ignore storage failures; in-memory selection still works for this session.
    }
  }

  const institution = useMemo(
    () => (institutionId && institutionId !== OTHER_INSTITUTION ? getInstitution(institutionId) : null),
    [institutionId],
  )

  const value = useMemo(
    () => ({ institutionId, institution, setInstitutionId }),
    [institutionId, institution],
  )

  return <InstitutionContext.Provider value={value}>{children}</InstitutionContext.Provider>
}

export function useInstitution(): InstitutionContextValue {
  const ctx = useContext(InstitutionContext)
  if (!ctx) throw new Error('useInstitution must be used within an InstitutionProvider')
  return ctx
}

export function useInstitutionNoticeText(): string | null {
  const { institutionId, institution } = useInstitution()
  if (!institutionId) return null
  if (institution && institution.verification_status !== 'unverified') {
    return `Showing ${institution.short_name}-specific guidance where available.`
  }
  return 'General NELFUND guidance is available. Institution-specific guidance may not yet be available for your school.'
}
