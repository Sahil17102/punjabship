import { Box, Link, List, ListItem, ListItemText, Typography } from '@mui/material'
import PageHeading from '../../components/UI/heading/PageHeading'

const PrivacyPolicy = () => {
  return (
    <Box sx={{ py: 2 }}>
      <PageHeading title="Privacy Policy" />

      <Typography variant="caption" mt={2} display="block" gutterBottom>
        Last Updated: 8 September 2025
      </Typography>

      <List sx={{ listStyleType: 'disc', pl: 3 }}>
        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="Introduction: This Privacy Policy governs the collection, use, disclosure, and protection of your personal information when you use our services. By using the Platform, you consent to the terms outlined herein." />
        </ListItem>

        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText
            primary={
              'Definitions: “Personal Information” means any data that can identify you directly or indirectly. “Sensitive Personal Data” includes passwords, payment details, health data, and biometric information (excluding publicly available data or that disclosed under legal obligations).'
            }
          />
        </ListItem>

        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="Information We Collect: Contact details (name, email, phone, address), account credentials, order/transaction history, IP/location, identity proofs (if provided), and technical details like browser, device, and usage patterns." />
        </ListItem>

        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="Method of Collection: Data is collected directly from you (forms, communication) or automatically via cookies, log files, and similar technologies." />
        </ListItem>

        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="Purpose of Use: To manage your account, process orders, enable billing, notify you about updates, customize your experience, conduct analytics, safeguard against fraud, and comply with legal obligations." />
        </ListItem>

        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="Data Sharing & Disclosure: We may share your data with trusted service providers, legal/government authorities when required, or in case of business transactions such as mergers and acquisitions." />
        </ListItem>

        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="Security Measures: We apply industry-standard safeguards to protect your data, but no system is 100% secure." />
        </ListItem>

        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="Retention Period: Data is retained only as long as necessary to fulfill stated purposes, comply with law, or resolve disputes. Thereafter, it is anonymized or securely deleted." />
        </ListItem>

        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText
            primary={
              <>
                Your Privacy Rights: You may review, update, or correct your details, or withdraw
                consent by contacting us at{' '}
                <Link href="mailto:info@punjabshiplogistics.com">info@punjabshiplogistics.com</Link>.
              </>
            }
          />
        </ListItem>

        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="Third-Party Links: Our Platform may contain links to third-party sites. We are not responsible for their privacy practices." />
        </ListItem>

        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText primary="Changes to this Policy: We may revise this Privacy Policy from time to time. Updates will be shared on the Platform or via email. Continued use indicates acceptance of changes." />
        </ListItem>

        <ListItem sx={{ display: 'list-item' }}>
          <ListItemText
            primary={
              <>
                Grievance Officer: If you have queries or complaints, reach out to us at{' '}
                <a
                  href="mailto:info@punjabshiplogistics.com"
                  style={{ color: '#fccf5e', textDecoration: 'none' }}
                >
                  info@punjabshiplogistics.com
                </a>
                .
              </>
            }
          />
        </ListItem>
      </List>
    </Box>
  )
}

export default PrivacyPolicy
