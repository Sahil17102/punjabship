import { Alert, Box, Button, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/auth/AuthContext'
import { setImpersonationSession } from '../../utils/impersonationSession'

const AdminImpersonation = () => {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { setTokens } = useAuth()
  const [error, setError] = useState('')

  useEffect(() => {
    const token = params.get('token') || ''
    const refresh = params.get('refresh') || ''
    const adminUserId = params.get('admin') || ''
    const expiresAt = params.get('expiresAt') || ''

    if (!token || !refresh) {
      setError('Impersonation token is missing or invalid.')
      return
    }

    setTokens(token, refresh)
    setImpersonationSession({
      adminUserId,
      expiresAt,
      startedAt: new Date().toISOString(),
    })
    navigate('/dashboard', { replace: true })
  }, [navigate, params, setTokens])

  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 3 }}>
        <Stack spacing={2} sx={{ maxWidth: 520 }}>
          <Alert severity="error">{error}</Alert>
          <Button variant="contained" onClick={() => (window.location.href = '/')}>
            Go to login
          </Button>
        </Stack>
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 3 }}>
      <Stack spacing={1} alignItems="center">
        <Typography variant="h6" fontWeight={800}>
          Opening seller account
        </Typography>
        <Typography color="text.secondary">Preparing the admin session...</Typography>
      </Stack>
    </Box>
  )
}

export default AdminImpersonation
