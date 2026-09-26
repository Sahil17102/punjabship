import {
  alpha,
  Box,
  Button,
  Card,
  CardActionArea,
  Grid,
  IconButton,
  Stack,
  styled,
  Typography,
} from '@mui/material'
import { BiEdit } from 'react-icons/bi'
import { FaClock } from 'react-icons/fa6'
import { FcCancel } from 'react-icons/fc'
import { MdCheckCircle, MdDeleteOutline } from 'react-icons/md'
import type { BankAccount } from '../../../../types/user.types'
import { toast } from '../../../UI/Toast'

/* ---------- Styled components ---------- */
const GlassCard = styled(Card)(() => ({
  backgroundColor: '#FFFFFF',
  border: '1px solid rgba(15, 23, 42, 0.08)',
  borderRadius: 0,
  overflow: 'hidden',
  minHeight: 150,
  boxShadow: 'none',
  transition: 'border-color 0.2s ease, background-color 0.2s ease',
  '&:hover': {
    borderColor: 'rgba(217, 4, 22, 0.22)',
    backgroundColor: '#FBFCFE',
  },
}))

const GradientBg = styled('div')(() => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: 3,
  background: '#B8D719',
  zIndex: 2,
}))

const PrimaryRibbon = styled('div')(() => ({
  position: 'absolute',
  top: 16,
  right: 16,
  background: '#16181D',
  color: '#FFFFFF',
  padding: '6px 14px',
  borderRadius: 0,
  fontSize: '0.7rem',
  fontWeight: 700,
  letterSpacing: 0.5,
  textTransform: 'uppercase',
  zIndex: 3,
  boxShadow: 'none',
}))

/* ---------- List container ---------- */
export const BankAccountsList: React.FC<{
  accounts: BankAccount[]
  onMakePrimary?: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onShowToast?: (msg: string) => void
}> = ({ accounts, onMakePrimary, onEdit, onDelete }) => {
  const upiAccounts = accounts.filter(
    (a) => !!a.upiId && (a.accountNumber === '—' || !a.accountNumber),
  )
  const bankAccounts = accounts.filter((a) => !upiAccounts.includes(a))

  const renderSection = (title: string, list: BankAccount[]) =>
    list.length > 0 && (
      <>
        <Typography
          variant="h6"
          sx={{
            mb: 2.5,
            mt: 4,
            pl: 0.5,
            fontWeight: 700,
            color: '#111827',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            '&::before': {
              content: '""',
              width: 4,
              height: 24,
              bgcolor: '#B8D719',
            },
          }}
        >
          {title}
        </Typography>
        <Grid container spacing={3}>
          {list.map((acc) => (
            <Grid size={{ md: 6, xs: 12 }} key={acc.id}>
              <BankAccountCard
                account={acc}
                onMakePrimary={onMakePrimary}
                onEdit={onEdit}
                onDelete={onDelete}
                onShowToast={(msg) =>
                  toast.open({ message: msg, severity: 'info', duration: 4000 })
                }
              />
            </Grid>
          ))}
        </Grid>
      </>
    )

  return (
    <>
      {renderSection('Bank Accounts', bankAccounts)}
      {renderSection('UPI IDs', upiAccounts)}
    </>
  )
}

/* ---------- Single‑card component ---------- */
export const BankAccountCard: React.FC<{
  account: BankAccount
  onMakePrimary?: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onShowToast?: (msg: string) => void
}> = ({ account: a, onMakePrimary, onEdit, onDelete, onShowToast }) => {
  const isUpiOnly = !!a.upiId && (a.accountNumber === '—' || !a.accountNumber)
  const canDelete =
    a.status === 'pending' || a.status === 'rejected' || (a.status === 'verified' && !a.isPrimary)

  const handleDelete = () => {
    if (canDelete) {
      onDelete?.(a.id)
    } else {
      onShowToast?.('To delete this account, set another account as Primary first.')
    }
  }

  return (
    <Box sx={{ position: 'relative', borderRadius: 0, overflow: 'visible' }}>
      {a.isPrimary && <PrimaryRibbon>Primary</PrimaryRibbon>}

      <GlassCard sx={{ position: 'relative', zIndex: 1 }}>
        <GradientBg />
        <CardActionArea sx={{ p: 3, minHeight: 150, pt: 3.5 }}>
          <Stack direction="row" spacing={2.5} alignItems="flex-start">
            <Stack spacing={0.8} flex={1} minWidth={0}>
              <Typography
                variant="subtitle1"
                display="flex"
                alignItems="center"
                gap={1}
                fontWeight={700}
                color="#1A1A1A"
                noWrap
              >
                {isUpiOnly ? a.accountHolder : a.bankName}
                {a.status === 'verified' ? (
                  <MdCheckCircle color="#3DD598" size={20} />
                ) : a.status === 'pending' ? (
                  <FaClock color="#FFA726" size={16} />
                ) : (
                  <FcCancel size={20} />
                )}
              </Typography>

              {!isUpiOnly && (
                <Typography variant="body2" color="#4A5568" noWrap fontWeight={500}>
                  {a.accountHolder}
                </Typography>
              )}

              {isUpiOnly ? (
                <Typography variant="body2" color="#4A5568" noWrap>
                  UPI ID: {a.upiId}
                </Typography>
              ) : (
                <>
                  <Typography variant="body2" color="#4A5568" noWrap>
                    A/C No: {a.accountNumber}
                  </Typography>
                  <Typography variant="body2" color="#4A5568" noWrap>
                    IFSC {a.ifsc}
                    {a.branch && ` • ${a.branch}`}
                  </Typography>
                </>
              )}

              {a.status === 'rejected' && a.rejectionReason && (
                <Typography
                  variant="caption"
                  sx={{
                    color: '#E74C3C',
                    fontStyle: 'italic',
                    fontWeight: 600,
                    mt: 0.5,
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                    bgcolor: 'rgba(231, 76, 60, 0.1)',
                    p: 1,
                    borderRadius: 1,
                  }}
                >
                  Rejected: {a.rejectionReason}
                </Typography>
              )}

              <Stack direction="row" spacing={1} mt={1.5} justifyContent="flex-end">
                {a.status === 'verified' && !a.isPrimary && (
                  <Button
                    size="small"
                    variant="contained"
                    disabled={a.isPrimary || a.status !== 'verified'}
                    onClick={() => onMakePrimary?.(a.id)}
                    sx={{
                      bgcolor: '#16181D',
                      color: '#FFFFFF',
                      fontWeight: 600,
                      px: 2,
                      py: 0.8,
                      borderRadius: 0,
                      textTransform: 'none',
                      boxShadow: 'none',
                      '&:hover': {
                        bgcolor: '#111827',
                      },
                    }}
                  >
                    Make Primary
                  </Button>
                )}

                {a.status !== 'verified' && (
                  <IconButton
                    size="small"
                    aria-label="Edit account"
                    onClick={() => onEdit?.(a.id)}
                    sx={{
                      color: '#111827',
                      bgcolor: '#FFFFFF',
                      border: '1px solid rgba(15, 23, 42, 0.12)',
                      '&:hover': {
                        bgcolor: '#F8FAFC',
                      },
                    }}
                  >
                    <BiEdit size={18} />
                  </IconButton>
                )}

                <IconButton
                  size="small"
                  aria-label="Delete account"
                  onClick={handleDelete}
                  sx={{
                    color: '#E74C3C',
                    bgcolor: alpha('#E74C3C', 0.08),
                    border: '1px solid rgba(231, 76, 60, 0.2)',
                    '&:hover': {
                      bgcolor: alpha('#E74C3C', 0.14),
                    },
                  }}
                >
                  <MdDeleteOutline size={18} />
                </IconButton>
              </Stack>
            </Stack>
          </Stack>
        </CardActionArea>
      </GlassCard>
    </Box>
  )
}
