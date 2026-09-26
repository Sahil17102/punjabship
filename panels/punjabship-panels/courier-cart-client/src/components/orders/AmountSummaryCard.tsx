import { alpha, Grid, Paper, Stack, Typography } from '@mui/material'
import { type FieldErrors } from 'react-hook-form'
import { FaMoneyBillWave, FaRupeeSign, FaShoppingCart } from 'react-icons/fa'

const ACCENT = '#0877C9'
const TEXT_PRIMARY = '#17171A'

interface OrderSummaryProps {
  subtotal: number
  totalOrderValue: number
  totalCollectable: number
  errors?: FieldErrors<any>
  subtotalLabel?: string
  totalOrderValueLabel?: string
  totalCollectableLabel?: string
  subtotalErrorField?: string
  totalOrderValueErrorField?: string
  totalCollectableErrorField?: string
}

const AmountSummaryCard = ({
  subtotal,
  totalOrderValue,
  totalCollectable,
  errors,
  subtotalLabel = 'Sub-total for Product(s)',
  totalOrderValueLabel = 'Total Order Value',
  totalCollectableLabel = 'Total Collectable Value',
  subtotalErrorField = 'products',
  totalOrderValueErrorField = 'totalOrderValue',
  totalCollectableErrorField = 'prepaidAmount',
}: OrderSummaryProps) => {
  const hasError = (field?: string) => Boolean(field && errors && errors[field])

  return (
    <Grid size={12}>
      <Paper
        sx={{
          p: 3,
          mt: 1,
          borderRadius: 3,
          backgroundColor: '#FFFFFF',
          color: TEXT_PRIMARY,
          boxShadow: `0 4px 14px ${alpha(ACCENT, 0.06)}`,
          border: `1px solid ${alpha(ACCENT, 0.12)}`,
        }}
      >
        <Stack spacing={2}>
          {/* Sub-total */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1} alignItems="center">
              <FaRupeeSign size={16} color={hasError(subtotalErrorField) ? '#E74C3C' : ACCENT} />
              <Typography
                variant="body2"
                sx={{
                  color: hasError(subtotalErrorField) ? '#E74C3C' : ACCENT,
                  fontWeight: 600,
                }}
              >
                {subtotalLabel}
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: TEXT_PRIMARY, fontWeight: 700 }}>
              ₹{' '}
              {subtotal.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Typography>
          </Stack>

          {/* Total Order Value */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1} alignItems="center">
              <FaShoppingCart
                size={15}
                color={hasError(totalOrderValueErrorField) ? '#E74C3C' : ACCENT}
              />
              <Typography
                variant="body2"
                sx={{
                  color: hasError(totalOrderValueErrorField) ? '#E74C3C' : ACCENT,
                  fontWeight: 600,
                }}
              >
                {totalOrderValueLabel}
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: TEXT_PRIMARY, fontWeight: 700 }}>
              ₹{' '}
              {totalOrderValue.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Typography>
          </Stack>

          {/* Total Collectable */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{
              mt: 1,
              pt: 1.5,
              borderTop: `2px solid ${hasError(totalCollectableErrorField) ? '#E74C3C' : ACCENT}`,
              backgroundColor: hasError(totalCollectableErrorField)
                ? alpha('#E74C3C', 0.05)
                : alpha(ACCENT, 0.05),
              borderRadius: 2.5,
              px: 2.5,
              py: 1.5,
              transition: 'all 0.2s ease',
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <FaMoneyBillWave
                size={20}
                color={hasError(totalCollectableErrorField) ? '#E74C3C' : ACCENT}
              />
              <Typography
                variant="body1"
                fontWeight={700}
                sx={{
                  color: hasError(totalCollectableErrorField) ? '#E74C3C' : ACCENT,
                  fontSize: { xs: '0.95rem', sm: '1rem' },
                }}
              >
                {totalCollectableLabel}
              </Typography>
            </Stack>
            <Typography
              variant="body1"
              fontWeight={700}
              sx={{
                color: hasError(totalCollectableErrorField) ? '#E74C3C' : TEXT_PRIMARY,
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
              }}
            >
              ₹{' '}
              {totalCollectable.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Typography>
          </Stack>
        </Stack>
      </Paper>
    </Grid>
  )
}

export default AmountSummaryCard
