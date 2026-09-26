let access = ''
let refresh = ''
let persistInLocalStorage = true

export const configureAuthTokenPersistence = (persist: boolean) => {
  persistInLocalStorage = persist
}

export const getAuthTokens = () => ({
  accessToken: access || (persistInLocalStorage ? localStorage.getItem('cc_access') || '' : ''),
  refreshToken: refresh || (persistInLocalStorage ? localStorage.getItem('cc_refresh') || '' : ''),
})

export const setAuthTokens = (nextAccess: string, nextRefresh: string) => {
  access = nextAccess
  refresh = nextRefresh
  if (persistInLocalStorage) {
    localStorage.setItem('cc_access', nextAccess)
    localStorage.setItem('cc_refresh', nextRefresh)
  }
}

export const clearAuthTokens = () => {
  access = ''
  refresh = ''
  if (persistInLocalStorage) {
    localStorage.removeItem('cc_access')
    localStorage.removeItem('cc_refresh')
  }
}
