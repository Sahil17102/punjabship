export const buttonStyles = {
  components: {
    Button: {
      variants: {
        'no-hover': {
          _hover: {
            boxShadow: 'none',
          },
        },
        'transparent-with-icon': {
          bg: 'transparent',
          fontWeight: '700',
          borderRadius: '8px',
          cursor: 'pointer',
          _active: {
            bg: 'transparent',
            transform: 'none',
            borderColor: 'transparent',
          },
          _focus: {
            boxShadow: 'none',
          },
          _hover: {
            bg: 'rgba(111, 34, 198, 0.06)',
          },
        },
      },
      baseStyle: {
        borderRadius: '8px',
        fontWeight: '700',
        border: '1px solid',
        borderColor: 'gray.200',
        transition: 'border-color 140ms ease, background-color 140ms ease, color 140ms ease',
        _focus: {
          boxShadow: 'none',
        },
        _hover: {
          borderColor: 'brand.300',
          boxShadow: 'none',
        },
      },
    },
  },
}
