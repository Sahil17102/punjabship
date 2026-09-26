import {
  FormControl,
  FormHelperText,
  Switch as MuiSwitch,
  Stack,
  Typography,
  styled,
  useTheme,
} from '@mui/material'
import { type ChangeEvent } from 'react'

interface CustomSwitchProps {
  label?: string
  checked: boolean
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
  helperText?: string
}

const CustomStyledSwitch = styled(MuiSwitch)(({ theme }) => ({
  width: 36,
  height: 20,
  padding: 0,
  display: 'flex',

  '& .MuiSwitch-switchBase': {
    padding: 2,
    transitionDuration: '300ms',
    '&.Mui-checked': {
      transform: 'translateX(16px)',
      color: '#fff',
      '& + .MuiSwitch-track': {
        background: 'linear-gradient(90deg, #0877C9, #4A5A84)',
        opacity: 1,
      },
    },
    '&.Mui-disabled + .MuiSwitch-track': {
      opacity: 0.4,
    },
  },

  '& .MuiSwitch-thumb': {
    backgroundColor: '#fff',
    width: 14,
    height: 14,
    borderRadius: '50%',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
    transition: 'all 0.3s ease',
  },

  '& .MuiSwitch-track': {
    borderRadius: 10,
    backgroundColor: theme.palette.mode === 'dark' ? '#444' : '#ddd',
    opacity: 1,
    transition: theme.transitions.create(['background-color'], {
      duration: 300,
    }),
  },
}))

const CustomSwitch = ({
  label,
  checked,
  onChange,
  disabled = false,
  helperText,
}: CustomSwitchProps) => {
  const theme = useTheme()

  return (
    <FormControl
      component="fieldset"
      sx={{
        width: '100%',
        border: '1px solid #0877C9',
        borderRadius: '10px',
        padding: 1,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={2}
        sx={{ px: 0.5, py: 0.75 }}
      >
        {label && (
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{
              color: disabled ? 'text.disabled' : 'text.primary',
              opacity: 0.9,
            }}
          >
            {label}
          </Typography>
        )}

        <CustomStyledSwitch checked={checked} onChange={onChange} disabled={disabled} />
      </Stack>

      {helperText && (
        <FormHelperText
          sx={{
            mt: 0.25,
            fontSize: '11px',
            fontStyle: 'italic',
            color: theme.palette.text.secondary,
          }}
        >
          {helperText}
        </FormHelperText>
      )}
    </FormControl>
  )
}

export default CustomSwitch
