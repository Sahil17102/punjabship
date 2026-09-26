import {
  alpha,
  Box,
  CircularProgress,
  ClickAwayListener,
  Grow,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Popper,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { CiSearch } from 'react-icons/ci'
import { useNavigate } from 'react-router-dom'
import type { GlobalSearchResult } from '../../api/globalSearch.api'
import { useGlobalSearch } from '../../hooks/useGlobalSearch'
import { getClientAwbTrackingPath, isValidAwb, normalizeAwb } from '../../utils/awb'

const BRAND_PRIMARY = '#0877C9'
const BRAND_INVOICE = '#B8D719'
const BRAND_INK = '#17171A'
const BRAND_MUTED = '#6E6763'

const CLIENT_PAGES: GlobalSearchResult[] = [
  {
    type: 'page',
    id: 'dashboard',
    title: 'Dashboard',
    subtitle: 'Operational overview, pending actions and quick summaries',
    link: '/dashboard',
    metadata: { keywords: 'home overview analytics summary performance' },
  },
  {
    type: 'page',
    id: 'orders-all',
    title: 'All Shipments',
    subtitle: 'Search and manage every B2C and B2B shipment',
    link: '/orders/list',
    metadata: { keywords: 'orders shipments awb order management' },
  },
  {
    type: 'page',
    id: 'orders-b2c',
    title: 'B2C Shipments',
    subtitle: 'Customer parcel orders, labels, invoices and manifests',
    link: '/orders/b2c/list',
    metadata: { keywords: 'b2c courier parcel bulk upload customer' },
  },
  {
    type: 'page',
    id: 'orders-b2b',
    title: 'B2B Shipments',
    subtitle: 'Bulk cargo and business shipment records',
    link: '/orders/b2b/list',
    metadata: { keywords: 'b2b cargo business shipment' },
  },
  {
    type: 'page',
    id: 'create-order',
    title: 'Create Order',
    subtitle: 'Create a new B2C or B2B shipment',
    link: '/orders/create',
    metadata: { keywords: 'book shipment new order booking create shipment' },
  },
  {
    type: 'page',
    id: 'bulk-upload',
    title: 'Bulk Order Import',
    subtitle: 'Open B2C orders and use Bulk Upload',
    link: '/orders/b2c/list',
    metadata: { keywords: 'bulk upload csv import bulk b2c' },
  },
  {
    type: 'page',
    id: 'warehouse',
    title: 'Warehouse & Customers',
    subtitle: 'Manage pickup warehouses and customer origin details',
    link: '/settings/manage_pickups',
    metadata: { keywords: 'warehouse pickup address customer pickup requests' },
  },
  {
    type: 'page',
    id: 'kyc',
    title: 'KYC',
    subtitle: 'Complete and review account verification',
    link: '/profile/kyc_details',
    metadata: { keywords: 'kyc verification pan aadhaar gst documents profile' },
  },
  {
    type: 'page',
    id: 'wallet',
    title: 'Wallet Transactions',
    subtitle: 'Recharge history, debit entries and wallet ledger',
    link: '/billing/wallet_transactions',
    metadata: { keywords: 'wallet money recharge balance transactions finance' },
  },
  {
    type: 'page',
    id: 'invoices',
    title: 'Invoices',
    subtitle: 'Billing invoices, statements and adjustments',
    link: '/billing/invoice_management',
    metadata: { keywords: 'invoice billing statement tax finance' },
  },
  {
    type: 'page',
    id: 'cod',
    title: 'COD Remittance',
    subtitle: 'COD settlement and remittance records',
    link: '/cod-remittance',
    metadata: { keywords: 'cod remittance settlement payout finance' },
  },
  {
    type: 'page',
    id: 'ndr',
    title: 'NDR Orders',
    subtitle: 'Failed delivery actions and buyer response flow',
    link: '/ops/ndr',
    metadata: { keywords: 'ndr non delivery action required failed delivery' },
  },
  {
    type: 'page',
    id: 'rto',
    title: 'RTO Orders',
    subtitle: 'Return-to-origin events and shipment recovery',
    link: '/ops/rto',
    metadata: { keywords: 'rto return origin returns' },
  },
  {
    type: 'page',
    id: 'weight',
    title: 'Weight Disputes',
    subtitle: 'Weight reconciliation and courier discrepancy cases',
    link: '/reconciliation/weight',
    metadata: { keywords: 'weight dispute reconciliation discrepancy charges' },
  },
  {
    type: 'page',
    id: 'rate-calculator',
    title: 'Rate Calculator',
    subtitle: 'Compare courier pricing before booking',
    link: '/tools/rate_calculator',
    metadata: { keywords: 'rate calculator estimate courier charges price' },
  },
  {
    type: 'page',
    id: 'track-awb',
    title: 'Track AWB',
    subtitle: 'Track a shipment by AWB or order reference',
    link: '/tools/order_tracking',
    metadata: { keywords: 'track tracking awb shipment status' },
  },
  {
    type: 'page',
    id: 'support',
    title: 'Support Tickets',
    subtitle: 'Create and review support requests',
    link: '/support/tickets',
    metadata: { keywords: 'support ticket help issue complaint' },
  },
  {
    type: 'page',
    id: 'settings',
    title: 'Workspace Settings',
    subtitle: 'Profile, label, invoice, API and courier preferences',
    link: '/settings',
    metadata: { keywords: 'settings profile label invoice api courier priority users' },
  },
]

const normalizeSearchText = (value: unknown) =>
  String(value || '')
    .toLowerCase()
    .replace(/[\s_-]+/g, ' ')
    .trim()

interface GlobalSearchProps {
  compact?: boolean
}

const GlobalSearch = ({ compact = false }: GlobalSearchProps) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [popperReady, setPopperReady] = useState(false)

  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [animatePlaceholder, setAnimatePlaceholder] = useState(true)

  const anchorRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const placeholders = useMemo(
    () => [
      'Search orders...',
      'Track by AWB number...',
      'Find invoices instantly...',
      'Search NDR cases...',
      'Locate RTO shipments...',
      'Check weight discrepancies...',
    ],
    [],
  )

  const shouldSearch = open && searchQuery.trim().length >= 2

  const { data: searchResults, isLoading, isFetching } = useGlobalSearch(searchQuery, shouldSearch)

  const pageResults = useMemo(() => {
    const query = normalizeSearchText(searchQuery)
    if (query.length < 2) return []

    return CLIENT_PAGES.map((page) => {
      const haystack = normalizeSearchText(
        `${page.title} ${page.subtitle || ''} ${page.link} ${page.metadata?.keywords || ''}`,
      )
      const title = normalizeSearchText(page.title)
      const startsWithScore = title.startsWith(query) ? 2 : 0
      const includesScore = haystack.includes(query) ? 1 : 0

      return { page, score: startsWithScore + includesScore }
    })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || a.page.title.localeCompare(b.page.title))
      .slice(0, 8)
      .map(({ page }) => page)
  }, [searchQuery])

  const shipmentResults = useMemo(
    () => searchResults?.results?.filter((result) => result.type !== 'page') ?? [],
    [searchResults],
  )

  const combinedResults = useMemo(
    () => [...pageResults, ...shipmentResults].slice(0, 14),
    [pageResults, shipmentResults],
  )

  useEffect(() => {
    if (open && anchorRef.current) {
      const timer = setTimeout(() => setPopperReady(true), 20)

      return () => {
        clearTimeout(timer)
        setPopperReady(false)
      }
    }

    setPopperReady(false)
  }, [open])

  useEffect(() => {
    if (searchQuery.trim()) return

    const interval = setInterval(() => {
      setAnimatePlaceholder(false)

      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % placeholders.length)

        setAnimatePlaceholder(true)
      }, 400)
    }, 4000)

    return () => clearInterval(interval)
  }, [searchQuery, placeholders.length])

  const handleResultClick = (result: GlobalSearchResult) => {
    const awb = result.metadata?.awb

    if (typeof awb === 'string' && awb && result.type === 'order') {
      navigate(getClientAwbTrackingPath(awb))
    } else {
      navigate(result.link)
    }

    setSearchQuery('')
    setOpen(false)
  }

  const searchOrNavigate = () => {
    const trimmedQuery = searchQuery.trim()

    if (!trimmedQuery) return

    const normalizedQuery = normalizeAwb(trimmedQuery)
    if (isValidAwb(normalizedQuery)) {
      navigate(getClientAwbTrackingPath(normalizedQuery))
    } else if (combinedResults.length) {
      handleResultClick(combinedResults[0])
    } else {
      navigate(`/orders/list?search=${encodeURIComponent(trimmedQuery)}`)
    }

    setSearchQuery('')
    setOpen(false)
  }

  const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') searchOrNavigate()

    if (event.key === 'Escape') setOpen(false)
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      page: 'Page',
      order: 'Order',
      invoice: 'Invoice',
      ndr: 'NDR',
      rto: 'RTO',
      weight_discrepancy: 'Weight Discrepancy',
    }

    return labels[type] || type
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      page: '#2563EB',
      order: BRAND_PRIMARY,
      invoice: BRAND_INVOICE,
      ndr: '#F59E0B',
      rto: '#D73A49',
      weight_discrepancy: BRAND_MUTED,
    }

    return colors[type] || BRAND_MUTED
  }

  return (
    <Box
      sx={{
        position: 'relative',
        width: compact
          ? {
              xs: 150,
              sm: 180,
              md: 230,
            }
          : {
              xs: 170,
              sm: 340,
              md: 430,
            },

        maxWidth: compact
          ? {
              xs: '48vw',
              md: 230,
            }
          : {
              xs: '50vw',
              sm: 'none',
            },
      }}
    >
      <div ref={anchorRef}>
        <TextField
          value={searchQuery}
          onChange={(event) => {
            const value = event.target.value

            setSearchQuery(value)

            if (value.trim().length >= 2 || open) {
              setOpen(true)
            }
          }}
          onKeyDown={handleKeyPress}
          onFocus={() => setOpen(true)}
          placeholder={placeholders[placeholderIndex]}
          size="small"
          fullWidth
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '14px',

              minHeight: compact
                ? {
                    xs: 38,
                    sm: 40,
                    md: 42,
                  }
                : {
                    xs: 44,
                    sm: 48,
                  },

              px: compact ? 1 : 1.2,
              pr: compact ? 0.8 : 1.1,

              bgcolor: '#FFFFFF',

              border: '1px solid rgba(23,23,26,0.08)',

              boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 6px 18px rgba(0,0,0,0.03)',

              transition: 'all 220ms cubic-bezier(0.4,0,0.2,1)',

              '& fieldset': {
                border: 'none',
              },

              '&:hover': {
                borderColor: 'rgba(23,23,26,0.16)',

                boxShadow: '0 2px 6px rgba(0,0,0,0.05), 0 10px 24px rgba(0,0,0,0.05)',

                transform: 'translateY(-1px)',
              },

              '&.Mui-focused': {
                borderColor: BRAND_PRIMARY,

                boxShadow: `
                    0 0 0 4px rgba(8,119,201,0.08),
                    0 10px 26px rgba(8,119,201,0.08)
                  `,

                transform: 'translateY(-1px)',
              },
            },

            '& .MuiOutlinedInput-input': {
              py: compact ? 1 : 1.15,

              px: 0,

              fontSize: compact
                ? {
                    xs: '0.8rem',
                    sm: '0.84rem',
                  }
                : {
                    xs: '0.92rem',
                    sm: '0.96rem',
                  },

              fontWeight: 500,
              letterSpacing: '0.01em',

              color: BRAND_INK,

              '&::placeholder': {
                color: '#8A8A94',

                opacity: animatePlaceholder ? 1 : 0,

                transform: animatePlaceholder ? 'translateY(0px)' : 'translateY(6px)',

                transition: 'all 220ms ease',
              },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment
                position="start"
                sx={{
                  mr: 1,
                  ml: 0.2,
                }}
              >
                <Box
                  sx={{
                    width: 30,
                    height: 30,
                    borderRadius: '10px',
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: 'rgba(8,119,201,0.06)',
                  }}
                >
                  <CiSearch
                    size={17}
                    style={{
                      color: BRAND_PRIMARY,
                    }}
                  />
                </Box>
              </InputAdornment>
            ),

            endAdornment: (
              <InputAdornment position="end">
                {isLoading || isFetching ? (
                  <CircularProgress
                    size={16}
                    thickness={5}
                    sx={{
                      color: BRAND_PRIMARY,
                      mr: 0.4,
                    }}
                  />
                ) : !searchQuery ? (
                  <Box
                    sx={{
                      px: 0.8,
                      py: 0.35,
                      borderRadius: '8px',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: '#6E6763',
                      bgcolor: '#F6F6F7',
                      border: '1px solid rgba(0,0,0,0.05)',
                    }}
                  >
                    ⏎
                  </Box>
                ) : null}
              </InputAdornment>
            ),
          }}
        />
      </div>

      {open && anchorRef.current && (
        <Popper
          open={open && popperReady}
          anchorEl={anchorRef.current}
          placement="bottom-start"
          transition
          style={{
            zIndex: 9999,
          }}
          modifiers={[
            {
              name: 'offset',
              options: {
                offset: [0, 10],
              },
            },
          ]}
        >
          {({ TransitionProps }) => (
            <Grow
              {...TransitionProps}
              in={popperReady}
              timeout={180}
              style={{
                transformOrigin: 'top left',
              }}
            >
              <Box>
                <ClickAwayListener onClickAway={() => setOpen(false)}>
                  <Paper
                    elevation={0}
                    sx={{
                      width: anchorRef.current?.offsetWidth ?? 430,

                      maxHeight: 420,

                      overflow: 'auto',

                      mt: 0.8,
                      p: 1,

                      borderRadius: '16px',

                      bgcolor: '#FFFFFF',

                      border: '1px solid rgba(0,0,0,0.06)',

                      boxShadow: '0 16px 40px rgba(0,0,0,0.08)',
                    }}
                  >
                    {searchQuery.trim().length < 2 ? (
                      <Box
                        sx={{
                          px: 1.2,
                          py: 1.4,
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: '0.92rem',
                            fontWeight: 700,
                            color: BRAND_INK,
                          }}
                        >
                          Start typing to search
                        </Typography>

                        <Typography
                          sx={{
                            fontSize: '0.8rem',
                            color: BRAND_MUTED,
                            mt: 0.4,
                          }}
                        >
                          Search by orders, invoice, AWB or shipment IDs.
                        </Typography>
                      </Box>
                    ) : combinedResults.length ? (
                      <List disablePadding>
                        {[
                          { title: 'Pages', items: pageResults },
                          { title: 'Shipments & Records', items: shipmentResults },
                        ].map((section) =>
                          section.items.length ? (
                            <Box key={section.title} sx={{ mb: 0.75 }}>
                              <Typography
                                sx={{
                                  px: 1.2,
                                  py: 0.55,
                                  fontSize: '0.68rem',
                                  fontWeight: 900,
                                  letterSpacing: '0.08em',
                                  textTransform: 'uppercase',
                                  color: '#5B6472',
                                }}
                              >
                                {section.title}
                              </Typography>
                              {section.items.map((result) => (
                                <ListItem
                                  key={`${result.type}-${result.id}-${result.link}`}
                                  disablePadding
                                  sx={{
                                    mb: 0.5,
                                  }}
                                >
                                  <ListItemButton
                                    onClick={() => handleResultClick(result)}
                                    sx={{
                                      borderRadius: '14px',

                                      px: 1.2,
                                      py: 1,

                                      alignItems: 'flex-start',

                                      transition: 'all 180ms ease',

                                      '&:hover': {
                                        bgcolor: '#F8FAFC',

                                        transform: 'translateX(2px)',
                                      },
                                    }}
                                  >
                                    <ListItemText
                                      primary={
                                        <Box
                                          sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            gap: 1,
                                          }}
                                        >
                                          <Typography
                                            sx={{
                                              fontSize: '0.9rem',
                                              fontWeight: 700,
                                              color: BRAND_INK,
                                            }}
                                          >
                                            {result.title}
                                          </Typography>

                                          <Box
                                            sx={{
                                              px: 1,
                                              py: 0.35,
                                              borderRadius: 999,

                                              bgcolor: alpha(getTypeColor(result.type), 0.08),

                                              color: getTypeColor(result.type),

                                              fontSize: '0.66rem',

                                              fontWeight: 800,

                                              textTransform: 'uppercase',
                                            }}
                                          >
                                            {getTypeLabel(result.type)}
                                          </Box>
                                        </Box>
                                      }
                                      secondary={
                                        <Typography
                                          sx={{
                                            mt: 0.4,
                                            fontSize: '0.78rem',
                                            color: BRAND_MUTED,
                                          }}
                                        >
                                          {result.subtitle || result.link}
                                        </Typography>
                                      }
                                    />
                                  </ListItemButton>
                                </ListItem>
                              ))}
                            </Box>
                          ) : null,
                        )}
                      </List>
                    ) : (
                      <Box
                        sx={{
                          px: 1.2,
                          py: 1.4,
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            color: BRAND_INK,
                          }}
                        >
                          No results found
                        </Typography>

                        <Typography
                          sx={{
                            mt: 0.4,
                            fontSize: '0.8rem',
                            color: BRAND_MUTED,
                          }}
                        >
                          Press Enter to search across orders.
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </ClickAwayListener>
              </Box>
            </Grow>
          )}
        </Popper>
      )}
    </Box>
  )
}

export default GlobalSearch
