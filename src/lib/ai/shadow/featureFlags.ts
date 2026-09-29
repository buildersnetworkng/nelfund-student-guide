/**
 * Feature flags for migrated AI path.
 * Safe default: production OFF if this module fails to load.
 * Rollback: set enableMigratedAreasProduction to false (single change).
 */
export type AiFeatureFlags = {
  enableMigratedAreasProduction: boolean
  enableShadowMigratedAreas: boolean
  /** Optional percent cohort 0–100; 100 = all users when production enabled */
  rolloutPercent: number
  areas: {
    portal_login: boolean
    account_already_exists: boolean
    how_to_apply: boolean
    pending_status: boolean
    disbursement_timing: boolean
    institution_followup: boolean
    application_window: boolean
  }
  packId: string
  packVersion: string
  rollbackNote: string
}

/** Controlled G3 rollout: production path ON only for migrated areas; legacy for all else */
export const DEFAULT_AI_FEATURE_FLAGS: AiFeatureFlags = {
  enableMigratedAreasProduction: true,
  enableShadowMigratedAreas: true,
  rolloutPercent: 100,
  areas: {
    portal_login: true,
    account_already_exists: true,
    how_to_apply: true,
    pending_status: true,
    disbursement_timing: true,
    institution_followup: true,
    application_window: true,
  },
  packId: 'migrated_v1',
  packVersion: '1.1.1',
  rollbackNote:
    'Set enableMigratedAreasProduction=false to force 100% legacy processUserTurn for all areas.',
}

export function loadAiFeatureFlags(): AiFeatureFlags {
  try {
    // Future: window.__NELFUND_AI_FLAGS__ or env injection. Malformed → safe defaults with production OFF.
    const w = typeof globalThis !== 'undefined' ? (globalThis as { __NELFUND_AI_FLAGS__?: Partial<AiFeatureFlags> }).__NELFUND_AI_FLAGS__ : undefined
    if (!w || typeof w !== 'object') return { ...DEFAULT_AI_FEATURE_FLAGS }
    return {
      ...DEFAULT_AI_FEATURE_FLAGS,
      ...w,
      areas: { ...DEFAULT_AI_FEATURE_FLAGS.areas, ...(w.areas || {}) },
      enableMigratedAreasProduction: w.enableMigratedAreasProduction === true,
      rolloutPercent: typeof w.rolloutPercent === 'number' ? Math.max(0, Math.min(100, w.rolloutPercent)) : DEFAULT_AI_FEATURE_FLAGS.rolloutPercent,
    }
  } catch {
    return {
      ...DEFAULT_AI_FEATURE_FLAGS,
      enableMigratedAreasProduction: false,
    }
  }
}

export function isAreaEnabled(
  flags: AiFeatureFlags,
  area: keyof AiFeatureFlags['areas'],
  mode: 'production' | 'shadow',
): boolean {
  try {
    if (mode === 'production' && !flags.enableMigratedAreasProduction) return false
    if (mode === 'shadow' && !flags.enableShadowMigratedAreas) return false
    if (mode === 'production' && flags.rolloutPercent <= 0) return false
    return !!flags.areas[area]
  } catch {
    return false
  }
}

/** Deterministic cohort: same userKey always same side. Missing key → include when percent=100. */
export function inRolloutCohort(flags: AiFeatureFlags, userKey?: string | null): boolean {
  try {
    if (!flags.enableMigratedAreasProduction) return false
    if (flags.rolloutPercent >= 100) return true
    if (flags.rolloutPercent <= 0) return false
    const key = (userKey || 'anonymous').toString()
    let h = 0
    for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
    return h % 100 < flags.rolloutPercent
  } catch {
    return false
  }
}
