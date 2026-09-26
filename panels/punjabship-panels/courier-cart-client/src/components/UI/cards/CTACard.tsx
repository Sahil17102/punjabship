import {
  alpha,
  Box,
  Button,
  Card,
  Skeleton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import React from 'react'
import StatusChip from '../chip/StatusChip'

const BRAND_GREEN = '#4b8e40'

interface CTACardProps {
  icon: React.ReactNode
  title: string
  isDone?: boolean
  description: string
  buttonText: string
  onClick: () => void
  backgroundColor?: string
  glassColor?: string
  height?: string
  showButton?: boolean
  showBadge?: boolean
  loading?: boolean
}

const CTACard: React.FC<CTACardProps> = ({
  icon,
  title,
  description,
  buttonText,
  isDone,
  onClick,
  showButton = true,
  showBadge = true,
  loading = false,
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <Card
      elevation={0}
      sx={{
        p: { xs: 2.5, sm: 3 },
        borderRadius: 3,
        background: '#FFFFFF',
        border: `1px solid ${alpha(BRAND_GREEN, 0.12)}`,
        boxShadow: `0 2px 8px ${alpha(BRAND_GREEN, 0.06)}`,
        width: '100%',
        minHeight: isMobile ? 180 : 200,
        position: 'relative',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 24px ${alpha(BRAND_GREEN, 0.15)}`,
          border: `1.5px solid ${alpha(BRAND_GREEN, 0.25)}`,
        },
      }}
    >
      <Stack direction={'column'} width="100%" height="100%" justifyContent="space-between">
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
          <Box
            sx={{
              bgcolor: alpha(BRAND_GREEN, 0.1),
              borderRadius: 2,
              p: 1.25,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: { xs: 44, sm: 48 },
              height: { xs: 44, sm: 48 },
            }}
          >
            {loading ? <Skeleton variant="circular" width={24} height={24} /> : icon}
          </Box>

          <Stack flex={1} spacing={0.5}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
              {loading ? (
                <Skeleton width={isMobile ? 120 : 140} height={20} />
              ) : (
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: BRAND_GREEN,
                    fontSize: { xs: '1rem', sm: '1.125rem' },
                  }}
                >
                  {title}
                </Typography>
              )}

              {showBadge &&
                !loading &&
                (isDone ? (
                  <StatusChip status="success" label="Done" />
                ) : (
                  <StatusChip status="pending" label="Pending" />
                ))}
            </Stack>
          </Stack>
        </Stack>

        {/* Description */}
        <Box flex={1} mb={2}>
          {loading ? (
            <>
              <Skeleton width="90%" height={16} sx={{ mb: 1 }} />
              <Skeleton width="70%" height={16} />
            </>
          ) : (
            description && (
              <Typography
                variant="body2"
                sx={{
                  color: '#6b6b6b',
                  lineHeight: 1.6,
                  fontSize: { xs: '0.875rem', sm: '0.9rem' },
                }}
              >
                {description}
              </Typography>
            )
          )}
        </Box>

        {/* CTA Button */}
        {showButton && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: isMobile ? 'stretch' : 'flex-end',
            }}
          >
            {loading ? (
              <Skeleton
                variant="rectangular"
                width={isMobile ? '100%' : 100}
                height={40}
                sx={{ borderRadius: 2 }}
              />
            ) : (
              <Button onClick={onClick} variant="contained" fullWidth={isMobile}>
                {buttonText}
              </Button>
            )}
          </Box>
        )}
      </Stack>
    </Card>
  )
}

export default CTACard
