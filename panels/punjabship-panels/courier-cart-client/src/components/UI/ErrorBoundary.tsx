import { Box, Button, Stack, Typography } from '@mui/material'
import { useTheme, type Theme } from '@mui/material/styles'
import React, { type ErrorInfo, type ReactNode } from 'react'
import { MdErrorOutline } from 'react-icons/md'

/* ---------------------------   CLASS  --------------------------- */
type InnerProps = { children: ReactNode; theme: Theme }
type State = { hasError: boolean }

class ErrorBoundaryCore extends React.Component<InnerProps, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 👉🏽 Hook up Sentry / LogRocket etc. in prod
    console.error('Uncaught error:', error, errorInfo)
  }

  private handleReload = () => window.location.reload()

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 2000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'rgba(245, 247, 250, 0.95)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        <Stack
          spacing={3}
          sx={{
            p: { xs: 4, sm: 6 },
            borderRadius: 3,
            textAlign: 'center',
            background: '#FFFFFF',
            border: '1px solid #E0E6ED',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
            maxWidth: { xs: '90%', sm: 500 },
            width: '100%',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mb: 1,
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #E74C3C 0%, #C0392B 100%)',
                boxShadow: '0 4px 12px rgba(231, 76, 60, 0.3)',
              }}
            >
              <MdErrorOutline size={32} color="#FFFFFF" />
            </Box>
          </Box>

          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              color: '#1A1A1A',
              mb: 0.5,
            }}
          >
            Oops! Something went wrong
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: '#4A5568',
              lineHeight: 1.6,
            }}
          >
            We encountered an unexpected error. Please try refreshing the page or contact support if
            the problem persists.
          </Typography>

          <Box display="flex" justifyContent="center" gap={2}>
            <Button
              variant="contained"
              onClick={this.handleReload}
              sx={{
                background: 'linear-gradient(135deg, #0877C9 0%, #2F3B5F 100%)',
                color: '#FFFFFF',
                fontWeight: 600,
                px: 4,
                py: 1.25,
                borderRadius: 2,
                textTransform: 'none',
                boxShadow: '0 4px 12px rgba(51, 51, 105, 0.2)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #2F3B5F 0%, #1A1A4A 100%)',
                  boxShadow: '0 6px 16px rgba(51, 51, 105, 0.3)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Refresh Page
            </Button>
          </Box>
        </Stack>
      </Box>
    )
  }
}

/* ------------------  FUNCTION WRAPPER  ------------------ */
/** Grabs the current theme with a hook (allowed) and passes it down
 *  to the class component (where hooks aren’t allowed). */
const ErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => {
  const theme = useTheme()
  return <ErrorBoundaryCore theme={theme}>{children}</ErrorBoundaryCore>
}

export default ErrorBoundary
