import {
  alpha,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Divider,
  Menu,
  MenuItem,
  Paper,
  styled,
  Tab,
  Tabs,
  useMediaQuery,
  useTheme,
  type TabsProps,
} from '@mui/material'
import * as React from 'react'
import { FiFilter, FiMoreHorizontal } from 'react-icons/fi'

/* ───────────── Types ───────────── */
type StatusColor = 'primary' | 'success' | 'warning' | 'error' | undefined

export interface TabItem<T extends string = string> {
  label: string
  value: T
  icon?: React.ReactElement
  badgeCount?: number
  statusColor?: StatusColor
  to?: string
}

interface SmartTabsProps<T extends string = string> {
  tabs: TabItem<T>[]
  value: T
  onChange: (value: T) => void
  muiTabsProps?: Omit<TabsProps, 'value' | 'onChange'>
  showDivider?: boolean
}

/* ───────────── Styled ───────────── */

const StyledTabs = styled(Tabs)(({ theme }) => ({
  minHeight: 0,
  '& .MuiTabs-indicator': {
    display: 'none',
  },
  '& .MuiTabs-flexContainer': {
    gap: 8,
    flexWrap: 'nowrap',
  },
  [theme.breakpoints.down('xl')]: {
    '& .MuiTabs-flexContainer': {
      gap: 6,
    },
  },
}))

const StyledTab = styled(Tab)(({ theme }) => ({
  minHeight: 40,
  height: 40,
  padding: '0 16px',
  borderRadius: 10,
  textTransform: 'none',
  fontSize: '0.84rem',
  fontWeight: 600,
  minWidth: 'fit-content',
  color: '#5B6472',
  transition: 'all .18s ease',
  border: `1px solid ${alpha('#000', 0.05)}`,
  background: '#fff',

  '&:hover': {
    background: alpha('#000', 0.02),
  },

  '&.Mui-selected': {
    color: '#0877C9',
    background: alpha('#0877C9', 0.07),
    border: `1px solid ${alpha('#0877C9', 0.18)}`,
  },
  [theme.breakpoints.down('xl')]: {
    minHeight: 36,
    height: 36,
    padding: '0 13px',
    fontSize: '0.78rem',
  },
  [theme.breakpoints.down('lg')]: {
    minHeight: 34,
    height: 34,
    padding: '0 11px',
    fontSize: '0.75rem',
  },
}))

const CounterChip = styled('span')(() => ({
  fontSize: '0.68rem',
  lineHeight: 1,
  padding: '4px 6px',
  borderRadius: 999,
  fontWeight: 700,
  background: '#F3F4F6',
  color: '#667085',
}))

/* ───────────── Component ───────────── */

export function SmartTabs<T extends string = string>({
  tabs,
  value,
  onChange,
  muiTabsProps,
  showDivider,
}: SmartTabsProps<T>) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const visibleCount = isMobile ? 4 : 7
  const visibleTabs = tabs.slice(0, visibleCount)
  const overflowTabs = tabs.slice(visibleCount)

  const isOverflowSelected = overflowTabs.some((t) => t.value === value)
  const controlledValue = isOverflowSelected ? '__more__' : value

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget)

  const handleClose = () => setAnchorEl(null)

  const handleChange = (_: React.SyntheticEvent, val: unknown) => {
    if (val === '__more__') return
    onChange(val as T)
  }

  /* ───────── MOBILE ───────── */
  if (isMobile) {
    return (
      <Paper
        elevation={0}
        sx={{
          position: 'fixed',
          left: 12,
          right: 12,
          bottom: 12,
          borderRadius: 3,
          border: `1px solid ${alpha('#000', 0.06)}`,
          overflow: 'hidden',
          zIndex: 1200,
        }}
      >
        <BottomNavigation
          showLabels
          value={controlledValue}
          onChange={handleChange}
          sx={{
            height: 62,
            '& .MuiBottomNavigationAction-root': {
              minWidth: 0,
              color: '#667085',
            },
            '& .Mui-selected': {
              color: '#0877C9',
            },
          }}
        >
          {visibleTabs.map((tab) => (
            <BottomNavigationAction
              key={tab.value}
              value={tab.value}
              icon={tab.icon || <FiFilter size={16} />}
              label={tab.label}
            />
          ))}

          {overflowTabs.length > 0 && (
            <BottomNavigationAction
              value="__more__"
              icon={<FiMoreHorizontal />}
              label="More"
              onClick={handleOpen}
            />
          )}
        </BottomNavigation>

        <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
          {overflowTabs.map((t) => (
            <MenuItem
              key={t.value}
              onClick={() => {
                onChange(t.value)
                handleClose()
              }}
            >
              {t.label}
            </MenuItem>
          ))}
        </Menu>
      </Paper>
    )
  }

  /* ───────── DESKTOP ───────── */

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          p: { xs: 0.75, lg: 1 },
          borderRadius: 2,
          border: `1px solid ${alpha('#000', 0.06)}`,
          bgcolor: '#fff',
          overflowX: 'auto',

          '&::-webkit-scrollbar': {
            height: 5,
          },
          '&::-webkit-scrollbar-thumb': {
            background: alpha('#000', 0.08),
            borderRadius: 10,
          },
        }}
      >
        <StyledTabs
          value={controlledValue}
          onChange={handleChange}
          variant="scrollable"
          scrollButtons={false}
          {...muiTabsProps}
          sx={{ minHeight: 0, flex: 1 }}
        >
          {visibleTabs.map((tab) => (
            <StyledTab
              key={tab.value}
              value={tab.value}
              disableRipple
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  {tab.label}
                  {typeof tab.badgeCount === 'number' && (
                    <CounterChip>{tab.badgeCount}</CounterChip>
                  )}
                </Box>
              }
            />
          ))}

          {overflowTabs.length > 0 && (
            <StyledTab
              value="__more__"
              disableRipple
              onClick={handleOpen}
              label={<FiMoreHorizontal size={16} />}
            />
          )}
        </StyledTabs>

        {/* Right Actions like screenshot */}
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              borderRadius: 2.5,
              border: `1px solid ${alpha('#000', 0.06)}`,
              boxShadow: '0 10px 30px rgba(0,0,0,.08)',
            },
          },
        }}
      >
        {overflowTabs.map((t) => (
          <MenuItem
            key={t.value}
            selected={value === t.value}
            onClick={() => {
              onChange(t.value)
              handleClose()
            }}
          >
            {t.label}
          </MenuItem>
        ))}
      </Menu>

      {showDivider ? <Divider sx={{ mt: 1.25, opacity: 0.6 }} /> : null}
    </Box>
  )
}
