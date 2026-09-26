import { Box, Link, List, ListItem, ListItemText } from '@mui/material'
import PageHeading from '../../components/UI/heading/PageHeading'

const CancellationPolicy = () => {
  return (
    <Box sx={{ py: 2 }}>
      <PageHeading title="Refund & Cancellation Policy" />

      <List sx={{ listStyleType: 'disc', pl: 3 }}>
        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText
            primary={
              <>
                You may cancel your account at any time by emailing us at{' '}
                <Link href="mailto:info@punjabshiplogistics.com">info@punjabshiplogistics.com</Link>.
              </>
            }
          />
        </ListItem>

        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="Once your account is cancelled, all of your data and content will be permanently deleted from our Service. Since deletion is final and irreversible, please ensure you truly wish to cancel your account before proceeding." />
        </ListItem>

        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="If you cancel the Service in the middle of a billing cycle, you will receive a final invoice via email. Once that invoice has been paid, no further charges will apply." />
        </ListItem>

        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="PunjabShip reserves the right to modify, suspend, or terminate the Service for any reason, without prior notice at any time." />
        </ListItem>

        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="Fraud Prevention: Without limiting any other remedies, PunjabShip may suspend or terminate your account if we suspect that you have engaged in fraudulent or unlawful activity in connection with the Platform." />
        </ListItem>

        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="Note: No refunds are provided, even if a subscription or plan is cancelled mid-cycle." />
        </ListItem>
      </List>
    </Box>
  )
}

export default CancellationPolicy
