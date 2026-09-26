import { Box } from '@mui/material'
import Checkbox, { type CheckboxProps } from '@mui/material/Checkbox'

// Improved tick SVG with animation - extends outside box
const CustomTick = ({ checked }: { checked?: boolean }) => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#3DD598" // Green accent color
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: checked ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0.8)',
      pointerEvents: 'none',
      opacity: checked ? 1 : 0,
      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    }}
  >
    <polyline points="4 12 9 17 20 6" />
  </svg>
)

export default function CustomCheckbox(props: CheckboxProps) {
  return (
    <Checkbox
      {...props}
      disableRipple={false}
      color="primary"
      icon={
        <Box
          sx={{
            width: 20,
            height: 20,
            borderRadius: '6px',
            border: '2px solid #E0E6ED',
            boxSizing: 'border-box',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            backgroundColor: '#FFFFFF',
            transition: 'all 0.2s ease',
            '&:hover': {
              borderColor: '#0877C9',
              boxShadow: '0 0 0 3px rgba(51, 51, 105, 0.08)',
            },
          }}
        />
      }
      checkedIcon={
        <Box
          sx={{
            width: 20,
            height: 20,
            borderRadius: '6px',
            border: '2px solid #0877C9',
            boxSizing: 'border-box',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            backgroundColor: '#FFFFFF', // White background when checked
            transition: 'all 0.2s ease',
            overflow: 'visible', // Allow tick to extend outside
            '&:hover': {
              borderColor: '#2F3B5F',
              boxShadow: '0 0 0 3px rgba(51, 51, 105, 0.12)',
            },
          }}
        >
          <CustomTick checked />
        </Box>
      }
      sx={{
        padding: '8px',
        overflow: 'visible', // Allow tick to extend outside checkbox area
        '&:hover': {
          backgroundColor: 'rgba(51, 51, 105, 0.04)',
        },
        '&.Mui-focusVisible': {
          outline: '2px solid #0877C9',
          outlineOffset: '2px',
          borderRadius: '4px',
        },
        '& .MuiTouchRipple-root': {
          color: 'rgba(51, 51, 105, 0.3)',
        },
        '& svg': {
          overflow: 'visible', // Ensure SVG tick can extend beyond bounds
        },
      }}
    />
  )
}
