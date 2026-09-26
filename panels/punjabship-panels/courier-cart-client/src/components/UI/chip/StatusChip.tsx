import { Chip, type ChipProps } from '@mui/material'
import React from 'react'
import { FaCheckCircle } from 'react-icons/fa'
import { MdError, MdInfo, MdPending } from 'react-icons/md'

interface StatusChipProps extends Partial<ChipProps> {
  status: 'success' | 'pending' | 'error' | 'info'
  label?: string
}

const STATUS_STYLES = {
  success: {
    bg: '#E8F7EE',
    color: '#15803D',
    icon: <FaCheckCircle size={12} />,
    defaultLabel: 'Success',
  },

  pending: {
    bg: '#FFF7E6',
    color: '#B45309',
    icon: <MdPending size={14} />,
    defaultLabel: 'Pending',
  },

  error: {
    bg: '#FEECEC',
    color: '#B91C1C',
    icon: <MdError size={14} />,
    defaultLabel: 'Failed',
  },

  info: {
    bg: '#EEF2F7',
    color: '#334155',
    icon: <MdInfo size={14} />,
    defaultLabel: 'Info',
  },
}

const StatusChip: React.FC<StatusChipProps> = ({ status, label, ...props }) => {
  const style = STATUS_STYLES[status] || STATUS_STYLES.info

  return (
    <Chip
      size="small"
      icon={style.icon}
      label={label || style.defaultLabel}
      sx={{
        height: 28,
        px: 0.4,
        borderRadius: '8px',
        backgroundColor: style.bg,
        color: style.color,
        fontSize: '11px',
        fontWeight: 700,
        border: 'none',
        letterSpacing: '0.02em',
        textTransform: 'none',

        '& .MuiChip-label': {
          px: 1,
        },

        '& .MuiChip-icon': {
          color: style.color,
          ml: 0.7,
        },

        '&:hover': {
          opacity: 0.92,
        },

        ...props.sx,
      }}
      {...props}
    />
  )
}

export default StatusChip
