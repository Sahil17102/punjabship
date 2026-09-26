// src/components/support/TicketStatusSummaryCard.tsx
import { Box, Card, CardContent, Grid, Typography } from '@mui/material'
import { FaBug, FaClock, FaHourglassHalf, FaRegCheckCircle, FaTimesCircle } from 'react-icons/fa'
import type { TicketStatus } from '../../api/support.api'

interface Props {
  counts: Record<TicketStatus, number>
}

const summaryItems = (counts: Record<string, number>) => [
  {
    label: 'Open',
    value: counts.open || 0,
    icon: <FaBug size={24} color="#f57c00" />,
  },
  {
    label: 'In Progress',
    value: counts.in_progress || 0,
    icon: <FaHourglassHalf size={24} color="#0288d1" />,
  },
  {
    label: 'Resolved',
    value: counts.resolved || 0,
    icon: <FaRegCheckCircle size={24} color="#2e7d32" />,
  },
  {
    label: 'Closed',
    value: counts.closed || 0,
    icon: <FaTimesCircle size={24} color="#757575" />,
  },
  {
    label: 'Overdue',
    value: counts.overdue || 0,
    icon: <FaClock size={24} color="#d32f2f" />,
  },
]

export default function TicketStatusSummaryCard({ counts }: Props) {
  return (
    <Grid container spacing={2}>
      {summaryItems(counts).map(({ label, value, icon }) => (
        <Grid key={label} size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }} sx={{ display: 'flex' }}>
          <Card
            variant="outlined"
            sx={{
              width: '100%',
              background: '#FFFFFF',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <CardContent
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                px: 2,
                py: 1.5,
              }}
            >
              <Box>{icon}</Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {label}
                </Typography>
                <Typography variant="h6" fontWeight={600}>
                  {value}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}
