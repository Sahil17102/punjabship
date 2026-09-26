import { alpha } from '@mui/material/styles'
import { Box, Chip, Stack, Typography } from '@mui/material'
import { FiCheckCircle, FiLink, FiTool } from 'react-icons/fi'
import CustomInput from '../UI/inputs/CustomInput'
import type { UserInfoData } from '../../types/user.types'
import type { FormErrors } from '../../pages/onboarding/UserOnboarding'

interface IStepThree {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formData: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: any
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    subKey?: keyof UserInfoData,
  ) => void
  setErrors: React.Dispatch<React.SetStateAction<FormErrors>>
}

const BRAND_ORANGE = '#0877C9'
const BRAND_INK = '#141414'

export default function StepThree({ formData, errors, onChange, setErrors }: IStepThree) {
  return (
    <Stack spacing={{ xs: 2.2, md: 2.8 }}>
      <Box>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            color: BRAND_INK,
            mb: 0.8,
            fontSize: { xs: '1.2rem', sm: '1.45rem', md: '1.65rem' },
          }}
        >
          Integrations & Storefront
        </Typography>
        <Typography variant="body2" sx={{ color: '#6E6763', fontSize: { xs: '0.82rem', sm: '0.9rem' } }}>
          Add your website now. Direct platform integrations can be enabled later from settings.
        </Typography>
      </Box>

      <Box
        sx={{
          p: { xs: 2, md: 2.6 },
          borderRadius: 4,
          border: `1px solid ${alpha(BRAND_ORANGE, 0.2)}`,
          background: `linear-gradient(180deg, ${alpha(BRAND_ORANGE, 0.08)} 0%, ${alpha(
            BRAND_ORANGE,
            0.04,
          )} 100%)`,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" mb={1.1}>
          <FiTool size={16} color={BRAND_ORANGE} />
          <Typography sx={{ fontWeight: 700, color: BRAND_INK, fontSize: '0.95rem' }}>
            Shopify and WooCommerce integrations are available
          </Typography>
        </Stack>
        <Typography variant="body2" sx={{ color: '#6E6763', lineHeight: 1.7 }}>
          You can finish onboarding now and connect Shopify or WooCommerce from the Integrations page.
          Amazon and other channels will be added separately as they become available.
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} mt={1.4}>
          <Chip
            icon={<FiCheckCircle size={13} />}
            label="Available now"
            size="small"
            sx={{ backgroundColor: '#fff', border: `1px solid ${alpha(BRAND_ORANGE, 0.16)}`, color: BRAND_ORANGE }}
          />
          <Chip
            icon={<FiLink size={13} />}
            label="Connect from Integrations"
            size="small"
            sx={{ backgroundColor: '#fff', border: `1px solid ${alpha(BRAND_ORANGE, 0.16)}`, color: BRAND_ORANGE }}
          />
        </Stack>
      </Box>

      <Box
        sx={{
          p: { xs: 2, md: 2.6 },
          borderRadius: 4,
          border: '1px solid rgba(20,20,20,0.08)',
          backgroundColor: '#fff',
        }}
      >
        <CustomInput
          onChange={(e) => onChange(e, 'basicInfo')}
          onBlur={(e) => {
            const value = e.target.value?.trim()
            const isValidURL =
              !value ||
              /^(https?:\/\/)?([\w\d-]+\.)+[\w]{2,}(\/[\w\d#?&=.-]*)*\/?$/.test(value)

            setErrors((prev) => ({
              ...prev,
              basicInfo: {
                ...prev.basicInfo,
                personalWebsite: !isValidURL
                  ? 'Enter a valid website URL (e.g., https://yourstore.com)'
                  : '',
              },
            }))
          }}
          id="personalWebsite"
          value={formData?.basicInfo?.personalWebsite}
          name="personalWebsite"
          label="Website or Storefront URL (optional)"
          error={!!errors?.basicInfo?.personalWebsite}
          helperText={errors?.basicInfo?.personalWebsite}
        />
      </Box>
    </Stack>
  )
}
