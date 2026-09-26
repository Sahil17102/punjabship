import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Stack,
  Typography,
} from '@mui/material'
import React from 'react'

export interface ListPageLayoutProps {
  title: string
  description: string
  children: React.ReactNode
  actions?: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
    variant?: 'contained' | 'outlined'
    minWidth?: number
  }[]
  controls?: React.ReactNode
  feedback?: {
    severity: 'info' | 'success' | 'error' | 'warning'
    title: string
    message: string
  } | null
  onClearFeedback?: () => void
  selectionInfo?: React.ReactNode
}

const ListPageLayout: React.FC<ListPageLayoutProps> = ({
  title,
  description,
  children,
  actions = [],
  controls,
  feedback,
  onClearFeedback,
  selectionInfo,
}) => {
  return (
    <Stack spacing={2}>
      {/* Header Section */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'stretch', md: 'center' }}
        justifyContent="space-between"
        gap={2}
        sx={{ p: 1 }}
      >
        {/* Left Title Section */}
        <Stack spacing={0.3}>
          <Typography
            sx={{
              fontSize: { xs: '1.15rem', md: '1.35rem' },
              fontWeight: 800,
              color: '#111111',
              lineHeight: 1.2,
            }}
          >
            {title}
          </Typography>
          <Typography
            sx={{
              fontSize: '0.88rem',
              color: '#6B7280',
              fontWeight: 500,
            }}
          >
            {description}
          </Typography>
        </Stack>

        {/* Right Action Buttons */}
        {actions.length > 0 && (
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            gap={1.25}
            width={{ xs: '100%', md: 'auto' }}
            alignItems="stretch"
            flexShrink={0}
          >
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'contained'}
                color="primary"
                onClick={action.onClick}
                startIcon={action.icon}
                sx={{
                  minHeight: 42,
                  minWidth: { xs: '100%', sm: action.minWidth || 'auto' },
                  width: { xs: '100%', sm: 'auto' },
                  px: 2.2,
                  borderRadius: '12px',
                  fontWeight: 700,
                  textTransform: 'none',
                  justifyContent: 'center',
                  ...(action.variant === 'outlined' && {
                    borderWidth: '1.5px',
                  }),
                  whiteSpace: 'nowrap',
                  '& .MuiButton-startIcon': {
                    ml: 0,
                    mr: 1,
                    flexShrink: 0,
                  },
                }}
              >
                {action.label}
              </Button>
            ))}
          </Stack>
        )}
      </Stack>

      {/* Controls Section */}
      {controls && <Box>{controls}</Box>}

      {/* Feedback Alert */}
      {feedback && (
        <Alert
          severity={feedback.severity}
          onClose={onClearFeedback}
          sx={{ alignItems: 'flex-start' }}
        >
          <AlertTitle>{feedback.title}</AlertTitle>
          {feedback.message}
        </Alert>
      )}

      {/* Selection Info */}
      {selectionInfo && <Box>{selectionInfo}</Box>}

      {/* Content */}
      {children}
    </Stack>
  )
}

export default ListPageLayout
