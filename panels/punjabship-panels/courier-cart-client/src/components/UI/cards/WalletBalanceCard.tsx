import { alpha, Box, Button, Chip, Stack, Typography, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import React, { useState } from 'react'
import { BsWallet2 } from 'react-icons/bs'
import AddMoneyDialog from '../../AddMoneyDialog'
import StatusChip from '../chip/StatusChip'

const BRAND_GREEN = '#4b8e40'
const BRAND_ORANGE = '#f89a3a'

interface WalletBalanceCardProps {
  balance: number
  buttonText?: string
  description?: string
  additionalOffers?: number
  showCashback?: boolean
  cashbackText?: string
}

const WalletBalanceCard: React.FC<WalletBalanceCardProps> = ({
  balance,
  buttonText = 'Recharge',
  description = '',
  additionalOffers = 0,
  showCashback = false,
  cashbackText = '25% Cashback on min recharge of ₹200',
}) => {
  const isRecharged = balance > 0
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')) // e.g., <600px

  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <Box
        sx={{
          bgcolor: '#ffffff',
          borderRadius: 3,
          p: { xs: 2.5, md: 3 },
          border: `1.5px solid ${alpha(BRAND_ORANGE, 0.2)}`,
          boxShadow: `0 4px 16px ${alpha(BRAND_ORANGE, 0.12)}`,
          position: 'relative',
          overflow: 'visible',
          background: `linear-gradient(135deg, #FFFFFF 0%, ${alpha(BRAND_ORANGE, 0.03)} 100%)`,
        }}
      >
        {/* Status Badge */}
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="flex-start"
          justifyContent="space-between"
          mb={2}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" flex={1}>
            <Box
              sx={{
                bgcolor: alpha(BRAND_ORANGE, 0.12),
                borderRadius: 2,
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BsWallet2 size={24} color={BRAND_ORANGE} />
            </Box>
            <Stack spacing={0.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: BRAND_ORANGE,
                    fontSize: { xs: '1rem', md: '1.125rem' },
                  }}
                >
                  Recharge Wallet
                </Typography>
                {isRecharged ? (
                  <StatusChip status="success" label="Done" />
                ) : (
                  <StatusChip status="pending" label="Pending" />
                )}
              </Stack>
              <Typography
                variant="body2"
                sx={{
                  color: '#6b6b6b',
                  fontSize: { xs: '0.8rem', md: '0.875rem' },
                }}
              >
                Add funds to pay for shipping
              </Typography>
            </Stack>
          </Stack>

          {/* Floating Offers Chip */}
          {additionalOffers > 0 && (
            <Chip
              label={`+${additionalOffers} Offers`}
              size="small"
              sx={{
                bgcolor: BRAND_ORANGE,
                color: '#fff',
                fontSize: '0.7rem',
                fontWeight: 600,
                height: 24,
                boxShadow: `0 2px 8px ${alpha(BRAND_ORANGE, 0.3)}`,
              }}
            />
          )}
        </Stack>

        {/* Balance Display */}
        <Box
          sx={{
            bgcolor: alpha(BRAND_ORANGE, 0.06),
            borderRadius: 2,
            p: 2,
            mb: 2,
            border: `1px solid ${alpha(BRAND_ORANGE, 0.15)}`,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: '#6b6b6b',
              fontSize: '0.75rem',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              display: 'block',
              mb: 0.5,
            }}
          >
            Current Balance
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: BRAND_ORANGE,
              fontSize: { xs: '1.75rem', md: '2rem' },
              lineHeight: 1.2,
            }}
          >
            ₹
            {balance.toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Typography>
        </Box>

        {/* Cashback Offer */}
        {showCashback && (
          <Box
            sx={{
              bgcolor: alpha(BRAND_GREEN, 0.08),
              borderRadius: 1.5,
              p: 1.5,
              mb: 2,
              border: `1px solid ${alpha(BRAND_GREEN, 0.2)}`,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: BRAND_GREEN,
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              🎉 {cashbackText}
            </Typography>
          </Box>
        )}

        {/* Description */}
        {description && (
          <Typography
            variant="body2"
            sx={{
              color: '#6b6b6b',
              mb: 2,
              fontSize: '0.875rem',
            }}
          >
            {description}
          </Typography>
        )}

        {/* Recharge Button */}
        <Button
          variant="contained"
          fullWidth={isMobile}
          onClick={() => setDialogOpen(true)}
          sx={{
            bgcolor: BRAND_ORANGE,
            color: '#ffffff',
            fontWeight: 600,
            py: 1.25,
            borderRadius: 2,
            textTransform: 'none',
            fontSize: { xs: '0.875rem', md: '0.9rem' },
            boxShadow: `0 4px 12px ${alpha(BRAND_ORANGE, 0.3)}`,
            '&:hover': {
              bgcolor: '#d67e26',
              boxShadow: `0 6px 16px ${alpha(BRAND_ORANGE, 0.4)}`,
              transform: 'translateY(-1px)',
            },
            transition: 'all 0.2s ease',
          }}
        >
          {buttonText}
        </Button>
      </Box>
      <AddMoneyDialog currentBalance={balance ?? 0} open={dialogOpen} setOpen={setDialogOpen} />
    </>
  )
}

export default WalletBalanceCard
