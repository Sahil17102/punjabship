import { Box, Link, List, ListItem, ListItemText, Stack, Typography } from '@mui/material'
import { useParams } from 'react-router-dom'
import PageHeading from '../../components/UI/heading/PageHeading'

type PolicyType = 'privacy-policy' | 'terms-of-service' | 'refund-policy' | 'support'

const PolicyShell = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Box sx={{ maxWidth: 900, mx: 'auto', px: { xs: 2, md: 4 }, py: 4 }}>
    <PageHeading title={title} />
    <Typography variant="caption" display="block" sx={{ mt: 1.5, mb: 2.5 }}>
      Last updated: 21 July 2026
    </Typography>
    <Stack spacing={2}>{children}</Stack>
  </Box>
)

const FreeAppTerms = () => (
  <PolicyShell title="PunjabShip Shopify App Terms of Service">
    <Typography>
      Access to the PunjabShip Shopify app is free. There is no app subscription, paid feature,
      installation fee, or app usage fee. PunjabShip does not charge buyers and does not act as a
      Shopify payment gateway.
    </Typography>
    <Typography>
      Merchants may optionally purchase courier labels and postage through PunjabShip. Money added
      to the PunjabShip wallet can be used only for courier, postage, and directly related shipping
      charges. These operational shipping purchases do not unlock app access or features.
    </Typography>
    <Typography>
      Merchants authorize PunjabShip to read selected orders and update order or fulfillment status
      only for shipping workflows they initiate. Merchants remain responsible for the accuracy of
      shipment details, lawful goods, packaging, customs/tax duties, and compliance with courier
      restrictions.
    </Typography>
    <Typography>
      PunjabShip never collects or refunds a buyer's Shopify order payment. Shopify order-payment
      refunds must be issued through Shopify and the original payment processor. Courier-service
      charge reversals are returned only to the same merchant PunjabShip wallet that paid the charge.
    </Typography>
    <Typography>
      Support for the Shopify app is available to every installed merchant at{' '}
      <Link href="mailto:info@punjabshiplogistics.com">info@punjabshiplogistics.com</Link>, Monday through Saturday,
      10:00 AM–7:00 PM India Standard Time.
    </Typography>
  </PolicyShell>
)

const FreeAppRefundPolicy = () => (
  <PolicyShell title="PunjabShip Shopify App Refund and Cancellation Policy">
    <Typography>
      The Shopify app is free, so there are no app subscription or app-feature charges to cancel
      or refund.
    </Typography>
    <Typography>
      A merchant can stop using the app and uninstall it from Shopify admin at any time. Uninstall
      revokes the connection and starts the Shopify privacy-deletion workflow.
    </Typography>
    <Typography>
      When an eligible courier booking is cancelled or a courier weight dispute is approved,
      PunjabShip reverses only the corresponding courier-service debit to the same merchant PunjabShip
      wallet. PunjabShip does not credit, replace, or refund the value of a buyer's Shopify order.
      Buyer order refunds remain the merchant's responsibility in Shopify and must use the original
      payment processor or Shopify's supported store-credit flow.
    </Typography>
    <Typography>
      Questions about a courier-service adjustment can be sent to{' '}
      <Link href="mailto:info@punjabshiplogistics.com">info@punjabshiplogistics.com</Link>.
    </Typography>
  </PolicyShell>
)

const ShopifyPrivacyPolicy = () => (
  <PolicyShell title="PunjabShip Shopify App Privacy Policy">
    <Typography>
      PunjabShip processes Shopify merchant and customer data only to import selected orders, create
      courier shipments and documents, provide tracking, and synchronize order and fulfillment
      status requested by the merchant.
    </Typography>
    <List sx={{ listStyleType: 'disc', pl: 3 }}>
      <ListItem sx={{ display: 'list-item' }}>
        <ListItemText primary="Data collected: shop identity, authorized order details, customer name, email, phone, shipping address, purchased items, and shipping/tracking records needed for fulfillment." />
      </ListItem>
      <ListItem sx={{ display: 'list-item' }}>
        <ListItemText primary="Data sharing: only contracted courier, infrastructure, email, and support providers needed to provide the requested shipping service, or authorities when legally required." />
      </ListItem>
      <ListItem sx={{ display: 'list-item' }}>
        <ListItemText primary="Security: encrypted transport, restricted production access, encrypted Shopify credentials, signed webhook verification, and access logging." />
      </ListItem>
      <ListItem sx={{ display: 'list-item' }}>
        <ListItemText primary="Retention: personal data is kept only while needed for the shipping service, support, fraud prevention, and documented legal obligations. Shopify privacy webhooks trigger export or redaction workflows; backups age out under restricted access." />
      </ListItem>
      <ListItem sx={{ display: 'list-item' }}>
        <ListItemText primary="Data requests: customer data requests are securely exported to the verified store owner, tracked to completion, and delivered within Shopify's required deadline." />
      </ListItem>
    </List>
    <Typography>
      Merchants or customers can request access, correction, or deletion through the Shopify store
      owner or by contacting <Link href="mailto:info@punjabshiplogistics.com">info@punjabshiplogistics.com</Link>.
    </Typography>
  </PolicyShell>
)

const ShopifySupport = () => (
  <PolicyShell title="PunjabShip Shopify App Support">
    <Typography>
      Shopify app support is free for all installed merchants. Email{' '}
      <Link href="mailto:info@punjabshiplogistics.com">info@punjabshiplogistics.com</Link> with your store name, a short
      description, and screenshots that do not expose unnecessary customer data.
    </Typography>
    <Typography>
      Support hours are Monday through Saturday, 10:00 AM–7:00 PM India Standard Time. Privacy and
      security reports are prioritized.
    </Typography>
  </PolicyShell>
)

export default function ShopifyAppPolicyPage() {
  const { policy } = useParams<{ policy?: PolicyType }>()

  if (policy === 'privacy-policy') return <ShopifyPrivacyPolicy />
  if (policy === 'refund-policy') return <FreeAppRefundPolicy />
  if (policy === 'support') return <ShopifySupport />
  return <FreeAppTerms />
}
