import React from 'react'

interface FancyDashedButtonProps {
  label: string
  onClick: () => void
  borderColor?: string
  backgroundColor?: string
  textColor?: string
  shadowColor?: string
  paddingX?: string // e.g. "3em"
  paddingY?: string // e.g. "1em"
  fontSize?: string
  borderRadius?: string
  style?: React.CSSProperties
}

const FancyDashedButton: React.FC<FancyDashedButtonProps> = ({
  label,
  onClick,
  borderColor = '#0877C9',
  backgroundColor = '#0877C9',
  textColor = '#ffffff',
  shadowColor = '#0877C9',
  paddingX = '3em',
  paddingY = '1em',
  fontSize = '1rem',
  borderRadius = '15px',
  style = {},
}) => {
  return (
    <button
      onClick={onClick}
      style={{
        outline: 'none',
        color: textColor,
        padding: `${paddingY} ${paddingX}`,
        border: `2px dashed ${borderColor}`,
        borderRadius: borderRadius,
        backgroundColor: backgroundColor,
        boxShadow: `0 0 0 4px ${shadowColor}, 2px 2px 4px 2px rgba(0, 0, 0, 0.5)`,
        transition: '.1s ease-in-out, .4s color',
        fontSize: fontSize,
        fontWeight: 500,
        cursor: 'pointer',
        ...style,
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'translate(0.1em, 0.1em)'
        e.currentTarget.style.boxShadow = `0 0 0 4px ${shadowColor}, 1.5px 1.5px 2.5px 1.5px rgba(0, 0, 0, 0.5)`
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'none'
        e.currentTarget.style.boxShadow = `0 0 0 4px ${shadowColor}, 2px 2px 4px 2px rgba(0, 0, 0, 0.5)`
      }}
    >
      {label}
    </button>
  )
}

export default FancyDashedButton
