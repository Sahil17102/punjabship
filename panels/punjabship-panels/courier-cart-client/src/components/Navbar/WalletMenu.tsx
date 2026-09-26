import { alpha, Box, Button, Skeleton, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { FaWallet } from 'react-icons/fa'
import { FiPlus } from 'react-icons/fi'
import { useAuth } from '../../context/auth/AuthContext'
import { useWalletBalance } from '../../hooks/useWalletBalance'
import AddMoneyDialog from '../AddMoneyDialog'

const BRAND_PRIMARY = '#0877C9'
const BRAND_DARK = '#17171A'

interface WalletMenuProps {
  iconOnly?: boolean
  iconOverride?: React.ReactNode
}

const WalletMenu = ({ iconOnly = false, iconOverride }: WalletMenuProps) => {
  const [dialogOpen, setDialogOpen] = useState(false)

  const { walletBalance, setWalletBalance } = useAuth()

  const { data, isLoading } = useWalletBalance(true)

  // ✅ Only set balance in context after render
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const balance = Number((data as any)?.data?.balance ?? data) // handle both shapes
    if (!isNaN(balance)) {
      setWalletBalance(balance)
    } else {
      setWalletBalance(0)
    }
  }, [data, setWalletBalance])

  return (
    <>
      {iconOnly ? (
        <Box
          sx={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: 2,
            background: 'rgba(0, 0, 0, 0.02)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            color: BRAND_PRIMARY,
            transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              background: `rgba(217, 4, 22, 0.08)`,
              borderColor: `rgba(217, 4, 22, 0.2)`,
              boxShadow: `0 4px 12px rgba(217, 4, 22, 0.12)`,
              transform: 'translateY(-2px)',
            },
          }}
          onClick={() => setDialogOpen(true)}
        >
          {iconOverride || <FaWallet size={16} />}
        </Box>
      ) : (
        <Box
          sx={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: { xs: 1.0, sm: 1.4 },
            px: { xs: 1.0, sm: 1.3 },
            py: { xs: 0.65, sm: 0.85 },
            minHeight: { xs: 40, sm: 46 },
            minWidth: { xs: 180, sm: 240 },
            borderRadius: 2.5,
            background: 'rgba(0, 0, 0, 0.02)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              background: `rgba(217, 4, 22, 0.06)`,
              borderColor: `rgba(217, 4, 22, 0.15)`,
              boxShadow: `0 8px 20px rgba(217, 4, 22, 0.1)`,
              transform: 'translateY(-2px)',
            },
          }}
          onClick={() => setDialogOpen(true)}
        >
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.8, sm: 1.2 }, minWidth: 0 }}
          >
            <Box
              sx={{ display: 'flex', alignItems: 'center', color: BRAND_PRIMARY, flexShrink: 0 }}
            >
              {iconOverride || <FaWallet size={18} />}
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: { xs: '0.95rem', sm: '1.1rem' },
                  fontWeight: 700,
                  color: BRAND_DARK,
                  lineHeight: 1.2,
                  mt: 0.3,
                }}
              >
                {isLoading || walletBalance === null ? (
                  <Skeleton
                    variant="text"
                    width={60}
                    height={22}
                    sx={{ bgcolor: alpha(BRAND_PRIMARY, 0.12) }}
                  />
                ) : (
                  `₹${walletBalance?.toLocaleString('en-IN')}`
                )}
              </Typography>
            </Box>
          </Box>
          <Button
            size="small"
            startIcon={<FiPlus size={14} />}
            onClick={(e) => {
              e.stopPropagation()
              setDialogOpen(true)
            }}
            sx={{
              height: 32,
              minHeight: 32,
              px: 1.2,
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.75rem',

              color: '#fff',
              background: `black`,

              boxShadow: '0 6px 14px rgba(217, 4, 22, 0.18)',
              transition: 'all 0.18s ease',

              flexShrink: 0,
              whiteSpace: 'nowrap',

              '& .MuiButton-startIcon': {
                marginRight: 0.6,
              },

              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: '0 10px 20px rgba(217, 4, 22, 0.25)',
                background: `linear-gradient(135deg, #B40312 0%, #8F0210 100%)`,
              },

              '&:active': {
                transform: 'translateY(0px)',
              },
            }}
          >
            Add Balance
          </Button>
        </Box>
      )}

      <AddMoneyDialog
        currentBalance={walletBalance ?? 0}
        open={dialogOpen}
        setOpen={setDialogOpen}
      />
    </>
  )
}

export default WalletMenu
