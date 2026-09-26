const SHOPIFY_EMBEDDED_SESSION_KEY = 'punjabship_shopify_embedded'

const rememberEmbeddedSession = () => {
  try {
    sessionStorage.setItem(SHOPIFY_EMBEDDED_SESSION_KEY, '1')
  } catch {
    // Framed context detection remains sufficient when storage is unavailable.
  }
}

const forgetEmbeddedSession = () => {
  try {
    sessionStorage.removeItem(SHOPIFY_EMBEDDED_SESSION_KEY)
  } catch {
    // A stale marker is harmless when session storage is unavailable.
  }
}

export const isEmbeddedShopifyContext = () => {
  const params = new URLSearchParams(window.location.search)
  const hasShopifyParams = Boolean(params.get('shop') && params.get('host'))
  const hasEmbeddedParam = params.get('embedded') === '1'
  let isFramed = false

  try {
    isFramed = window.self !== window.top
  } catch {
    isFramed = true
  }

  if (isFramed || hasEmbeddedParam || hasShopifyParams) {
    rememberEmbeddedSession()
    return true
  }

  // Top-level seller-panel tabs must never inherit an embedded marker from a
  // previous Shopify redirect. App Bridge requires live shop context.
  forgetEmbeddedSession()
  return false
}

export const buildShopifyInstallPath = (nextPath = '/channels/connected') => {
  const current = new URLSearchParams(window.location.search)
  const install = new URLSearchParams(current)

  install.delete('id_token')
  install.delete('shopify')
  install.delete('message')

  install.set('next', nextPath.startsWith('/') ? nextPath : '/channels/connected')
  return `/shopify/install?${install.toString()}`
}
