const Card = {
  baseStyle: {
    p: '20px',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    position: 'relative',
    minWidth: '0px',
    wordWrap: 'break-word',
    backgroundClip: 'border-box',
    borderRadius: '8px',
    border: '1px solid',
    borderColor: '#D7DCE5',
    boxShadow: '0 3px 0 rgba(31, 35, 48, 0.06), 0 10px 24px rgba(31, 35, 48, 0.05)',
    transition: 'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease',
    _hover: {
      transform: 'translateY(-3px)',
      boxShadow: '0 7px 0 rgba(31, 35, 48, 0.07), 0 18px 34px rgba(31, 35, 48, 0.10)',
      borderColor: '#BFC6D3',
    },
  },
  variants: {
    panel: (props) => ({
      bg: props.colorMode === 'dark' ? '#221C2F' : 'white',
      width: '100%',
      border: props.colorMode === 'dark' ? '1px solid rgba(151, 141, 170, 0.25)' : '1px solid #D7DCE5',
      boxShadow:
        props.colorMode === 'dark'
          ? '0 8px 24px rgba(0,0,0,0.28)'
          : '0 3px 0 rgba(31, 35, 48, 0.06), 0 10px 24px rgba(31, 35, 48, 0.05)',
      borderRadius: '8px',
      overflow: 'hidden',
    }),
  },
  defaultProps: {
    variant: 'panel',
  },
}

export const CardComponent = {
  components: {
    Card,
  },
}
