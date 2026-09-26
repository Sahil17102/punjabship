import { alpha, Box, Container, Divider, Link, Paper, Stack, Typography } from '@mui/material'
import { FiCreditCard, FiFileText, FiShield } from 'react-icons/fi'
import TermsOfService from '../../components/terms/TermsOfService'
import PageHeading from '../../components/UI/heading/PageHeading'
import CompanyDetails from './CompanyDetails'

const PolicyPages = () => {
  const BRAND_PRIMARY = '#0877C9'
  const BRAND_WINE = '#B8D719'

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3.5 },
          borderRadius: 5,
          border: `1px solid ${alpha(BRAND_PRIMARY, 0.12)}`,
          background:
            'radial-gradient(circle at top right, rgba(8,119,201,0.12) 0%, transparent 24%), linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,247,250,0.98) 100%)',
          boxShadow: '0 18px 38px rgba(20, 20, 20, 0.08)',
        }}
      >
        <PageHeading
          title="Legal & Policy Information"
          subtitle="All policies, terms, privacy details, and company information for PunjabShip in one clear, professional reference space."
        />
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2} mt={2}>
          {[
            'Privacy and data handling',
            'Terms and service usage',
            'Refund and cancellation rules',
          ].map((item) => (
            <Typography
              key={item}
              sx={{
                alignSelf: 'flex-start',
                px: 1.5,
                py: 0.8,
                borderRadius: '999px',
                bgcolor: alpha(BRAND_PRIMARY, 0.08),
                color: BRAND_PRIMARY,
                fontWeight: 700,
                fontSize: '0.84rem',
              }}
            >
              {item}
            </Typography>
          ))}
        </Stack>
      </Paper>

      <Box sx={{ mt: 4 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <Box
            sx={{
              width: 44,
              height: 44,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 3,
              bgcolor: alpha(BRAND_WINE, 0.1),
              color: BRAND_WINE,
            }}
          >
            <FiCreditCard size={22} />
          </Box>
          <Typography variant="h4" fontWeight={800} color="#17171A">
            Refund & Cancellation Policy
          </Typography>
        </Box>
        <Typography paragraph>
          • You may cancel your account at any time by emailing us at{' '}
          <Link href="mailto:info@punjabshiplogistics.com">info@punjabshiplogistics.com</Link>.
        </Typography>
        <Typography paragraph>
          • Once your account is cancelled, all of your data and content will be permanently deleted
          from our Service. Since deletion is final and irreversible, please ensure you truly wish
          to cancel your account before proceeding.
        </Typography>
        <Typography paragraph>
          • If you cancel the Service in the middle of a billing cycle, you will receive a final
          invoice via email. Once that invoice has been paid, no further charges will apply.
        </Typography>
        <Typography paragraph>
          • PunjabShip reserves the right to modify, suspend, or terminate the Service for any reason,
          without prior notice at any time.
        </Typography>
        <Typography paragraph>
          • Fraud Prevention: Without limiting any other remedies, PunjabShip may suspend or terminate
          your account if we suspect that you (through conviction, settlement, investigation, or
          otherwise) have engaged in fraudulent or unlawful activity in connection with the
          Platform.
        </Typography>
        <Typography paragraph>
          • Note: No refunds are provided, even if a subscription or plan is cancelled mid-cycle.
        </Typography>
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Privacy Policy */}
      <Box sx={{ mt: 4 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <Box
            sx={{
              width: 44,
              height: 44,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 3,
              bgcolor: alpha(BRAND_PRIMARY, 0.08),
              color: BRAND_PRIMARY,
            }}
          >
            <FiShield size={22} />
          </Box>
          <Typography variant="h4" fontWeight={800} color="#17171A">
            Privacy Policy
          </Typography>
        </Box>
        <Typography paragraph>Last Updated: [Insert Date]</Typography>
        <Typography paragraph>
          PunjabShip ("we," "our," or "us") operates the services offered via our website and related
          platforms (collectively, the “Platform”). Please read this Privacy Policy carefully before
          accessing or using our Platform, as continued use indicates your acceptance of this
          Policy.
        </Typography>
        <Typography paragraph>
          1. Introduction
          <br />
          This Privacy Policy governs the collection, use, disclosure, and protection of your
          personal information when you use our services. By using the Platform, you consent to the
          terms outlined herein.
        </Typography>
        <Typography paragraph>
          2. Definitions
          <br />
          • “Personal Information”: Any information that can identify you, directly or indirectly.
          <br />• “Sensitive Personal Data or Information”: Includes passwords, payment details,
          health data, biometric information, etc., excluding publicly available information or data
          disclosed under legal obligations.
        </Typography>
        <Typography paragraph>
          3. Information We Collect
          <br />
          When you engage with our Platform, we may collect:
          <br />
          • Contact details: name, email address, phone number, postal address.
          <br />
          • Account credentials and profile information.
          <br />
          • Transactional or usage data including order history or Platform activity.
          <br />
          • Location information via IP address.
          <br />
          • Sensitive documents you volunteer (e.g., identity proofs or tax documentation).
          <br />• Technical details: browser type, device type, operating system, and usage metrics.
        </Typography>
        <Typography paragraph>
          4. Method of Collection
          <br />
          Information is collected:
          <br />
          • Directly from you when you fill out forms or communicate with us.
          <br />• Automatically via technology (e.g. cookies, log files) during your use of the
          Platform.
        </Typography>
        <Typography paragraph>
          5. Purpose of Use
          <br />
          We use your data to:
          <br />
          • Register and manage your account.
          <br />
          • Deliver services, process orders, and enable billing.
          <br />
          • Notify you about updates, changes, or new services.
          <br />
          • Customize and improve the Platform experience.
          <br />
          • Conduct research, analytics, and business operations.
          <br />
          • Safeguard against fraud and enforce terms.
          <br />• Comply with laws and regulatory obligations.
        </Typography>
        <Typography paragraph>
          6. Data Sharing & Disclosure
          <br />
          We may share your information with:
          <br />
          • Service providers who help deliver our services (e.g., IT partners, analytics
          platforms).
          <br />
          • Legal or governmental authorities, when required by law, to protect our rights, or to
          prevent fraud.
          <br />• Corporate transactions, such as mergers or asset transfers, where the acquiring
          entity is bound to this Policy.
        </Typography>
        <Typography paragraph>
          7. Security Measures
          <br />
          We implement industry-standard technical, physical, and administrative safeguards to
          protect your data. However, no security method is infallible, and we cannot guarantee
          complete protection against unauthorized access.
        </Typography>
        <Typography paragraph>
          8. Retention Period
          <br />
          We retain your personal data only as long as necessary to fulfill the purposes described,
          comply with applicable laws, resolve disputes, and enforce our agreements. After that,
          data may be anonymized or securely deleted.
        </Typography>
        <Typography paragraph>
          9. Your Privacy Rights
          <br />
          You may:
          <br />
          • Review, update, or correct your personal details.
          <br />
          • Withdraw your consent for data use (upon which we may limit or discontinue certain
          services).
          <br />
          To do so, please contact us at{' '}
          <Link href="mailto:info@punjabshiplogistics.com">info@punjabshiplogistics.com</Link>.
        </Typography>
        <Typography paragraph>
          10. Third-Party Links
          <br />
          Our Platform may contain links to external sites. We are not responsible for their privacy
          practices—please review their individual policies separately.
        </Typography>
        <Typography paragraph>
          11. Changes to this Policy
          <br />
          We may update this Privacy Policy occasionally. Significant changes will be notified
          through our Platform or via email. Continued use signifies your acceptance of the revised
          terms.
        </Typography>
        <Typography paragraph>
          12. Grievance Officer
          <br />
          If you have questions, complaints, or wish to exercise your privacy rights, reach out to:
        </Typography>
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Terms of Service */}
      <Box sx={{ mt: 4 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <Box
            sx={{
              width: 44,
              height: 44,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 3,
              bgcolor: alpha(BRAND_PRIMARY, 0.08),
              color: BRAND_PRIMARY,
            }}
          >
            <FiFileText size={22} />
          </Box>
          <Typography variant="h4" fontWeight={800} color="#17171A">
            Terms of Service
          </Typography>
        </Box>

        {/* Paste your full Terms of Service text exactly as you provided */}
        <TermsOfService />
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Company Details - common for all */}
      <CompanyDetails />
    </Container>
  )
}

export default PolicyPages
