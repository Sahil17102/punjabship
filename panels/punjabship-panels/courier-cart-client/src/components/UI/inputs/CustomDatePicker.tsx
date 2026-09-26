import { Box, Typography } from '@mui/material'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import React from 'react'
import styles from './CustomInput.module.css'

const LABEL_SX = {
  fontSize: '12px',
  color: '#374151',
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
}

const CONTROL_MIN_HEIGHT = 48
const DENSE_CONTROL_MIN_HEIGHT = 34

interface CustomDatePickerProps {
  label?: string
  required?: boolean
  value?: string | Date | null
  onChange?: (e: { target: { value: string } }) => void
  placeholder?: string
  helperText?: string
  width?: string | number
  topMargin?: boolean
  error?: boolean
  dense?: boolean
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  label = '',
  required = false,
  value,
  onChange,
  placeholder = '',
  helperText,
  width = '100%',
  topMargin = true,
  error = false,
  dense = false,
}) => {
  return (
    <div
      className={styles.inputContainer}
      style={{
        marginTop: topMargin ? (dense ? '8px' : '16px') : '0px',
      }}
    >
      {label && (
        <Typography sx={LABEL_SX} mb={dense ? 0.25 : 0.8} className={styles.customLabel}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </Typography>
      )}

      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DatePicker
          orientation="landscape"
          value={value ? new Date(value as string) : null}
          onChange={(newValue: Date | null) => {
            if (onChange) {
              const formatted = newValue
                ? newValue.toISOString().split('T')[0] // yyyy-MM-dd
                : ''
              onChange({ target: { value: formatted } })
            }
          }}
          slotProps={{
            textField: {
              fullWidth: true,
              sx: {
                width,
                '& .MuiOutlinedInput-root': {
                  minHeight: dense ? DENSE_CONTROL_MIN_HEIGHT : CONTROL_MIN_HEIGHT,
                  borderRadius: 0,
                  backgroundColor: '#FFFFFF',
                  alignItems: 'center',
                  '& fieldset': {
                    borderColor: 'rgba(17, 24, 39, 0.12)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(17, 24, 39, 0.2)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#0877C9',
                  },
                },
                '& .MuiInputBase-input': {
                  padding: dense ? '5px 8px' : '12px 14px',
                  boxSizing: 'border-box',
                  fontSize: dense ? '0.82rem' : '0.95rem',
                  color: '#111827',
                  zIndex: 2,
                },
                '& .MuiFormHelperText-root': {
                  marginLeft: 0,
                  marginRight: 0,
                  marginTop: dense ? '2px' : '6px',
                },
              },
              placeholder,
              error: Boolean(error),
            },
          }}
          enableAccessibleFieldDOMStructure={false} // fix slot error
        />
      </LocalizationProvider>

      {helperText && (
        <Box sx={{ mt: 0.5, textAlign: 'right' }}>
          <Typography
            variant="caption"
            sx={{
              fontSize: '11px',
              color: '#6B7280',
            }}
          >
            {helperText}
          </Typography>
        </Box>
      )}
    </div>
  )
}

export default CustomDatePicker
