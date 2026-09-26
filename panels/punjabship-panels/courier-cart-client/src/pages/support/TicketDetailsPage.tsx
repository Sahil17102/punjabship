import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { useNavigate, useParams } from 'react-router-dom'
import StatusChip from '../../components/UI/chip/StatusChip'
import { useTicketById } from '../../hooks/User/useSupport'

const statusColorMap: Record<string, 'success' | 'pending' | 'error' | 'info'> = {
  open: 'info',
  in_progress: 'pending',
  resolved: 'success',
  closed: 'error',
}

export const TicketDetailsPage = () => {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: ticket, isLoading } = useTicketById(id)

  if (isLoading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 300 }}>
        <CircularProgress />
      </Stack>
    )
  }

  if (!ticket) {
    return (
      <Stack spacing={2}>
        <Typography variant="h6">Ticket not found</Typography>
        <Button variant="contained" onClick={() => navigate('/support/tickets')}>
          Back to Tickets
        </Button>
      </Stack>
    )
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5">Ticket Details</Typography>
        <Button variant="outlined" onClick={() => navigate('/support/tickets')}>
          Back to Tickets
        </Button>
      </Stack>

      <Box
        sx={{
          p: 3,
          borderRadius: 2,
          border: '1px solid #e0e0e0',
          bgcolor: '#fff',
        }}
      >
        <Typography variant="subtitle2" color="text.secondary">
          Ticket ID
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {ticket.id}
        </Typography>

        <Typography variant="subtitle2" color="text.secondary">
          Subject
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {ticket.subject}
        </Typography>

        <Typography variant="subtitle2" color="text.secondary">
          Category
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {ticket.category} &gt; {ticket.subcategory}
        </Typography>

        <Typography variant="subtitle2" color="text.secondary">
          Status
        </Typography>
        <StatusChip label={ticket.status} status={statusColorMap[ticket.status]} />
      </Box>
    </Stack>
  )
}

export default TicketDetailsPage


