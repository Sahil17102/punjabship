const SHOPIFY_CLIENT_ID = import.meta.env.VITE_SHOPIFY_CLIENT_ID
const SHOPIFY_APP_BRIDGE_SCRIPT_ID = 'punjabship-shopify-app-bridge'
const SHOPIFY_APP_BRIDGE_SRC = 'https://cdn.shopify.com/shopifycloud/app-bridge.js'

declare global {
  interface Window {
    shopify?: {
      idToken: () => Promise<string>
    }
  }
}

const waitForAppBridge = async () => {
  const deadline = Date.now() + 10000
  while (!window.shopify?.idToken && Date.now() < deadline) {
    await new Promise((resolve) => window.setTimeout(resolve, 50))
  }
  if (!window.shopify?.idToken) throw new Error('Shopify App Bridge did not initialize')
  return window.shopify
}

const ensureShopifyMeta = () => {
  let meta = document.querySelector<HTMLMetaElement>('meta[name="shopify-api-key"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'shopify-api-key'
    document.head.appendChild(meta)
  }
  meta.content = SHOPIFY_CLIENT_ID
  return meta
}

const loadShopifyAppBridge = async () => {
  if (window.shopify?.idToken) return

  ensureShopifyMeta()

  const existing = document.getElementById(SHOPIFY_APP_BRIDGE_SCRIPT_ID) as HTMLScriptElement | null
  if (existing) {
    await waitForAppBridge()
    return
  }

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.id = SHOPIFY_APP_BRIDGE_SCRIPT_ID
    script.src = SHOPIFY_APP_BRIDGE_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Shopify App Bridge could not be loaded'))
    document.head.appendChild(script)
  })
}

const removeLegacyIdTokenFromUrl = () => {
  const url = new URL(window.location.href)
  if (!url.searchParams.has('id_token')) return

  url.searchParams.delete('id_token')
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
}

export const getShopifyIdToken = async () => {
  if (!SHOPIFY_CLIENT_ID) {
    throw new Error('VITE_SHOPIFY_CLIENT_ID is not configured')
  }

  await loadShopifyAppBridge()

  const meta = document.querySelector<HTMLMetaElement>('meta[name="shopify-api-key"]')
  if (meta?.content !== SHOPIFY_CLIENT_ID) {
    throw new Error('Shopify App Bridge is configured for the wrong app')
  }

  removeLegacyIdTokenFromUrl()
  const shopify = await waitForAppBridge()
  return shopify.idToken()
}
