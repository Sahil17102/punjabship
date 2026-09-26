import { Box, ClickAwayListener, Grow, IconButton, Paper, Popper, Typography } from '@mui/material'
import { useRef, useState, type ReactNode } from 'react'
import { AiTwotoneThunderbolt } from 'react-icons/ai'
import { CgCalculator, CgTrack } from 'react-icons/cg'
import { FaTicket } from 'react-icons/fa6'
import { TbTruckDelivery } from 'react-icons/tb'
import { useNavigate } from 'react-router-dom'

const BRAND_PRIMARY = '#0877C9'
const BRAND_INK = '#17171A'

interface QuickActionsProps {
  compact?: boolean
  iconOverride?: ReactNode
}

const QuickActions = ({ compact = false, iconOverride }: QuickActionsProps) => {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLDivElement | null>(null)
  const navigate = useNavigate()

  const actions = [
    { icon: <TbTruckDelivery size={18} />, name: 'New Order', path: '/orders/create' },
    { icon: <CgCalculator size={18} />, name: 'Rate Calculator', path: '/tools/rate_calculator' },
    { icon: <CgTrack size={18} />, name: 'Track AWB', path: '/tools/order_tracking' },
    { icon: <FaTicket size={18} />, name: 'Create Ticket', path: '/support/tickets' },
  ]

  return (
    <>
      <Box ref={anchorRef} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
        <IconButton
          aria-label="Quick actions"
          sx={{
            width: compact ? 36 : 40,
            height: compact ? 36 : 40,
            borderRadius: 2,
            bgcolor: 'rgba(0, 0, 0, 0.02)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            color: BRAND_INK,
            transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              bgcolor: `rgba(217, 4, 22, 0.08)`,
              borderColor: `rgba(217, 4, 22, 0.2)`,
              color: BRAND_PRIMARY,
              boxShadow: `0 4px 12px rgba(217, 4, 22, 0.12)`,
              transform: 'translateY(-2px)',
            },
          }}
        >
          {iconOverride || <AiTwotoneThunderbolt size={18} />}
        </IconButton>
      </Box>

      <Popper
        open={open}
        anchorEl={anchorRef.current}
        placement="bottom-end"
        transition
        sx={{ zIndex: 2200 }}
        modifiers={[{ name: 'offset', options: { offset: [0, 8] } }]}
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps} timeout={200} style={{ transformOrigin: 'right top' }}>
            <Box>
              <ClickAwayListener onClickAway={() => setOpen(false)}>
                <Paper
                  elevation={0}
                  onMouseEnter={() => setOpen(true)}
                  onMouseLeave={() => setOpen(false)}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.4,
                    minWidth: 240,
                    p: 0.6,
                    borderRadius: 3.5,
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.1), 0 10px 20px rgba(0, 0, 0, 0.05)',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.99) 0%, rgba(255, 255, 255, 0.96) 100%)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                  }}
                >
                  {actions.map((action, index) => {
                    return (
                      <Box
                        key={action.name}
                        onClick={() => {
                          navigate(action.path)
                          setOpen(false)
                        }}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.0,
                          px: 1.0,
                          py: 0.75,
                          borderRadius: 2.5,
                          cursor: 'pointer',
                          color: BRAND_INK,
                          border: '1px solid transparent',
                          transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                          animation: open ? `slideUp 250ms cubic-bezier(0.4, 0, 0.2, 1) ${index * 40}ms both` : 'none',
                          '@keyframes slideUp': {
                            from: { opacity: 0, transform: 'translateY(8px)' },
                            to: { opacity: 1, transform: 'translateY(0)' },
                          },
                          '&:hover': {
                            bgcolor: `rgba(217, 4, 22, 0.08)`,
                            borderColor: `rgba(217, 4, 22, 0.2)`,
                            transform: 'translateX(2px)',
                          },
                        }}
                      >
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: 2,
                            display: 'grid',
                            placeItems: 'center',
                            bgcolor: `rgba(217, 4, 22, 0.08)`,
                            color: BRAND_INK,
                            transition: 'all 200ms ease',
                            flexShrink: 0,
                          }}
                        >
                          {action.icon}
                        </Box>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, flex: 1 }}>
                          {action.name}
                        </Typography>
                      </Box>
                    )
                  })}
                </Paper>
              </ClickAwayListener>
            </Box>
          </Grow>
        )}
      </Popper>
    </>
  )
}

export default QuickActions
