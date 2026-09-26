import { alpha, Box, Chip, Stack, Typography, useTheme } from '@mui/material'
import React from 'react'

interface PageHeadingProps {
  title: string | React.ReactNode
  subtitle?: string
  center?: boolean
  fontSize?: string | number | object
  icon?: React.ReactNode
  badge?: string
  actions?: React.ReactNode
  meta?: Array<{ label: string; value: React.ReactNode }>
}

const PageHeading: React.FC<PageHeadingProps> = ({
  title,
  subtitle,
  center = false,
  fontSize,
  icon,
  badge,
  actions,
  meta = [],
}) => {
  const theme = useTheme()

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '8px',
        bgcolor: '#F1EDFF',
        border: '1px solid #C9BEF7',
        px: { xs: 2, sm: 3, md: 3.5 },
        py: { xs: 2, md: 2.4 },
        boxShadow: '0 4px 0 rgba(75,53,181,0.09), 0 14px 28px rgba(75,53,181,0.08)',
        backgroundImage:
          'radial-gradient(circle at 5px 5px, rgba(8,119,201,0.15) 1px, transparent 1px)',
        backgroundSize: '32px 32px',

        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          display: 'none',
        },

        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: 220,
          height: '100%',
          display: 'none',
          pointerEvents: 'none',
        },
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ xs: center ? 'center' : 'flex-start', md: 'center' }}
        justifyContent="space-between"
        sx={{ position: 'relative', zIndex: 1 }}
      >
        {/* LEFT */}
        <Stack
          spacing={0.75}
          sx={{ flex: 1, minWidth: 0 }}
          alignItems={center ? 'center' : 'flex-start'}
          textAlign={center ? 'center' : 'left'}
        >
          {/* badge */}
          {badge && (
            <Chip
              label={badge}
              size="small"
              sx={{
                height: 24,
                borderRadius: 2,
                fontSize: '0.72rem',
                fontWeight: 700,
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                color: theme.palette.primary.main,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              }}
            />
          )}

          {/* title row */}
          <Stack
            direction="row"
            spacing={1.2}
            alignItems="center"
            justifyContent={center ? 'center' : 'flex-start'}
            sx={{ width: '100%' }}
          >
            {icon && (
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 2.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: alpha(theme.palette.primary.main, 0.07),
                  color: theme.palette.primary.main,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
                  flexShrink: 0,
                }}
              >
                {icon}
              </Box>
            )}

            <Typography
              sx={{
                fontSize: fontSize ?? { xs: '1.1rem', md: '1.45rem' },
                fontWeight: 650,
                lineHeight: 1.15,
                letterSpacing: 0,
                fontFamily: '"Hahmlet Variable", Georgia, serif',
                color: '#30236E',
              }}
            >
              {title}
            </Typography>
          </Stack>

          {/* subtitle */}
          {subtitle && (
            <Typography
              sx={{
                fontSize: { xs: '0.9rem', md: '0.96rem' },
                color: '#514D63',
                lineHeight: 1.55,
                fontFamily: '"Andada Pro Variable", Georgia, serif',
                maxWidth: 760,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Stack>

        {/* RIGHT */}
        {actions && (
          <Box
            sx={{
              flexShrink: 0,
              width: { xs: '100%', md: 'auto' },
              display: 'flex',
              justifyContent: {
                xs: center ? 'center' : 'flex-start',
                md: 'flex-end',
              },
              alignItems: 'center',
            }}
          >
            {actions}
          </Box>
        )}
      </Stack>
      {meta.length > 0 && (
        <Stack
          direction="row"
          useFlexGap
          flexWrap="wrap"
          sx={{ mt: 2, pt: 1.5, borderTop: '1px solid rgba(82,65,160,0.18)' }}
        >
          {meta.map((item, index) => (
            <Box
              key={item.label}
              sx={{
                minWidth: 96,
                pl: index === 0 ? 0 : 2.5,
                pr: 2.5,
                py: 0.5,
                borderLeft: index === 0 ? 0 : '1px solid rgba(82,65,160,0.18)',
              }}
            >
              <Typography sx={{ fontSize: '0.7rem', color: '#68627A' }}>{item.label}</Typography>
              <Typography sx={{ mt: 0.25, fontSize: '0.9rem', fontWeight: 800, color: '#17171A' }}>
                {item.value}
              </Typography>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  )
}

export default PageHeading
