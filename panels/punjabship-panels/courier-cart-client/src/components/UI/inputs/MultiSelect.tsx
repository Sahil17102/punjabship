import {
  Box,
  Checkbox,
  ClickAwayListener,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import ReactDOM from 'react-dom'
import { MdClose } from 'react-icons/md'
import CustomInput from './CustomInput'

interface MultiSelectOption {
  label: string
  value: string | number | boolean
}

interface MultiSelectProps {
  label: string
  value: Array<MultiSelectOption | string | number | boolean>
  onChange: (val: MultiSelectOption[]) => void
  options: MultiSelectOption[]
  placeholder?: string
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder,
}) => {
  const [inputValue, setInputValue] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 })

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const filteredOptions = useMemo(() => {
    if (!inputValue) return options
    return options.filter((opt) => opt.label.toLowerCase().includes(inputValue.toLowerCase()))
  }, [inputValue, options])

  const selectedValues = useMemo(
    () =>
      (Array.isArray(value) ? value : [])
        .map((item) =>
          item && typeof item === 'object' && 'value' in item
            ? (item as MultiSelectOption).value
            : item,
        )
        .map((item) => String(item)),
    [value],
  )

  const toggleOption = (option: MultiSelectOption) => {
    const exists = selectedValues.includes(String(option.value))
    const normalizedSelection = options.filter((opt) => selectedValues.includes(String(opt.value)))
    if (exists) onChange(normalizedSelection.filter((v) => String(v.value) !== String(option.value)))
    else onChange([...normalizedSelection, option])
  }

  // Calculate dropdown position dynamically (desktop only)
  const calculatePosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect()
      setDropdownPos({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      })
    }
  }

  useEffect(() => {
    if (open && !isMobile) calculatePosition()
    window.addEventListener('resize', calculatePosition)
    window.addEventListener('scroll', calculatePosition)
    return () => {
      window.removeEventListener('resize', calculatePosition)
      window.removeEventListener('scroll', calculatePosition)
    }
  }, [open, isMobile])

  // Desktop dropdown
  const dropdown = !isMobile && open && filteredOptions.length > 0 && (
    <Paper
      elevation={3}
      sx={{
        position: 'absolute',
        top: dropdownPos.top,
        left: dropdownPos.left,
        width: dropdownPos.width,
        maxHeight: 250,
        overflowY: 'auto',
        bgcolor: 'rgb(22, 14, 45, 0.95)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        p: 1,
      }}
    >
      {filteredOptions.map((opt) => {
        const selected = selectedValues.includes(String(opt.value))
        return (
          <Box
            key={opt.value.toString()}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 1,
              py: 0.5,
              cursor: 'pointer',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
            }}
            onClick={() => toggleOption(opt)}
          >
            <Checkbox checked={selected} sx={{ color: '#fff' }} />
            <Typography sx={{ color: '#fff', fontSize: 14 }}>{opt.label}</Typography>
          </Box>
        )
      })}
    </Paper>
  )

  // Mobile dropdown as full-screen dialog
  const mobileDropdown = isMobile && (
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {label}
        <IconButton onClick={() => setOpen(false)}>
          <MdClose />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {filteredOptions.map((opt) => {
          const selected = selectedValues.includes(String(opt.value))
          return (
            <Box
              key={opt.value.toString()}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 1,
                py: 1,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
              }}
              onClick={() => toggleOption(opt)}
            >
              <Checkbox checked={selected} sx={{ color: '#000' }} />
              <Typography sx={{ fontSize: 16 }}>{opt.label}</Typography>
            </Box>
          )
        })}
      </DialogContent>
    </Dialog>
  )

  return (
    <ClickAwayListener onClickAway={() => !isMobile && setOpen(false)}>
      <Box sx={{ position: 'relative', width: '100%' }}>
        <CustomInput
          label={label}
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          width="100%"
          ref={inputRef}
          postfix={
            selectedValues.length > 0 ? (
              <Typography sx={{ color: '#fff', fontSize: 13, fontWeight: 500 }}>
                {selectedValues.length} selected
              </Typography>
            ) : undefined
          }
        />
        {ReactDOM.createPortal(dropdown, document.body)}
        {mobileDropdown}
      </Box>
    </ClickAwayListener>
  )
}

export default MultiSelect
