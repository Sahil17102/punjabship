import { alpha, createTheme } from '@mui/material/styles'

const BRAND_ORANGE = '#0877C9'
const BRAND_ORANGE_DARK = '#0564AD'
const BRAND_ORANGE_LIGHT = '#38A8ED'
const BRAND_GREEN = '#DFFF1F'
const BRAND_GREEN_DARK = '#B8D719'
const BRAND_GREEN_LIGHT = '#BDFF59'
const BRAND_INK = '#141414'
const BRAND_SLATE = '#34343B'
const BRAND_MUTED = '#777780'
const BRAND_CANVAS = '#F7F8FC'
const BRAND_SURFACE = '#FFFFFF'
const BRAND_SURFACE_ALT = '#FBFAFE'
const BRAND_BORDER = '#DED9E8'

const theme = createTheme({
  breakpoints: {
    values: {
      xs: 300,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  palette: {
    mode: 'light',
    primary: {
      main: BRAND_ORANGE,
      light: BRAND_ORANGE_LIGHT,
      dark: BRAND_ORANGE_DARK,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: BRAND_GREEN,
      light: BRAND_GREEN_LIGHT,
      dark: BRAND_GREEN_DARK,
      contrastText: '#FFFFFF',
    },
    background: {
      default: BRAND_CANVAS,
      paper: BRAND_SURFACE,
    },
    text: {
      primary: BRAND_INK,
      secondary: BRAND_MUTED,
      disabled: '#AAA4A0',
    },
    divider: BRAND_BORDER,
    error: {
      main: '#C62828',
    },
    warning: {
      main: '#C97A12',
    },
    info: {
      main: '#2563EB',
    },
    success: {
      main: BRAND_GREEN,
    },
  },
  shape: {
    borderRadius: 6,
  },
  typography: {
    fontFamily: '"Epilogue Variable", "Segoe UI", sans-serif',
    h1: { color: BRAND_INK, fontFamily: '"Hahmlet Variable", Georgia, serif', fontWeight: 700, letterSpacing: 0 },
    h2: { color: BRAND_INK, fontFamily: '"Hahmlet Variable", Georgia, serif', fontWeight: 700, letterSpacing: 0 },
    h3: { color: BRAND_INK, fontFamily: '"Hahmlet Variable", Georgia, serif', fontWeight: 700, letterSpacing: 0 },
    h4: { color: BRAND_INK, fontFamily: '"Hahmlet Variable", Georgia, serif', fontWeight: 700, letterSpacing: 0 },
    h5: { color: BRAND_INK, fontFamily: '"Hahmlet Variable", Georgia, serif', fontWeight: 680, letterSpacing: 0 },
    h6: { color: BRAND_INK, fontFamily: '"Hahmlet Variable", Georgia, serif', fontWeight: 680, letterSpacing: 0 },
    subtitle1: { color: BRAND_SLATE, fontFamily: '"Andada Pro Variable", Georgia, serif', fontWeight: 700, letterSpacing: 0 },
    subtitle2: { color: BRAND_MUTED, fontWeight: 700, letterSpacing: 0 },
    body1: { color: BRAND_SLATE, fontFamily: '"Andada Pro Variable", Georgia, serif', lineHeight: 1.65, letterSpacing: 0 },
    body2: { color: BRAND_MUTED, lineHeight: 1.55, letterSpacing: 0 },
    button: { fontWeight: 800, textTransform: 'none', letterSpacing: 0 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ':root': {
          colorScheme: 'light',
        },
        body: {
          color: BRAND_INK,
          background: BRAND_CANVAS,
          width: '100%',
          minWidth: 0,
          overflowX: 'hidden',
          backgroundImage:
            'linear-gradient(rgba(8,119,201,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(8,119,201,0.045) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        },
        '#root': {
          minHeight: '100vh',
          width: '100%',
          minWidth: 0,
          overflowX: 'hidden',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderColor: BRAND_BORDER,
        },
        rounded: {
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 8,
          backgroundColor: alpha(BRAND_SURFACE, 0.98),
          border: `1px solid ${BRAND_BORDER}`,
          boxShadow: '0 4px 0 rgba(48,35,87,0.035), 0 12px 28px rgba(48,35,87,0.07)',
          transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            borderColor: alpha(BRAND_ORANGE, 0.34),
            boxShadow: `0 8px 0 ${alpha(BRAND_ORANGE, 0.06)}, 0 20px 36px ${alpha(BRAND_ORANGE, 0.13)}`,
          },
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: '0 !important',
          paddingRight: '0 !important',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 6,
          paddingInline: 18,
          minHeight: 42,
          fontWeight: 800,
          minWidth: 0,
          maxWidth: '100%',
          whiteSpace: 'normal',
          overflowWrap: 'anywhere',
          '&.Mui-disabled': {
            opacity: 0.72,
          },
        },
        containedPrimary: {
          background: BRAND_ORANGE,
          color: '#FFFFFF',
          '&:hover': {
            background: BRAND_ORANGE_DARK,
            boxShadow: `0 16px 32px ${alpha(BRAND_ORANGE, 0.32)}`,
          },
        },
        containedSecondary: {
          background: BRAND_GREEN,
          color: BRAND_INK,
          '&:hover': {
            background: BRAND_GREEN_DARK,
            boxShadow: `0 16px 30px ${alpha(BRAND_GREEN, 0.28)}`,
          },
        },
        outlined: {
          borderWidth: 1,
          borderColor: alpha(BRAND_INK, 0.12),
          color: BRAND_INK,
          backgroundColor: alpha(BRAND_SURFACE, 0.86),
          '&:hover': {
            borderWidth: 1,
            borderColor: alpha(BRAND_ORANGE, 0.28),
            backgroundColor: alpha(BRAND_ORANGE, 0.04),
          },
        },
        text: {
          color: BRAND_ORANGE_DARK,
          '&:hover': {
            backgroundColor: alpha(BRAND_ORANGE, 0.06),
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 800,
          letterSpacing: '0.03em',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
    },
    MuiFormControl: {
      styleOverrides: {
        root: {
          minWidth: 0,
          maxWidth: '100%',
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          minWidth: 0,
          maxWidth: '100%',
        },
        input: {
          minWidth: 0,
          maxWidth: '100%',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          minWidth: 0,
          maxWidth: '100%',
          borderRadius: 6,
          backgroundColor: alpha(BRAND_SURFACE_ALT, 0.96),
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
          '& fieldset': {
            borderColor: alpha(BRAND_INK, 0.1),
          },
          '&:hover fieldset': {
            borderColor: alpha(BRAND_ORANGE, 0.26),
          },
          '&.Mui-focused': {
            backgroundColor: BRAND_SURFACE,
            boxShadow: `0 0 0 4px ${alpha(BRAND_ORANGE, 0.08)}`,
          },
          '&.Mui-focused fieldset': {
            borderColor: BRAND_ORANGE,
          },
        },
        input: {
          paddingTop: 13,
          paddingBottom: 13,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: BRAND_MUTED,
          fontWeight: 600,
          '&.Mui-focused': {
            color: BRAND_ORANGE,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(BRAND_SURFACE, 0.92),
          color: BRAND_INK,
          border: `1px solid ${alpha(BRAND_INK, 0.06)}`,
          backdropFilter: 'blur(16px)',
          boxShadow: '0 12px 32px rgba(20, 20, 20, 0.06)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: alpha(BRAND_INK, 0.08),
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#F8FAFC',
          borderBottom: `1px solid ${BRAND_BORDER}`,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          minWidth: 0,
          overflowWrap: 'anywhere',
          wordBreak: 'break-word',
        },
        head: {
          color: BRAND_INK,
          fontWeight: 800,
          fontSize: '0.78rem',
          textTransform: 'none',
          letterSpacing: 0,
          borderBottom: `1px solid ${alpha(BRAND_INK, 0.08)}`,
        },
        body: {
          color: BRAND_SLATE,
          borderBottom: `1px solid ${alpha(BRAND_INK, 0.06)}`,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: alpha(BRAND_ORANGE, 0.07),
          },
        },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        toolbar: {
          paddingInline: 8,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: 2,
          background: BRAND_ORANGE,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          minHeight: 46,
          fontWeight: 800,
          color: BRAND_MUTED,
          '&.Mui-selected': {
            color: BRAND_ORANGE_DARK,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 8,
          border: `1px solid ${alpha(BRAND_INK, 0.08)}`,
          boxShadow: '0 28px 70px rgba(20, 20, 20, 0.14)',
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          borderRadius: 8,
          border: `1px solid ${alpha(BRAND_INK, 0.08)}`,
          boxShadow: '0 24px 50px rgba(20, 20, 20, 0.12)',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          minWidth: 0,
          overflowX: 'hidden',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          marginTop: 6,
          border: `1px solid ${BRAND_BORDER}`,
          borderRadius: 8,
          boxShadow: '0 18px 40px rgba(48,35,87,0.14)',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          margin: '3px 6px',
          borderRadius: 6,
          fontWeight: 650,
          '&:hover': { backgroundColor: alpha(BRAND_ORANGE, 0.08) },
          '&.Mui-selected': { backgroundColor: alpha(BRAND_ORANGE, 0.13), color: BRAND_ORANGE_DARK },
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          border: `1px solid ${BRAND_BORDER}`,
          borderRadius: '8px !important',
          boxShadow: '0 5px 16px rgba(48,35,87,0.06)',
          '&::before': { display: 'none' },
        },
      },
    },
  },
})

export default theme
