import { mode } from '@chakra-ui/theme-tools'
import colors from './foundations/colors'

export const globalStyles = {
  colors: {
    ...colors,
  },
  styles: {
    global: (props) => ({
      body: {
        bg: mode('#F2F4F7', '#111318')(props),
        color: mode('gray.800', 'gray.100')(props),
        fontFamily: "'Epilogue Variable', 'Segoe UI', sans-serif",
        backgroundImage: mode(
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 36 36'%3E%3Cpath d='M0 35.5H36M35.5 0V36' fill='none' stroke='%23CBD2DC' stroke-opacity='.32'/%3E%3Ccircle cx='8' cy='8' r='1' fill='%230877C9' fill-opacity='.12'/%3E%3C/svg%3E\")",
          'none',
        )(props),
        backgroundSize: '36px 36px',
        backgroundAttachment: 'fixed',
        width: '100%',
        minWidth: 0,
        overflowX: 'hidden',
      },
      '*, *::before, *::after': {
        boxSizing: 'border-box',
        minWidth: 0,
      },
      html: {
        fontFamily: "'Epilogue Variable', 'Segoe UI', sans-serif",
        width: '100%',
        minWidth: 0,
      },
      '#root': {
        minHeight: '100vh',
        width: '100%',
        minWidth: 0,
        overflowX: 'hidden',
      },
      '::selection': {
        background: mode('brand.200', 'brand.600')(props),
      },
      'input, select, textarea': {
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        borderColor: mode('#D8DCE3', 'whiteAlpha.300')(props),
        backgroundColor: mode('#FFFFFF', 'whiteAlpha.100')(props),
      },
      'button': {
        maxWidth: '100%',
        minWidth: 0,
        whiteSpace: 'normal',
        overflowWrap: 'anywhere',
      },
      'table': { width: '100%' },
      'th, td': {
        minWidth: 0,
        overflowWrap: 'anywhere',
        wordBreak: 'break-word',
      },
    }),
  },
}
