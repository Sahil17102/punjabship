import { Button, CircularProgress, Typography, type ButtonProps } from '@mui/material'
import React from 'react'

type ButtonVisualVariant = 'solid' | 'text'

interface CustomIconLoadingButtonProps
  extends Omit<ButtonProps, 'color' | 'type' | 'disabled' | 'onClick' | 'variant'> {
  text: string
  icon?: React.ReactNode
  loading?: boolean
  onClick?: () => void
  disabled?: boolean
  loadingText?: string
  type?: 'button' | 'submit' | 'reset'
  styles?: Record<string, unknown>
  variant?: ButtonVisualVariant
  textColor?: string
}

export default function CustomIconLoadingButton({
  text,
  icon,
  loading = false,
  onClick,
  disabled = false,
  loadingText = 'Loading...',
  type = 'button',
  styles,
  textColor,
  variant = 'solid',
  ...rest
}: CustomIconLoadingButtonProps) {
  const primary = '#0877C9'
  const primaryDark = '#5519A8'
  const isDisabled = loading || disabled
  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      sx={{
        ...styles,
        px: 3,
        py: 1.2,
        textTransform: 'none',
        fontWeight: 700,
        gap: 1,
        borderRadius: 0,
        backgroundColor: variant === 'solid' ? primary : 'transparent',
        color: textColor ?? (variant === 'solid' ? '#fff' : '#111827'),
        border: variant === 'text' ? `1px solid rgba(17, 24, 39, 0.12)` : 'none',
        '&:hover': {
          backgroundColor: variant === 'solid' ? primaryDark : 'rgba(17, 24, 39, 0.04)',
        },
        '&:disabled': {
          opacity: 1,
          cursor: 'not-allowed',
          backgroundColor: variant === 'solid' ? '#B89BDF' : '#F9FAFB',
          color: textColor ?? (variant === 'solid' ? '#FFFFFF' : '#6B7280'),
          borderColor: variant === 'text' ? 'rgba(17, 24, 39, 0.14)' : 'none',
        },
      }}
      {...rest}
    >
      {loading ? (
        <>
          <CircularProgress size={16} thickness={4} sx={{ color: 'currentColor' }} />
          <Typography variant="body2" sx={{ color: 'inherit', fontWeight: 600 }}>
            {loadingText}
          </Typography>
        </>
      ) : (
        <>
          {icon}
          <Typography variant="body2" sx={{ color: 'inherit', fontWeight: 700 }}>
            {text}
          </Typography>
        </>
      )}
    </Button>
  )
}
