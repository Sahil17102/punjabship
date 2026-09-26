import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from '../components/UI/Toast'

export default function GlobalRedirectHandler() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const status = params.get('status')

    if (status === 'success') {
      toast.open({ message: 'Wallet recharge successful 🎉', severity: 'success' })
    } else if (status === 'failure') {
      toast.open({ message: 'Wallet recharge failed ❌', severity: 'error' })
    }

    // Clean up query param so refresh doesn't trigger toast again
    if (status) {
      navigate(location.pathname, { replace: true })
    }
  }, [location, navigate])

  return null
}
