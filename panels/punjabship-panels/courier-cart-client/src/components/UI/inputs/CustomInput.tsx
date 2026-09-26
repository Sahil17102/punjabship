import { Box, IconButton, InputAdornment, TextField, Typography } from '@mui/material'
import type { TextFieldProps } from '@mui/material/TextField'
import React, { forwardRef, useEffect, useRef, useState } from 'react'
import { MdVisibility, MdVisibilityOff } from 'react-icons/md'
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

interface CustomInputProps extends Omit<TextFieldProps, 'variant' | 'prefix' | 'postfix'> {
  label?: string
  placeholder?: string
  prefix?: React.ReactNode
  postfix?: React.ReactNode
  required?: boolean
  width?: string | number
  helpText?: string
  topMargin?: boolean
  maxLength?: number
  dense?: boolean
  rounded?: boolean
}

const CustomInput = forwardRef<HTMLInputElement, CustomInputProps>(
  (
    {
      value,
      onChange,
      type = 'text',
      label = '',
      placeholder = '',
      prefix,
      postfix,
      required = false,
      helperText,
      className,
      width = '100%',
      helpText,
      topMargin = true,
      maxLength,
      dense = false,
      rounded = false,
      ...props
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const internalRef = useRef<HTMLInputElement>(null)

    const isPasswordType = type === 'password'

    const handleFocus = () => setIsFocused(true)
    const handleBlur = () => {
      if (!internalRef.current?.value) setIsFocused(false)
    }

    useEffect(() => {
      if (value) setIsFocused(true)
    }, [value])

    const togglePasswordVisibility = () => {
      setShowPassword((prev) => !prev)
    }

    return (
      <div
        className={`${styles.inputContainer} ${className ?? ''}`}
        style={{ marginTop: topMargin ? (dense ? '8px' : '16px') : '0px' }}
      >
        {label && (
          <Typography
            sx={LABEL_SX}
            mb={dense ? 0.25 : 0.8}
            className={`${styles.customLabel} ${isFocused ? styles.labelFocused : ''}`}
            onClick={() => internalRef.current?.focus()}
          >
            {label}
            {required && <span className={styles.required}>*</span>}
          </Typography>
        )}

        <TextField
          type={isPasswordType && showPassword ? 'text' : type}
          value={value}
          onChange={onChange}
          helperText={helperText}
          fullWidth
          sx={{
            width,
            '& .MuiOutlinedInput-root': {
              minHeight: dense ? DENSE_CONTROL_MIN_HEIGHT : CONTROL_MIN_HEIGHT,
              borderRadius: rounded ? 1.25 : 0,
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
            '& .MuiOutlinedInput-input': {
              padding: dense ? '5px 8px' : '12px 14px',
              fontSize: dense ? '0.82rem' : '0.95rem',
              color: '#111827',
              boxSizing: 'border-box',
            },
            '& .MuiFormHelperText-root': {
              marginLeft: 0,
              marginRight: 0,
              marginTop: dense ? '2px' : '6px',
            },
          }}
          placeholder={placeholder}
          inputRef={(el) => {
            // assign to both forwardRef and internalRef
            if (typeof ref === 'function') ref(el)
            else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = el
            internalRef.current = el
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`${styles.textFieldRoot}`}
          slotProps={{
            input: {
              startAdornment: prefix ? (
                <InputAdornment position="start" sx={{ color: '#6B7280', mr: 0.5 }}>
                  {prefix}
                </InputAdornment>
              ) : undefined,
              endAdornment: (
                <InputAdornment position="end" sx={{ color: '#6B7280', ml: 0.5 }}>
                  {isPasswordType ? (
                    <IconButton onClick={togglePasswordVisibility} edge="end" sx={{ borderRadius: 0 }}>
                      {showPassword ? (
                        <MdVisibilityOff size={17} color="#6B7280" />
                      ) : (
                        <MdVisibility size={17} color="#6B7280" />
                      )}
                    </IconButton>
                  ) : (
                    postfix
                  )}
                </InputAdornment>
              ),
            },
            htmlInput: {
              maxLength: maxLength ?? 100,
            },
          }}
          {...props}
        />
        {helpText ? (
          <Box
            sx={{
              mt: 0.5,
              display: 'flex',
              justifyContent: 'flex-end',
              width: '100%',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontSize: '11px',
                color: '#6B7280',
                textAlign: 'right',
              }}
            >
              {helpText}
            </Typography>
          </Box>
        ) : null}
      </div>
    )
  },
)

CustomInput.displayName = 'CustomInput'

export default CustomInput
