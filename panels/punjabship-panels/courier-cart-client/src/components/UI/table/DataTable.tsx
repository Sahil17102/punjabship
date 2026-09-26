import type { JSX } from '@emotion/react/jsx-runtime'
import {
  type Breakpoint,
  alpha,
  Box,
  CardContent,
  CircularProgress,
  Collapse,
  IconButton,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { MdExpandLess, MdExpandMore, MdKeyboardArrowDown, MdKeyboardArrowUp } from 'react-icons/md'
import CustomCheckbox from '../inputs/CustomCheckbox'
import AWBLink from '../AWBLink'

const TEXT_PRIMARY = '#111111'
const TEXT_SECONDARY = '#6B7280'
const BORDER = 'rgba(17,17,17,0.08)'
const BG = '#FFFFFF'

/* UPDATED HEADER */
const HEADER_BG = '#e6e6e6'
const HEADER_TEXT = 'black'

export interface Column<T> {
  id: keyof T
  label: JSX.Element | string
  label_desc?: string
  align?: 'left' | 'right' | 'center'
  minWidth?: number
  hiddenOnMobile?: boolean
  hiddenBelow?: Breakpoint
  truncate?: boolean
  sortable?: boolean
  showCellTooltip?: boolean
  stickyRight?: boolean
  render?: (value: any, row: T) => React.ReactNode
}

export interface DataTableProps<T extends { id: string | number }> {
  rows: T[]
  columns: Column<T>[]
  title?: string
  subTitle?: string
  maxHeight?: number
  pagination?: boolean
  selectable?: boolean
  selectedRowIds?: Array<T['id']>
  onSelectRows?: (ids: Array<T['id']>) => void
  rowsPerPageOptions?: number[]
  defaultRowsPerPage?: number
  totalCount?: number
  currentPage?: number
  onPageChange?: (page: number) => void
  onRowsPerPageChange?: (rowsPerPage: number) => void
  expandable?: boolean
  renderExpandedRow?: (row: T) => React.ReactNode
  onRowClick?: (row: T) => void
  loading?: boolean
  loadingLabel?: string
  emptyMessage?: string
  fitToContainer?: boolean
  wrapCells?: boolean
}

type SortDirection = 'asc' | 'desc'

export default function DataTable<T extends { id: string | number }>(props: DataTableProps<T>) {
  const {
    rows,
    columns,
    title,
    subTitle,
    maxHeight = 560,
    pagination = true,
    selectable = false,
    selectedRowIds,
    onSelectRows,
    rowsPerPageOptions = [10, 25, 50],
    defaultRowsPerPage = 10,
    totalCount,
    currentPage,
    onPageChange,
    onRowsPerPageChange,
    expandable,
    renderExpandedRow,
    onRowClick,
    loading = false,
    loadingLabel = 'Refreshing orders...',
    emptyMessage = 'No records found.',
    fitToContainer = true,
    wrapCells = false,
  } = props

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isDownMd = useMediaQuery(theme.breakpoints.down('md'))
  const isDownLg = useMediaQuery(theme.breakpoints.down('lg'))
  const isDownXl = useMediaQuery(theme.breakpoints.down('xl'))
  const isCompactDesktop = useMediaQuery(theme.breakpoints.down('xl'))
  const shouldFitContainer = fitToContainer && !isDownMd

  const [localPage, setLocalPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage)
  const [selectedIds, setSelectedIds] = useState<Array<T['id']>>([])
  const [expandedId, setExpandedId] = useState<T['id'] | null>(null)

  const [sortKey, setSortKey] = useState<keyof T | null>(null)
  const [sortDir, setSortDir] = useState<SortDirection>('asc')

  const expandedRef = useRef<HTMLDivElement | null>(null)

  const isServerPagination = currentPage !== undefined || typeof onPageChange === 'function'

  const page = currentPage ?? localPage

  useEffect(() => {
    if (selectedRowIds) setSelectedIds(selectedRowIds)
  }, [selectedRowIds])

  const visibleColumns = columns.filter((col) => {
    if (isMobile && col.hiddenOnMobile) return false
    if (col.hiddenBelow === 'md' && isDownMd) return false
    if (col.hiddenBelow === 'lg' && isDownLg) return false
    if (col.hiddenBelow === 'xl' && isDownXl) return false
    return true
  })

  const tableMinWidth =
    visibleColumns.reduce((sum, column) => sum + (column.minWidth ?? 160), 0) +
    (selectable ? 64 : 0) +
    (expandable ? 64 : 0)
  const visibleColumnMinWidthTotal = visibleColumns.reduce(
    (sum, column) => sum + (column.minWidth ?? 160),
    0,
  )

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows

    return [...rows].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]

      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av
      }

      return sortDir === 'asc'
        ? String(av ?? '').localeCompare(String(bv ?? ''))
        : String(bv ?? '').localeCompare(String(av ?? ''))
    })
  }, [rows, sortKey, sortDir])

  const pagedRows =
    pagination && !isServerPagination
      ? sortedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
      : sortedRows

  const allSelected = pagedRows.length > 0 && pagedRows.every((row) => selectedIds.includes(row.id))

  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const handleSelect = (id: T['id']) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((x) => x !== id)
      : [...selectedIds, id]

    setSelectedIds(next)
    onSelectRows?.(next)
  }

  const handleSelectAll = (checked: boolean) => {
    const next = checked ? pagedRows.map((r) => r.id) : []
    setSelectedIds(next)
    onSelectRows?.(next)
  }

  const toggleExpand = (id: T['id']) => {
    const next = expandedId === id ? null : id
    setExpandedId(next)

    setTimeout(() => {
      expandedRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      })
    }, 150)
  }

  return (
    <CardContent
      sx={{
        p: 0,
        position: 'relative',
        borderRadius: 4,
        border: `1px solid ${BORDER}`,
        bgcolor: BG,
        boxShadow: '0 12px 28px rgba(0,0,0,0.04)',
        overflow: 'hidden',
      }}
    >
      {(title || subTitle || pagination) && (
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent="space-between"
          gap={2}
          sx={{
            width: '100%',
            minWidth: 0,
            px: { xs: 1.25, sm: 2, md: 3 },
            py: 1,
            borderBottom: `1px solid ${BORDER}`,
          }}
        >
          <Box>
            {title && (
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: isCompactDesktop ? '0.98rem' : '1.08rem',
                  color: TEXT_PRIMARY,
                }}
              >
                {title}
              </Typography>
            )}

            {subTitle && (
              <Typography
                sx={{
                  mt: 0.4,
                  fontSize: isCompactDesktop ? '0.76rem' : '0.82rem',
                  color: TEXT_SECONDARY,
                }}
              >
                {subTitle}
              </Typography>
            )}
          </Box>

          {pagination && (
            <TablePagination
              component="div"
              count={totalCount ?? rows.length}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={(_, newPage) => {
                if (onPageChange) onPageChange(newPage)
                else setLocalPage(newPage)
              }}
              onRowsPerPageChange={(e) => {
                const value = Number(e.target.value)
                if (onRowsPerPageChange) onRowsPerPageChange(value)
                else {
                  setRowsPerPage(value)
                  setLocalPage(0)
                }
              }}
              rowsPerPageOptions={rowsPerPageOptions}
              labelRowsPerPage="Rows"
              sx={{
                width: { xs: '100%', md: 'auto' },
                overflow: 'hidden',
                '& .MuiTablePagination-toolbar': {
                  minHeight: 40,
                  px: { xs: 0, sm: 1 },
                  gap: { xs: 0.25, sm: 1 },
                },
                '& .MuiTablePagination-spacer': { display: { xs: 'none', sm: 'block' } },
                '& .MuiTablePagination-selectLabel': { display: { xs: 'none', sm: 'block' } },
                '& .MuiTablePagination-displayedRows': {
                  ml: { xs: 0.5, sm: 2 },
                  fontSize: { xs: '0.72rem', sm: '0.8rem' },
                  whiteSpace: 'nowrap',
                },
                '& .MuiTablePagination-actions': { ml: { xs: 'auto', sm: 2 } },
              }}
            />
          )}
        </Stack>
      )}

      <TableContainer
        sx={{
          position: 'relative',
          width: '100%',
          maxWidth: '100%',
          maxHeight: { xs: 'none', md: maxHeight },
          overflowX: shouldFitContainer ? 'hidden' : 'auto',
          overflowY: { xs: 'visible', md: 'auto' },
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorX: 'contain',
          '&::-webkit-scrollbar': {
            width: 8,
            height: 8,
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#D1D5DB',
            borderRadius: 10,
          },
        }}
      >
        {loading && (
          <>
            <LinearProgress
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 3,
                height: 3,
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(90deg, #0F766E 0%, #14B8A6 100%)',
                },
              }}
            />
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{
                position: 'absolute',
                top: 12,
                right: 16,
                zIndex: 3,
                px: 1.25,
                py: 0.75,
                borderRadius: 999,
                bgcolor: alpha('#0F172A', 0.76),
                color: '#F8FAFC',
                boxShadow: '0 10px 24px rgba(15, 23, 42, 0.18)',
              }}
            >
              <CircularProgress size={14} sx={{ color: '#5EEAD4' }} thickness={5} />
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 700 }}>{loadingLabel}</Typography>
            </Stack>
          </>
        )}
        <Table
          stickyHeader
          sx={{
            minWidth: shouldFitContainer ? '100%' : tableMinWidth,
            width: '100%',
            tableLayout: shouldFitContainer ? 'fixed' : 'auto',
            ...(shouldFitContainer
              ? {
                  '& .MuiTableCell-root': {
                    lineHeight: 1.25,
                  },
                  '& .MuiButton-root': {
                    minWidth: wrapCells ? 'auto' : 0,
                    maxWidth: '100%',
                    px: 0.65,
                    overflow: wrapCells ? 'visible' : 'hidden',
                    textOverflow: wrapCells ? 'clip' : 'ellipsis',
                    whiteSpace: wrapCells ? 'normal' : undefined,
                    height: wrapCells ? 'auto' : undefined,
                  },
                  '& .MuiChip-root': {
                    maxWidth: '100%',
                  },
                }
              : {}),
          }}
        >
          <TableHead>
            <TableRow>
              {selectable && (
                <TableCell padding="checkbox" sx={{ bgcolor: HEADER_BG }}>
                  <CustomCheckbox
                    checked={allSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableCell>
              )}

              {expandable && <TableCell sx={{ bgcolor: HEADER_BG }} />}

              {visibleColumns.map((column) => {
                const active = sortKey === column.id

                return (
                  <TableCell
                    key={String(column.id)}
                    align={column.align || 'left'}
                    sx={{
                      bgcolor: HEADER_BG,
                      minWidth: shouldFitContainer ? 0 : column.minWidth,
                      width: shouldFitContainer
                        ? `${((column.minWidth ?? 160) / visibleColumnMinWidthTotal) * 100}%`
                        : column.minWidth,
                      px: shouldFitContainer ? 0.65 : { xs: 1.25, sm: 1.5, md: 2 },
                      py: shouldFitContainer ? 0.8 : { xs: 1, md: 1.6 },
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      ...(column.stickyRight
                        ? {
                            position: 'sticky',
                            right: 0,
                            zIndex: 4,
                            boxShadow: '-12px 0 18px -18px rgba(15,23,42,0.7)',
                          }
                        : {}),
                    }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={0.5}
                      onClick={() => column.sortable && handleSort(column.id)}
                      sx={{
                        cursor: column.sortable ? 'pointer' : 'default',
                        userSelect: 'none',
                      }}
                    >
                      <Tooltip title={String(column.label)} arrow>
                        <Typography
                          sx={{
                            fontSize: isCompactDesktop ? '0.66rem' : '0.72rem',
                            fontWeight: 800,
                            color: HEADER_TEXT,
                            fontFamily: "'Inter','Poppins',sans-serif",
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            maxWidth: 170,
                            overflow: wrapCells ? 'visible' : 'hidden',
                            textOverflow: wrapCells ? 'clip' : 'ellipsis',
                            whiteSpace: wrapCells ? 'normal' : 'nowrap',
                            overflowWrap: wrapCells ? 'anywhere' : 'normal',
                          }}
                        >
                          {String(column.label)}
                        </Typography>
                      </Tooltip>

                      {column.sortable &&
                        (active && sortDir === 'asc' ? (
                          <MdKeyboardArrowUp size={16} color="#ff4d5a" />
                        ) : (
                          <MdKeyboardArrowDown size={16} color={active ? '#ff4d5a' : '#B5B5B5'} />
                        ))}
                    </Stack>
                  </TableCell>
                )
              })}
            </TableRow>
          </TableHead>

          <TableBody>
            {pagedRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length + (selectable ? 1 : 0) + (expandable ? 1 : 0)}
                  sx={{
                    py: 6,
                    textAlign: 'center',
                    borderBottom: 'none',
                    color: TEXT_SECONDARY,
                  }}
                >
                  <Stack spacing={0.75} alignItems="center">
                    {loading ? (
                      <CircularProgress size={22} sx={{ color: '#0F766E' }} thickness={5} />
                    ) : null}
                    <Typography sx={{ fontSize: '0.92rem', fontWeight: 600, color: TEXT_PRIMARY }}>
                      {loading ? loadingLabel : emptyMessage}
                    </Typography>
                    <Typography sx={{ fontSize: '0.8rem', color: TEXT_SECONDARY }}>
                      {loading
                        ? 'Please wait while we load the latest rows.'
                        : 'Try adjusting your filters or search terms.'}
                    </Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : (
              pagedRows.map((row) => {
                const expanded = expandedId === row.id

                return (
                  <React.Fragment key={row.id}>
                    <TableRow
                      hover
                      onClick={() => onRowClick?.(row)}
                      sx={{
                        transition: 'all .18s ease',
                        cursor: onRowClick ? 'pointer' : 'default',
                        '&:hover': {
                          bgcolor: '#FAFAFA',
                        },
                      }}
                    >
                      {selectable && (
                        <TableCell padding="checkbox">
                          <CustomCheckbox
                            checked={selectedIds.includes(row.id)}
                            onChange={() => handleSelect(row.id)}
                          />
                        </TableCell>
                      )}

                      {expandable && (
                        <TableCell>
                          <IconButton size="small" onClick={() => toggleExpand(row.id)}>
                            {expanded ? <MdExpandLess /> : <MdExpandMore />}
                          </IconButton>
                        </TableCell>
                      )}

                      {visibleColumns.map((column) => {
                        const value = row[column.id]
                        const showCellTooltip = column.showCellTooltip !== false
                        const isAwbColumn = String(column.id).toLowerCase().includes('awb')
                        const cellContent = (
                          <Box
                            sx={{
                              overflow: wrapCells ? 'visible' : 'hidden',
                              textOverflow: wrapCells ? 'clip' : 'ellipsis',
                              whiteSpace: wrapCells ? 'normal' : 'nowrap',
                              overflowWrap: wrapCells ? 'anywhere' : 'normal',
                            }}
                          >
                            {column.render
                              ? column.render(value, row)
                              : isAwbColumn
                                ? <AWBLink awb={String(value || '')} compact />
                                : String(value ?? '-')}
                          </Box>
                        )

                        return (
                          <TableCell
                            key={`${row.id}-${String(column.id)}`}
                            sx={{
                              minWidth: shouldFitContainer ? 0 : column.minWidth,
                              maxWidth: shouldFitContainer
                                ? undefined
                                : column.stickyRight
                                  ? (column.minWidth ?? 160)
                                  : 220,
                              whiteSpace: wrapCells ? 'normal' : 'nowrap',
                              overflow: wrapCells ? 'visible' : 'hidden',
                              textOverflow: wrapCells ? 'clip' : 'ellipsis',
                              fontSize: isCompactDesktop ? '0.74rem' : '0.82rem',
                              color: '#111111',
                              px: shouldFitContainer ? 0.65 : { xs: 1.25, sm: 1.5, md: 2 },
                              py: shouldFitContainer
                                ? 0.55
                                : { xs: 0.9, md: isCompactDesktop ? 0.85 : 1 },
                              overflowWrap: wrapCells ? 'anywhere' : 'normal',
                              borderBottom: '1px solid rgba(17,17,17,0.05)',
                              ...(column.stickyRight
                                ? {
                                    position: 'sticky',
                                    right: 0,
                                    zIndex: 2,
                                    bgcolor: BG,
                                    boxShadow: '-12px 0 18px -18px rgba(15,23,42,0.7)',
                                  }
                                : {}),
                            }}
                          >
                            {showCellTooltip ? (
                              <Tooltip title={String(value ?? '-')} arrow>
                                {cellContent}
                              </Tooltip>
                            ) : (
                              cellContent
                            )}
                          </TableCell>
                        )
                      })}
                    </TableRow>

                    {expandable && renderExpandedRow && (
                      <TableRow>
                        <TableCell
                          colSpan={visibleColumns.length + (selectable ? 1 : 0) + 1}
                          sx={{ p: 0 }}
                        >
                          <Collapse in={expanded} timeout="auto" unmountOnExit>
                            <Box
                              ref={expandedRef}
                              sx={{
                                p: 2,
                                bgcolor: '#FAFAFA',
                              }}
                            >
                              {renderExpandedRow(row)}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                )
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </CardContent>
  )
}
