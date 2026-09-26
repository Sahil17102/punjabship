import type { JSX } from '@emotion/react/jsx-runtime'
import {
  alpha,
  Box,
  Collapse,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { BiInfoCircle, BiListPlus } from 'react-icons/bi'
import { CgTrack } from 'react-icons/cg'
import { FaBalanceScaleLeft, FaBox } from 'react-icons/fa'
import { FaClipboardList as FaFileAlt, FaMoneyBill, FaToolbox, FaUser } from 'react-icons/fa6'
import { HiDocumentReport } from 'react-icons/hi'
import {
  MdDashboard,
  MdOutlineAccountBalanceWallet,
  MdOutlineAddBusiness,
  MdOutlineErrorOutline,
  MdOutlineHelp,
  MdOutlineHome,
  MdOutlineKeyboardReturn,
  MdOutlineRateReview,
  MdStorefront,
  MdOutlineWarningAmber,
} from 'react-icons/md'
import { RiSettings2Line } from 'react-icons/ri'
import { TbInvoice, TbReportAnalytics, TbTicket, TbTransactionRupee } from 'react-icons/tb'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/auth/AuthContext'
import { getVisibleOrderTypes } from '../../utils/businessTypes'
import { canAccessEmployeeModule, type EmployeeModule } from '../../utils/employeeAccess'
import { isActive } from '../../utils/functions'
import ClientNavIcon from './ClientNavIcon'

export type Role = 'customer' | 'admin'

export interface SubItem {
  text: string
  path: string
  icon?: JSX.Element
}

export interface NavItem {
  text: string
  icon: JSX.Element
  path: string
  section: string
  roles: Role[]
  module?: EmployeeModule
  children?: SubItem[]
}

interface SidebarProps {
  role?: Role
  forceExpanded?: boolean
}

const SIDEBAR_EXPANDED_WIDTH = 248
const SIDEBAR_COLLAPSED_WIDTH = 74
const ICON_SIZE_MD = 18 // Material Design
const ICON_SIZE_FA = 16 // Font Awesome (slightly smaller to match MD)
const ICON_SIZE_TB = 18 // Tabler
const ICON_SIZE_BI = 18 // Bootstrap Icons
const ICON_SIZE_CG = 18 // css.gg
const ICON_SIZE_HI = 18 // Heroicons
const ICON_SIZE_RI = 16 // Remix Icon
const BRAND_ORANGE = '#0877C9'
const BRAND_SURFACE = '#FBFAFE'
const BRAND_INK = '#141414'
const BRAND_BORDER = '#DED9E8'
const LOGO_SRC = '/logo/punjabship-mark.svg'

const navItems: NavItem[] = [
  {
    text: 'Overview',
    icon: <MdOutlineHome size={ICON_SIZE_MD} />,
    path: '/home',
    section: 'Overview',
    roles: ['customer', 'admin'],
    module: 'overview',
  },
  {
    text: 'Dashboard',
    icon: <MdDashboard size={ICON_SIZE_MD} />,
    path: '/dashboard',
    section: 'Overview',
    roles: ['customer', 'admin'],
    module: 'dashboard',
  },
  {
    text: 'Shipments',
    icon: <FaBox size={ICON_SIZE_FA} />,
    path: '/orders',
    section: 'Execution',
    roles: ['customer', 'admin'],
    module: 'orders',
    children: [
      {
        text: 'All Shipments',
        path: '/orders/list',
        icon: <FaFileAlt size={ICON_SIZE_FA} />,
      },
      {
        text: 'B2C Orders',
        path: '/orders/b2c/list',
        icon: <FaUser size={ICON_SIZE_FA} />,
      },
      {
        text: 'B2B Orders',
        path: '/orders/b2b/list',
        icon: <MdOutlineAddBusiness size={ICON_SIZE_MD} />,
      },
      {
        text: 'Create Order',
        path: '/orders/create',
        icon: <BiListPlus size={ICON_SIZE_BI} />,
      },
    ],
  },
  {
    text: 'Exceptions',
    icon: <MdOutlineErrorOutline size={ICON_SIZE_MD} />,
    path: '/ops',
    section: 'Execution',
    roles: ['customer', 'admin'],
    module: 'exceptions',
    children: [
      { text: 'NDR', path: '/ops/ndr', icon: <MdOutlineWarningAmber size={ICON_SIZE_MD} /> },
      {
        text: 'RTO',
        path: '/ops/rto',
        icon: <MdOutlineKeyboardReturn size={ICON_SIZE_MD} />,
      },
    ],
  },
  {
    text: 'Finance',
    icon: <FaMoneyBill size={ICON_SIZE_FA} />,
    path: '/billing',
    section: 'Finance',
    roles: ['customer', 'admin'],
    module: 'finance',
    children: [
      {
        text: 'Wallet Transactions',
        path: '/billing/wallet_transactions',
        icon: <TbTransactionRupee size={ICON_SIZE_TB} />,
      },
      {
        text: 'COD Settlements',
        path: '/cod-remittance',
        icon: <MdOutlineAccountBalanceWallet size={ICON_SIZE_MD} />,
      },
      {
        text: 'Invoices',
        path: '/billing/invoice_management',
        icon: <TbInvoice size={ICON_SIZE_TB} />,
      },
    ],
  },
  {
    text: 'Audits',
    icon: <FaBalanceScaleLeft size={ICON_SIZE_FA} />,
    path: '/reconciliation',
    section: 'Finance',
    roles: ['customer', 'admin'],
    module: 'audits',
    children: [
      {
        text: 'Weight Audit',
        path: '/reconciliation/weight',
        icon: <FaBalanceScaleLeft size={ICON_SIZE_FA} />,
      },
      {
        text: 'Audit Rules',
        path: '/reconciliation/weight/settings',
        icon: <RiSettings2Line size={ICON_SIZE_RI} />,
      },
    ],
  },
  {
    text: 'Utilities',
    icon: <FaToolbox size={ICON_SIZE_FA} />,
    path: '/tools',
    section: 'Toolkit',
    roles: ['customer', 'admin'],
    module: 'utilities',
    children: [
      {
        text: 'Rate Chart',
        path: '/tools/rate_card',
        icon: <MdOutlineRateReview size={ICON_SIZE_MD} />,
      },
      {
        text: 'Rate Calculator',
        path: '/tools/rate_calculator',
        icon: <TbReportAnalytics size={ICON_SIZE_TB} />,
      },
      {
        text: 'Track Shipment',
        path: '/tools/order_tracking',
        icon: <CgTrack size={ICON_SIZE_CG} />,
      },
    ],
  },
  {
    text: 'Insights Overview',
    icon: <HiDocumentReport size={ICON_SIZE_HI} />,
    path: '/reports',
    section: 'Toolkit',
    roles: ['customer', 'admin'],
    module: 'reports',
  },
  {
    text: 'Channels',
    icon: <MdStorefront size={ICON_SIZE_MD} />,
    path: '/channels',
    section: 'System',
    roles: ['customer', 'admin'],
    module: 'channels',
    children: [
      {
        text: 'Connected Channels',
        path: '/channels/connected',
        icon: <MdStorefront size={ICON_SIZE_MD} />,
      },
      {
        text: 'Connect Store',
        path: '/channels/channel_list',
        icon: <MdOutlineAddBusiness size={ICON_SIZE_MD} />,
      },
    ],
  },
  {
    text: 'Workspace',
    icon: <RiSettings2Line size={ICON_SIZE_RI} />,
    path: '/settings',
    section: 'System',
    roles: ['customer', 'admin'],
    module: 'workspace',
  },
  {
    text: 'Support',
    icon: <MdOutlineHelp size={ICON_SIZE_MD} />,
    path: '/support',
    section: 'System',
    roles: ['customer', 'admin'],
    module: 'support',
    children: [
      {
        text: 'Support Tickets',
        path: '/support/tickets',
        icon: <TbTicket size={ICON_SIZE_TB} />,
      },
      {
        text: 'About PunjabShip',
        path: '/support/about_us',
        icon: <BiInfoCircle size={ICON_SIZE_BI} />,
      },
    ],
  },
]

export default function Sidebar({
  role = 'customer',
  forceExpanded = false,
}: SidebarProps) {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const [isHovered, setIsHovered] = useState(false)
  const [hasFocusWithin, setHasFocusWithin] = useState(false)
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const [hoveredItemText, setHoveredItemText] = useState<string | null>(null)
  const [expandedItemText, setExpandedItemText] = useState<string | null>(null)
  const shouldShowExpanded = forceExpanded || isHovered || hasFocusWithin
  const sidebarWidth = shouldShowExpanded ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH

  const filteredItems = useMemo(() => {
    const visibleOrderTypes = getVisibleOrderTypes(user?.businessType)

    return navItems
      .filter((item) => item.roles.includes(role))
      .filter((item) => !item.module || canAccessEmployeeModule(user, item.module))
      .map((item) => {
        if (item.text !== 'Shipments' || !item.children) return item

        return {
          ...item,
          children: item.children.filter((child) => {
            if (child.path === '/orders/b2c/list') return visibleOrderTypes.includes('b2c')
            if (child.path === '/orders/b2b/list') return visibleOrderTypes.includes('b2b')
            return true
          }),
        }
      })
      .filter((item) => !item.children || item.children.length > 0)
  }, [role, user, user?.businessType])

  useEffect(() => {
    if (!shouldShowExpanded) {
      setExpandedItemText(null)
      return
    }
    const activeParent = filteredItems.find((item) =>
      item.children?.some((child) => isActive(child.path, pathname)),
    )
    setExpandedItemText(activeParent?.text ?? null)
  }, [filteredItems, pathname, shouldShowExpanded])

  const handlePopoverClose = () => {
    setAnchorEl(null)
    setHoveredItemText(null)
  }

  return (
    <Box
      data-testid="client-sidebar"
      data-expanded={shouldShowExpanded ? 'true' : 'false'}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setHasFocusWithin(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setHasFocusWithin(false)
        }
      }}
      sx={{
        width: sidebarWidth,
        minWidth: sidebarWidth,
        maxWidth: sidebarWidth,
        flex: `0 0 ${sidebarWidth}px`,
        height: '100vh',
        position: 'sticky',
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        background: BRAND_SURFACE,
        color: BRAND_INK,
        borderRight: `1px solid ${BRAND_BORDER}`,
        boxShadow: '8px 0 24px rgba(35,29,52,0.08)',
        zIndex: 1200,
        overflowY: 'auto',
        overflowX: 'hidden',
        transition:
          'width 240ms cubic-bezier(0.4, 0, 0.2, 1), min-width 240ms cubic-bezier(0.4, 0, 0.2, 1), max-width 240ms cubic-bezier(0.4, 0, 0.2, 1), flex-basis 240ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent={shouldShowExpanded ? 'space-between' : 'center'}
        sx={{
          px: shouldShowExpanded ? 1.25 : 0.75,
          py: 1.05,
          borderBottom: `1px solid ${BRAND_BORDER}`,
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Box
            component="img"
            src={LOGO_SRC}
            alt="PunjabShip"
            sx={{ width: '90%', height: '90%', objectFit: 'contain' }}
          />
        </Box>
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            ml: shouldShowExpanded ? 1 : 0,
            maxWidth: shouldShowExpanded ? 170 : 0,
            opacity: shouldShowExpanded ? 1 : 0,
            overflow: 'hidden',
            visibility: shouldShowExpanded ? 'visible' : 'hidden',
            transition: 'opacity 160ms ease, max-width 240ms ease, margin 240ms ease',
          }}
        >
            <Box component="img" src="/logo/punjabship-logo.png" alt="PunjabShip" sx={{ width: 155, maxWidth: '100%', height: 52, objectFit: 'contain' }} />
        </Box>
      </Stack>

      <List
        sx={{
          flex: 1,
          px: 0.9,
          py: 0.75,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {filteredItems.map(({ text, icon, path, children }) => {
          const hasChildren = Boolean(children?.length)
          const childActive = children?.some((child) => isActive(child.path, pathname))
          const isActive_ = isActive(path, pathname) || childActive

          return (
            <Box key={text}>
              <Tooltip title={shouldShowExpanded || hasChildren ? '' : text} placement="right">
                <ListItemButton
                  {...(!hasChildren && { component: NavLink, to: path })}
                  onMouseEnter={() => {
                    if (hasChildren && shouldShowExpanded) setExpandedItemText(text)
                  }}
                  onClick={() => {
                    if (hasChildren) {
                      setExpandedItemText((current) => (current === text ? null : text))
                    }
                  }}
                  sx={{
                    minHeight: 40,
                    px: shouldShowExpanded ? 1.1 : 0.5,
                    py: 0.55,
                    mb: 0.4,
                    borderRadius: '8px',
                    justifyContent: shouldShowExpanded ? 'flex-start' : 'center',
                    background: isActive_ ? '#E9E3FF' : '#F4F1FC',
                    border: `1px solid ${isActive_ ? '#C5B9F5' : '#E2DCF1'}`,
                    color: isActive_ ? BRAND_ORANGE : '#999999',
                    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      inset: 0,
                      background: isActive_
                        ? `linear-gradient(135deg, ${alpha(BRAND_ORANGE, 0.05)} 0%, transparent 100%)`
                        : 'transparent',
                      opacity: 0,
                      transition: 'opacity 200ms ease',
                    },
                    '&:hover': {
                      background: isActive_ ? '#E9E3FF' : '#EEE8FF',
                      borderColor: isActive_ ? '#A995F2' : '#CEC2EB',
                      color: isActive_ ? BRAND_ORANGE : '#666666',
                      transform: 'translateX(2px)',
                      boxShadow: `0 4px 12px ${alpha(BRAND_INK, 0.08)}`,
                      '&::before': {
                        opacity: 1,
                      },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: shouldShowExpanded ? 36 : 0,
                      display: 'flex',
                      justifyContent: 'center',
                      color: 'inherit',
                    }}
                  >
                    <ClientNavIcon icon={icon} name={text} path={path} active={Boolean(isActive_)} />
                  </ListItemIcon>
                  <ListItemText
                      primary={text}
                      sx={{
                        maxWidth: shouldShowExpanded ? 175 : 0,
                        opacity: shouldShowExpanded ? 1 : 0,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        visibility: shouldShowExpanded ? 'visible' : 'hidden',
                        transition: 'opacity 160ms ease, max-width 240ms ease',
                      }}
                      slotProps={{
                        primary: {
                          sx: {
                            fontSize: '0.81rem',
                            lineHeight: 1.15,
                            fontWeight: isActive_ ? 600 : 500,
                            color: 'inherit',
                          },
                        },
                      }}
                  />
                </ListItemButton>
              </Tooltip>
              {hasChildren && shouldShowExpanded && (
                <Collapse in={expandedItemText === text} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding sx={{ pl: 1.5 }}>
                    {children?.map((child) => {
                      const childIsActive = isActive(child.path, pathname)
                      return (
                        <ListItemButton
                          key={child.path}
                          component={NavLink}
                          to={child.path}
                          sx={{
                            minHeight: 34,
                            px: 1.1,
                            py: 0.45,
                            mb: 0.25,
                            borderRadius: '8px',
                            color: childIsActive ? BRAND_ORANGE : '#999999',
                            background: childIsActive ? '#E9E3FF' : '#FAF6EE',
                            border: `1px solid ${childIsActive ? '#C5B9F5' : '#E6E0D6'}`,
                            fontSize: '0.85rem',
                            fontWeight: childIsActive ? 600 : 500,
                            '&:hover': {
                              background: childIsActive
                                ? alpha(BRAND_ORANGE, 0.12)
                                : alpha(BRAND_INK, 0.04),
                              borderColor: childIsActive
                                ? alpha(BRAND_ORANGE, 0.3)
                                : alpha(BRAND_INK, 0.12),
                              color: childIsActive ? BRAND_ORANGE : '#666666',
                            },
                          }}
                        >
                          <ListItemIcon
                            sx={{
                              minWidth: 34,
                              color: 'inherit',
                            }}
                          >
                            <ClientNavIcon icon={child.icon} name={child.text} path={child.path} active={childIsActive} compact />
                          </ListItemIcon>
                          <ListItemText
                            primary={child.text}
                            slotProps={{
                              primary: {
                                sx: {
                                  fontSize: '0.78rem',
                                  lineHeight: 1.15,
                                  fontWeight: childIsActive ? 600 : 500,
                                },
                              },
                            }}
                          />
                        </ListItemButton>
                      )
                    })}
                  </List>
                </Collapse>
              )}
            </Box>
          )
        })}
      </List>

      {/* Custom Dropdown Menu for collapsed sidebar */}
      {hoveredItemText && anchorEl && !shouldShowExpanded && (
        <Box
          onMouseEnter={() => setHoveredItemText(hoveredItemText)}
          onMouseLeave={handlePopoverClose}
          sx={{
            position: 'fixed',
            zIndex: 1300,
            left: `${sidebarWidth + 8}px`,
            top: anchorEl.getBoundingClientRect().top,
            background: BRAND_SURFACE,
            border: `1px solid ${BRAND_BORDER}`,
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            minWidth: 220,
            animation: 'fadeInSlide 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            '@keyframes fadeInSlide': {
              from: {
                opacity: 0,
                transform: 'translateX(-8px)',
              },
              to: {
                opacity: 1,
                transform: 'translateX(0)',
              },
            },
          }}
        >
          <List sx={{ py: 1 }}>
            {filteredItems
              .find((item) => item.text === hoveredItemText)
              ?.children?.map((child) => {
                const active = isActive(child.path, pathname)
                return (
                  <ListItemButton
                    key={child.path}
                    component={NavLink}
                    to={child.path}
                    onClick={handlePopoverClose}
                    sx={{
                      px: 1.5,
                      py: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      background: active ? alpha(BRAND_ORANGE, 0.08) : 'transparent',
                      color: active ? BRAND_ORANGE : BRAND_INK,
                      transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                      borderRadius: 1,
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: active ? '3px' : '0px',
                        height: active ? '60%' : '0%',
                        background: BRAND_ORANGE,
                        borderRadius: '0 2px 2px 0',
                        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                      },
                      '&:hover': {
                        background: active ? alpha(BRAND_ORANGE, 0.15) : alpha(BRAND_INK, 0.06),
                        transform: 'translateX(4px)',
                        '&::before': {
                          height: '70%',
                        },
                      },
                    }}
                  >
                    {child.icon && (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'inherit',
                          fontSize: '1.2rem',
                        }}
                      >
                        <ClientNavIcon icon={child.icon} name={child.text} path={child.path} active={active} compact />
                      </Box>
                    )}
                    <Typography variant="body2" sx={{ fontWeight: active ? 600 : 500 }}>
                      {child.text}
                    </Typography>
                  </ListItemButton>
                )
              })}
          </List>
        </Box>
      )}
    </Box>
  )
}
