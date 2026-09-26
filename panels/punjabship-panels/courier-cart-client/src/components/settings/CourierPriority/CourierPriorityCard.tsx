import { Box, Card, CardHeader, Divider } from '@mui/material'
import React from 'react'
import { FaListUl, FaMoneyBillWave, FaShippingFast } from 'react-icons/fa'
import type { ProfileName } from './CourierPriorityPage'

interface CourierPriorityCardProps {
  profile: { name: string }
  selected?: boolean
  onSelect?: (name: ProfileName) => void
}

const CourierPriorityCard: React.FC<CourierPriorityCardProps> = ({
  profile,
  selected,
  onSelect,
}) => {
  const getIcon = () => {
    switch (profile.name) {
      case 'fastest':
        return <FaShippingFast size={26} color="#1976d2" />
      case 'economical':
        return <FaMoneyBillWave size={26} color="#2e7d32" />
      default:
        return <FaListUl size={26} color="#f57c00" />
    }
  }

  const getDescription = () => {
    switch (profile.name) {
      case 'fastest':
        return 'Prioritises the quickest delivery with express couriers.'
      case 'economical':
        return 'Chooses the most cost-effective courier option.'
      default:
        return 'Customise your own courier priority order.'
    }
  }

  return (
    <Card
      onClick={() => onSelect?.(profile.name as ProfileName)}
      sx={{
        width: 340,
        borderRadius: 4,
        cursor: 'pointer',
        border: selected ? '2px solid #b5577e' : '1px solid rgba(255,255,255,0.3)',
        background: selected ? 'rgb(181,87,126,0.15)' : 'rgba(255,255,255,0.12)',
        backdropFilter: 'blur(10px)',
        boxShadow: selected ? '0 8px 24px rgb(181,87,126,0.4)' : '0 6px 20px rgba(0,0,0,0.15)',
        transition: 'all 0.25s ease-in-out',
        '&:hover': {
          boxShadow: '0 10px 28px rgb(181,87,126,0.4)',
          transform: 'translateY(-4px)',
        },
      }}
    >
      <CardHeader
        avatar={
          <Box display="flex" alignItems="center">
            {getIcon()}
          </Box>
        }
        title={profile.name.toUpperCase()}
        titleTypographyProps={{
          variant: 'h6',
          fontWeight: selected ? 'bold' : 'medium',
          color: 'text.primary',
        }}
        subheader={getDescription()}
        subheaderTypographyProps={{
          variant: 'body2',
          color: 'text.secondary',
        }}
      />
      <Divider sx={{ opacity: 0.3 }} />
    </Card>
  )
}

export default CourierPriorityCard
