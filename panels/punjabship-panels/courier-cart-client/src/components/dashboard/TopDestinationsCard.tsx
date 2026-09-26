import { Box, Card, CardContent, Stack, Typography, alpha, useTheme } from '@mui/material'
import { FaMapMarkerAlt } from 'react-icons/fa'

interface TopDestinationsCardProps {
  topDestinations: { city: string; state: string; count: number }[]
}

export default function TopDestinationsCard({ topDestinations }: TopDestinationsCardProps) {
  const theme = useTheme()

  if (topDestinations.length === 0) {
    return null
  }

  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        background: theme.palette.mode === 'dark'
          ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 100%)`
          : 'white',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          <FaMapMarkerAlt style={{ marginRight: 8, verticalAlign: 'middle' }} />
          Top Destinations
        </Typography>
        <Stack spacing={2} mt={2}>
          {topDestinations.map((dest, idx) => (
            <Box
              key={idx}
              sx={{
                p: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold">
                    #{idx + 1} {dest.city}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {dest.state}
                  </Typography>
                </Box>
                <Typography variant="h6" fontWeight="bold" color="primary">
                  {dest.count}
                </Typography>
              </Stack>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}

