import { useHotkeys } from 'react-hotkeys-hook'
import { useNavigate } from 'react-router-dom'

export default function KeyboardShortcuts() {
  const navigate = useNavigate()

  // Navigation shortcuts
  useHotkeys(
    'ctrl+shift+d, cmd+shift+d',
    (e) => {
      e.preventDefault()
      navigate('/dashboard')
    },
    { enableOnFormTags: false },
  )

  useHotkeys(
    'ctrl+shift+h, cmd+shift+h',
    (e) => {
      e.preventDefault()
      navigate('/home')
    },
    { enableOnFormTags: false },
  )

  // Orders shortcuts
  useHotkeys(
    'ctrl+shift+o, cmd+shift+o',
    (e) => {
      e.preventDefault()
      navigate('/orders/list')
    },
    { enableOnFormTags: false },
  )

  useHotkeys(
    'ctrl+shift+n, cmd+shift+n',
    (e) => {
      e.preventDefault()
      navigate('/orders/create')
    },
    { enableOnFormTags: false },
  )

  useHotkeys(
    'ctrl+shift+r, cmd+shift+r',
    (e) => {
      e.preventDefault()
      navigate('/ops/rto')
    },
    { enableOnFormTags: false },
  )

  useHotkeys(
    'ctrl+shift+e, cmd+shift+e',
    (e) => {
      e.preventDefault()
      navigate('/ops/ndr')
    },
    { enableOnFormTags: false },
  )

  // Billing shortcuts
  useHotkeys(
    'ctrl+shift+i, cmd+shift+i',
    (e) => {
      e.preventDefault()
      navigate('/billing/invoice_management')
    },
    { enableOnFormTags: false },
  )

  useHotkeys(
    'ctrl+shift+w, cmd+shift+w',
    (e) => {
      e.preventDefault()
      navigate('/billing/wallet_transactions')
    },
    { enableOnFormTags: false },
  )

  useHotkeys(
    'ctrl+shift+m, cmd+shift+m',
    (e) => {
      e.preventDefault()
      navigate('/cod-remittance')
    },
    { enableOnFormTags: false },
  )

  // Tools shortcuts
  useHotkeys(
    'ctrl+shift+k, cmd+shift+k',
    (e) => {
      e.preventDefault()
      navigate('/tools/rate_calculator')
    },
    { enableOnFormTags: false },
  )

  useHotkeys(
    'ctrl+shift+t, cmd+shift+t',
    (e) => {
      e.preventDefault()
      navigate('/tools/order_tracking')
    },
    { enableOnFormTags: false },
  )

  // Settings & Profile shortcuts
  useHotkeys(
    'ctrl+shift+s, cmd+shift+s',
    (e) => {
      e.preventDefault()
      navigate('/settings')
    },
    { enableOnFormTags: false },
  )

  useHotkeys(
    'ctrl+shift+p, cmd+shift+p',
    (e) => {
      e.preventDefault()
      navigate('/profile')
    },
    { enableOnFormTags: false },
  )

  // Operations shortcuts
  useHotkeys(
    'ctrl+shift+g, cmd+shift+g',
    (e) => {
      e.preventDefault()
      navigate('/reconciliation/weight')
    },
    { enableOnFormTags: false },
  )

  // Support shortcuts
  useHotkeys(
    'ctrl+shift+u, cmd+shift+u',
    (e) => {
      e.preventDefault()
      navigate('/support/tickets')
    },
    { enableOnFormTags: false },
  )

  // Help shortcut
  useHotkeys(
    'ctrl+shift+slash, cmd+shift+slash',
    (e) => {
      e.preventDefault()
      navigate('/help/shortcuts')
    },
    { enableOnFormTags: false },
  )

  // Global search shortcut (Ctrl+K or Cmd+K)
  useHotkeys(
    'ctrl+k, cmd+k',
    (e) => {
      e.preventDefault()
      // Focus search input if it exists
      const searchInput = document.querySelector(
        'input[placeholder*="Search"], input[placeholder*="Order ID"], input[placeholder*="AWB"]',
      ) as HTMLInputElement
      if (searchInput) {
        searchInput.focus()
        searchInput.select()
      }
    },
    { enableOnFormTags: true },
  )

  return null
}
