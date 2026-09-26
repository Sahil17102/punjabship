const STORAGE_KEY = 'punjabship_admin_impersonation'

export type ImpersonationSession = {
  adminUserId?: string
  expiresAt?: string
  startedAt: string
}

export const setImpersonationSession = (session: ImpersonationSession) => {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export const getImpersonationSession = (): ImpersonationSession | null => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ImpersonationSession
    if (parsed.expiresAt && Date.now() > new Date(parsed.expiresAt).getTime()) {
      sessionStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    sessionStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export const clearImpersonationSession = () => {
  sessionStorage.removeItem(STORAGE_KEY)
}
