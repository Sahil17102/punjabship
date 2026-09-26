import { alpha, Box, Button, Card, CardContent, Stack, Typography } from '@mui/material'
import { MdSpeed } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'

interface Recommendation {
  message: string
  action: string
  path: string
  priority: 'high' | 'medium' | 'low'
}

interface RecommendationsCardProps {
  recommendations: Recommendation[]
}

const BRAND_PRIMARY = '#0877C9'
const BRAND_ACCENT = '#B8D719'

export default function RecommendationsCard({ recommendations }: RecommendationsCardProps) {
  const navigate = useNavigate()

  if (recommendations.length === 0) return null

  return (
    <Card sx={{ height: '100%', borderRadius: 2.6, border: `1px solid ${alpha(BRAND_PRIMARY, 0.14)}`, boxShadow: `0 8px 20px ${alpha(BRAND_PRIMARY, 0.08)}` }}>
      <CardContent sx={{ p: 2.2 }}>
        <Stack direction="row" spacing={1.1} alignItems="center" mb={1.8}>
          <Box sx={{ width: 34, height: 34, borderRadius: 1.8, display: 'grid', placeItems: 'center', bgcolor: alpha(BRAND_ACCENT, 0.14), color: '#8a3e00' }}>
            <MdSpeed size={20} />
          </Box>
          <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#17171A' }}>Recommendations</Typography>
        </Stack>

        <Stack spacing={1.05}>
          {recommendations.slice(0, 3).map((rec, idx) => (
            <Box
              key={idx}
              sx={{
                p: 1.2,
                borderRadius: 2,
                border: `1px solid ${alpha(BRAND_PRIMARY, 0.16)}`,
                bgcolor: alpha(BRAND_PRIMARY, 0.05),
              }}
            >
              <Typography sx={{ fontSize: '12px', color: '#17171A', fontWeight: 600, mb: 0.7, lineHeight: 1.45 }}>
                {rec.message}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={() => navigate(rec.path)}
                sx={{
                  borderRadius: 1.6,
                  textTransform: 'none',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: BRAND_PRIMARY,
                  borderColor: alpha(BRAND_PRIMARY, 0.3),
                  '&:hover': { borderColor: BRAND_PRIMARY, bgcolor: alpha(BRAND_PRIMARY, 0.08) },
                }}
              >
                {rec.action}
              </Button>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}
