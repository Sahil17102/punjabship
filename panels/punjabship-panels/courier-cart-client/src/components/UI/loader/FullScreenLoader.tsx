import { Box } from '@mui/material'
import React from 'react'
import './loader.css'
import Logo from '/logo/punjabship-mark.svg'

type Props = {
  night?: boolean
}

const FullScreenLoader: React.FC<Props> = ({ night = false }) => {
  return (
    <Box className={`loader-overlay ${night ? 'night' : ''}`}>
      <Box className="loader-content">
        <div className="logo-container">
          <img src={Logo} alt="PunjabShip Logo" className="loader-logo" />
          <div className="pulse-ring"></div>
          <div className="pulse-ring pulse-ring-delay"></div>
        </div>
      </Box>
    </Box>
  )
}

export default FullScreenLoader
