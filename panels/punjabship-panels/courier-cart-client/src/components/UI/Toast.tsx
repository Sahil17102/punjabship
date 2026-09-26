import {
  Alert,
  type AlertColor,
  Box,
  IconButton,
  Slide,
  type SlideProps,
  Snackbar,
  styled,
} from '@mui/material'
import React from 'react'
import { MdCheckCircle, MdClose, MdError, MdInfo, MdWarning } from 'react-icons/md'

let openToastFn: (options: ToastOptions) => void = () => {}

export interface ToastOptions {
  message: string
  severity?: AlertColor
  duration?: number
  position?: {
    vertical: 'top' | 'bottom'
    horizontal: 'left' | 'center' | 'right'
  }
}

export const toast = {
  open: (options: ToastOptions) => openToastFn(options),
}

// Background & accent colors per severity (solid, non‑glass)
const bgMap: Record<AlertColor, string> = {
  success: '#064E3B',
  error: '#7F1D1D',
  warning: '#78350F',
  info: '#1E3A8A',
}

const accentMap: Record<AlertColor, string> = {
  success: '#34D399',
  error: '#F97373',
  warning: '#FBBF24',
  info: '#60A5FA',
}

const iconMap: Record<AlertColor, React.ReactNode> = {
  success: <MdCheckCircle size={20} />,
  error: <MdError size={20} />,
  warning: <MdWarning size={20} />,
  info: <MdInfo size={20} />,
}

const GlassAlert = styled(Alert)<{ severity: AlertColor }>(({ theme, severity }) => ({
  background: bgMap[severity] ?? bgMap.info,
  boxShadow: '0 14px 30px rgba(15,23,42,0.45)',
  borderRadius: 18,
  padding: '10px 16px',
  border: '1px solid rgba(15,23,42,0.8)',
  color: '#E5E7EB',
  fontSize: '0.9rem',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  overflow: 'hidden',
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    left: 0,
    top: 4,
    bottom: 4,
    width: 4,
    borderRadius: 999,
    background: accentMap[severity] ?? accentMap.info,
  },
  '& .MuiAlert-icon': {
    color: accentMap[severity] ?? theme.palette[severity]?.main,
    opacity: 0.98,
    marginRight: 8,
    marginLeft: 4,
  },
  '& .MuiAlert-message': {
    padding: 0,
    fontWeight: 500,
    letterSpacing: 0.01,
    zIndex: 1,
    maxWidth: 320,
    whiteSpace: 'pre-line',
  },
}))

const ToastContainer = styled(Box)(() => ({
  maxWidth: 420,
  width: '100%',
  '& *': {
    boxSizing: 'border-box',
  },
}))

const transitionUp = (props: SlideProps) => <Slide {...props} direction="up" />

export const ToastProvider: React.FC = () => {
  const [open, setOpen] = React.useState(false)
  const [opts, setOpts] = React.useState<ToastOptions>({
    message: '',
    severity: 'info',
    duration: 5000,
    position: { vertical: 'bottom', horizontal: 'right' },
  })

  /* expose toast.open globally */
  React.useEffect(() => {
    openToastFn = (o: ToastOptions) => {
      // Close any current toast so MUI remounts it with new position
      setOpen(false)
      setOpts((prev) => ({ ...prev, ...o }))
      // Slight delay ensures Snackbar remounts with fresh key below
      setTimeout(() => setOpen(true), 0)
    }
  }, [])

  const { vertical, horizontal } = opts.position ?? {
    vertical: 'bottom',
    horizontal: 'center',
  }

  return (
    <Snackbar
      key={`${vertical}-${horizontal}`}
      open={open}
      autoHideDuration={opts.duration ?? 3500}
      onClose={() => setOpen(false)}
      anchorOrigin={{ vertical, horizontal }}
      TransitionComponent={transitionUp}
      sx={{
        '& .MuiSnackbarContent-root': {
          background: 'transparent',
          boxShadow: 'none',
          padding: 0,
        },
      }}
    >
      <ToastContainer>
        <GlassAlert
          severity={opts.severity ?? 'info'}
          variant="standard"
          icon={iconMap[opts.severity ?? 'info']}
          action={
            <IconButton
              size="small"
              onClick={() => setOpen(false)}
              sx={{
                color: '#E5E7EB',
                ml: 0.5,
                '&:hover': { bgcolor: 'rgba(15,23,42,0.45)' },
              }}
            >
              <MdClose size={18} />
            </IconButton>
          }
        >
          {opts.message}
        </GlassAlert>
      </ToastContainer>
    </Snackbar>
  )
}
