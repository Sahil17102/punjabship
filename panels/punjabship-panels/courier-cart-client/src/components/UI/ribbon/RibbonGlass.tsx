import React from 'react'
import './RibbonGlass.css'

interface RibbonGlassProps {
  label: string
  count?: number
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  color?: string
}

const RibbonGlass: React.FC<RibbonGlassProps> = ({
  label,
  count,
  position = 'top-right',
  color = '#0877C9',
}) => {
  return (
    <div className={`glass-ribbon-container ${position}`}>
      <div className="glass-ribbon" style={{ backgroundColor: color }}>
        {label}
        {count !== undefined && <span className="ribbon-count">{count}</span>}
      </div>
    </div>
  )
}

export default RibbonGlass
