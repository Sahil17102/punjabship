'use client'

import { Box, Typography } from '@mui/material'
import styles from './IntegrationsMarquee.module.css'

const logosRow1 = [
  '/logo/integrations/amazon.png',
  '/logo/integrations/aramex.webp',
  '/logo/integrations/bluedart.png',
  '/logo/integrations/delhivery.png',
  '/logo/integrations/magento.png',
  '/logo/integrations/dtdc.png',
]

const logosRow2 = [
  '/logo/integrations/ecomexpress.webp',
  '/logo/integrations/ekart.png',
  '/logo/integrations/shopify.webp',
  '/logo/integrations/woocommerce.webp',
  '/logo/integrations/delhivery.png',
  '/logo/integrations/bluedart.png',
]

export default function IntegrationsMarquee() {
  return (
    <Box component="section" width="100%">
      <Box sx={{ textAlign: 'center', mb: 2.5 }}>
        <Typography
          fontWeight={600}
          fontSize={'13px'}
          color="#4A5568"
          sx={{ letterSpacing: '0.5px', textTransform: 'uppercase' }}
        >
          Trusted by leading platforms
        </Typography>
      </Box>

      {/* Marquee Row 1 - Left */}
      <Box className={styles.marqueeWrapper} sx={{ mb: 1.5 }}>
        <Box className={`${styles.marquee} ${styles.marqueeLeft}`}>
          {[...logosRow1, ...logosRow1, ...logosRow1].map((logo, i) => (
            <Box key={`logo1-${i}`} className={styles.logoBox}>
              <Box
                sx={{
                  borderRadius: '8px',
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #E0E6ED',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.3s ease',
                  minWidth: '100px',
                  minHeight: '50px',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(51, 51, 105, 0.12)',
                  },
                }}
              >
                <img src={logo} alt="Integration Logo" className={styles.logoImg} />
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Marquee Row 2 - Right */}
      <Box className={styles.marqueeWrapper}>
        <Box className={`${styles.marquee} ${styles.marqueeRight}`}>
          {[...logosRow2, ...logosRow2, ...logosRow2].map((logo, i) => (
            <Box key={`logo2-${i}`} className={styles.logoBox}>
              <Box
                sx={{
                  borderRadius: '8px',
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #E0E6ED',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.3s ease',
                  minWidth: '100px',
                  minHeight: '50px',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(51, 51, 105, 0.12)',
                  },
                }}
              >
                <img src={logo} alt="Integration Logo" className={styles.logoImg} />
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  )
}
