import { Box } from '@mui/material'
import AllOrders from '../../components/orders/AllOrders'

export default function Orders() {
  return (
    <Box sx={{ py: { xs: 2.2, md: 1 } }}>
      <AllOrders />
    </Box>
  )
}
