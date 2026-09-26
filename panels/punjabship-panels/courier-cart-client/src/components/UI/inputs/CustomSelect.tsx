import {
  alpha,
  Box,
  ClickAwayListener,
  Grow,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Popper,
  Typography,
} from '@mui/material'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { MdArrowDropDown, MdCheck } from 'react-icons/md'

interface DropdownItem {
  key: string | boolean
  label: string
  description?: string
  icon?: React.ElementType
}

interface DropdownMenuProps {
  label?: string
  items: DropdownItem[]
  onSelect: (key: string | boolean) => void
  value?: string | boolean
  width?: number | string
  required?: boolean
  placeholder?: string
  inputValue?: string
  helperText?: string
  onInputChange?: (val: string) => void
  error?: boolean
  topMargin?: boolean
  dense?: boolean
  searchable?: boolean // 🔍 new prop
}

export default function CustomSelect({
  label,
  items,
  onSelect,
  value,
  width,
  placeholder,
  required,
  topMargin = true,
  helperText,
  error,
  inputValue,
  onInputChange,
  searchable = true,
  dense = false,
}: DropdownMenuProps) {
  const anchorRef = useRef<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  const selectedItem = items.find((item) => item?.key === value)
  const effectiveInputValue = inputValue ?? search

  useEffect(() => {
    if (!open) {
      setSearch('')
      setHighlightedIndex(0)
    }
  }, [open])

  useEffect(() => {
    const selectedIndex = items.findIndex((item) => item.key === value)
    if (selectedIndex >= 0) {
      setHighlightedIndex(selectedIndex)
    }
  }, [items, value])

  const handleToggle = () => {
    setOpen((prev) => !prev)
  }

  const handleClose = (event?: MouseEvent | TouchEvent) => {
    if (
      anchorRef.current &&
      event?.target instanceof Node &&
      anchorRef.current.contains(event.target)
    ) {
      return // Don't close if clicking inside input
    }
    setOpen(false)
  }

  const handleSelect = (key: string | boolean, label: string) => {
    onSelect(key)
    onInputChange?.(label)
    setSearch('')
    setOpen(false)
  }

  const filteredItems = useMemo(() => {
    if (!searchable || !effectiveInputValue.trim()) return items
    const normalizedQuery = effectiveInputValue.toLowerCase()
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(normalizedQuery) ||
        item.description?.toLowerCase().includes(normalizedQuery),
    )
  }, [effectiveInputValue, items, searchable])

  useEffect(() => {
    if (filteredItems.length === 0) {
      setHighlightedIndex(0)
      return
    }

    if (highlightedIndex > filteredItems.length - 1) {
      setHighlightedIndex(0)
    }
  }, [filteredItems, highlightedIndex])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault()
      setOpen(true)
      return
    }

    if (!open) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightedIndex((prev) => (prev + 1) % Math.max(filteredItems.length, 1))
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightedIndex(
        (prev) =>
          (prev - 1 + Math.max(filteredItems.length, 1)) % Math.max(filteredItems.length, 1),
      )
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      const item = filteredItems[highlightedIndex]
      if (item) handleSelect(item.key, item.label)
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
    }
  }

  return (
    <Box sx={{ width: width || '100%', mt: topMargin ? (dense ? 0.5 : 1.5) : 0 }}>
      <Box>
        {label && (
          <Typography
            sx={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#4f4f4f',
              mb: dense ? 0.25 : 0.6,
              display: 'flex',
              gap: 0.3,
            }}
          >
            {label}
            {required && <span style={{ color: '#0877C9' }}>*</span>}
          </Typography>
        )}
        <div ref={anchorRef}>
          <Box
            onClick={handleToggle}
            onFocus={() => setOpen(true)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              px: dense ? 0.9 : 1.5,
              py: dense ? 0.45 : 1.1,
              minHeight: dense ? 34 : undefined,
              borderRadius: 1.2,
              border: `1px solid ${error ? '#EF4444' : 'rgba(17, 24, 39, 0.16)'}`,
              backgroundColor: '#FFFFFF',
              cursor: 'pointer',
              transition: 'all 200ms ease',
              '&:hover': {
                borderColor: error ? '#EF4444' : 'rgba(17, 24, 39, 0.25)',
                backgroundColor: 'rgba(17, 24, 39, 0.01)',
              },
              '&:focus-within': {
                borderColor: '#0877C9',
                boxShadow: '0 0 0 3px rgba(217, 4, 22, 0.1)',
              },
            }}
          >
            <Typography
              sx={{
                fontSize: dense ? '0.82rem' : '0.95rem',
                color: selectedItem ? '#111827' : '#9CA3AF',
                fontWeight: selectedItem ? 500 : 400,
                flex: 1,
              }}
            >
              {open && searchable ? (
                <input
                  type="text"
                  value={effectiveInputValue}
                  onChange={(e) => {
                    const nextValue = e.target.value
                    onInputChange?.(nextValue)
                    setSearch(nextValue)
                    setHighlightedIndex(0)
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder || ''}
                  autoFocus
                  style={{
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    fontSize: 'inherit',
                    fontFamily: 'inherit',
                    background: 'transparent',
                    color: '#111827',
                  }}
                />
              ) : (
                selectedItem?.label || placeholder || ''
              )}
            </Typography>
            <MdArrowDropDown
              size={20}
              style={{
                transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
                color: '#9CA3AF',
                flexShrink: 0,
                marginLeft: '8px',
              }}
            />
          </Box>
        </div>
        {helperText && (
          <Typography
            sx={{
              fontSize: '0.8rem',
              color: error ? '#EF4444' : '#6B7280',
              mt: dense ? 0.2 : 0.5,
            }}
          >
            {helperText}
          </Typography>
        )}
      </Box>

      <Popper
        open={open}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        transition
        style={{ zIndex: 1300 }}
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps} style={{ transformOrigin: 'top left' }}>
            <Box>
              {open && (
                <ClickAwayListener onClickAway={handleClose}>
                  <Paper
                    elevation={0}
                    sx={{
                      bgcolor: '#FFFFFF',
                      borderRadius: 0,
                      border: '1px solid rgba(17, 24, 39, 0.12)',
                      boxShadow: '0 14px 28px rgba(15, 23, 42, 0.08)',
                      width: anchorRef.current
                        ? anchorRef.current.getBoundingClientRect().width
                        : '100%',
                      maxHeight: 320,
                      overflowY: 'auto',
                      mt: 0.75,
                      '&::-webkit-scrollbar': {
                        width: '6px',
                      },
                      '&::-webkit-scrollbar-track': {
                        background: '#F3F4F6',
                        borderRadius: 0,
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: '#C4C9D4',
                        borderRadius: 0,
                        '&:hover': {
                          background: '#9CA3AF',
                        },
                      },
                    }}
                  >
                    <List dense disablePadding sx={{ py: 0.5 }}>
                      {filteredItems.length > 0 ? (
                        filteredItems.map((item, index) => (
                          <ListItemButton
                            key={String(item.key)}
                            selected={value === item.key}
                            onClick={() => handleSelect(item.key, item.label)}
                            sx={{
                              mx: 0.5,
                              my: 0.15,
                              minHeight: item.description ? 58 : 48,
                              borderRadius: 0,
                              transition: 'background-color 0.2s ease, border-color 0.2s ease',
                              alignItems: 'center',
                              borderLeft: `3px solid ${
                                value === item.key
                                  ? '#0877C9'
                                  : highlightedIndex === index
                                    ? alpha('#0877C9', 0.42)
                                    : 'transparent'
                              }`,
                              bgcolor:
                                value === item.key
                                  ? alpha('#0877C9', 0.08)
                                  : highlightedIndex === index
                                    ? '#F8FAFC'
                                    : 'transparent',
                              '&:hover': {
                                bgcolor: '#F8FAFC',
                                borderLeftColor: '#0877C9',
                              },
                              '&.Mui-selected': {
                                bgcolor: alpha('#0877C9', 0.08),
                                borderLeft: '3px solid #0877C9',
                                '&:hover': {
                                  bgcolor: alpha('#0877C9', 0.12),
                                },
                                '& .MuiListItemIcon-root': {
                                  color: '#0877C9',
                                },
                                '& .MuiListItemText-primary': {
                                  color: '#0877C9',
                                  fontWeight: 600,
                                },
                              },
                            }}
                          >
                            {item.icon && (
                              <ListItemIcon
                                sx={{
                                  color: value === item.key ? '#0877C9' : '#4B5563',
                                  minWidth: 36,
                                }}
                              >
                                {React.createElement(item.icon, { size: 20 })}
                              </ListItemIcon>
                            )}
                            <ListItemText
                              primary={
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: value === item.key ? 700 : 600,
                                    color: '#111827',
                                  }}
                                >
                                  {item.label}
                                </Typography>
                              }
                              secondary={
                                item.description ? (
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: '#6B7280',
                                      fontSize: '0.74rem',
                                      display: 'block',
                                      mt: 0.25,
                                      lineHeight: 1.45,
                                    }}
                                  >
                                    {item.description}
                                  </Typography>
                                ) : null
                              }
                            />
                            {value === item.key ? (
                              <Box
                                sx={{
                                  color: '#0877C9',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  pl: 1,
                                }}
                              >
                                <MdCheck size={18} />
                              </Box>
                            ) : null}
                          </ListItemButton>
                        ))
                      ) : (
                        <Box sx={{ textAlign: 'center', py: 3 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#6B7280',
                              fontWeight: 600,
                            }}
                          >
                            No matching options
                          </Typography>
                        </Box>
                      )}
                    </List>
                  </Paper>
                </ClickAwayListener>
              )}
            </Box>
          </Grow>
        )}
      </Popper>
    </Box>
  )
}
