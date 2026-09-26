import { extendTheme } from '@chakra-ui/react'
import { CardComponent } from './additions/card/Card'
import { CardBodyComponent } from './additions/card/CardBody'
import { CardHeaderComponent } from './additions/card/CardHeader'
import { MainPanelComponent } from './additions/layout/MainPanel'
import { PanelContainerComponent } from './additions/layout/PanelContainer'
import { PanelContentComponent } from './additions/layout/PanelContent'
import { badgeStyles } from './components/badge'
import { buttonStyles } from './components/button'
import { drawerStyles } from './components/drawer'
import { linkStyles } from './components/link'
import { breakpoints } from './foundations/breakpoints'
import { globalStyles } from './styles'

const dividerStyles = {
  components: {
    Heading: {
      baseStyle: {
        fontFamily: "'Andada Pro Variable', Georgia, serif",
        fontWeight: '620',
        letterSpacing: '0',
      },
      sizes: {
        xl: { fontSize: '30px', lineHeight: '1.18' },
        lg: { fontSize: '25px', lineHeight: '1.22' },
        md: { fontSize: '20px', lineHeight: '1.28' },
        sm: { fontSize: '17px', lineHeight: '1.32' },
        xs: { fontSize: '14px', lineHeight: '1.35' },
      },
    },
    Divider: {
      baseStyle: {
        borderColor: 'gray.200',
        borderWidth: '1px',
      },
      variants: {
        subtle: {
          borderColor: 'gray.200',
        },
        solid: {
          borderColor: 'gray.600',
        },
      },
      defaultProps: {
        variant: 'subtle',
      },
    },
  },
}

const componentOverrides = {
  components: {
    Input: {
      baseStyle: {
        field: {
          borderRadius: '8px',
          borderColor: 'gray.300',
          bg: 'white',
          transition: 'border-color 160ms ease, box-shadow 160ms ease',
          _hover: { borderColor: 'gray.400' },
          _focus: { borderColor: 'brand.500', boxShadow: '0 0 0 1px #0877C9' },
        },
      },
      defaultProps: {
        focusBorderColor: 'brand.500',
      },
    },
    Select: {
      baseStyle: {
        field: {
          borderRadius: '8px',
          borderColor: 'gray.300',
          bg: 'white',
          _hover: { borderColor: 'gray.400' },
          _focus: { borderColor: 'brand.500', boxShadow: '0 0 0 1px #0877C9' },
        },
      },
      defaultProps: {
        focusBorderColor: 'brand.500',
      },
    },
    Textarea: {
      baseStyle: {
        borderRadius: '8px',
        borderColor: 'gray.300',
        bg: 'white',
        _hover: { borderColor: 'gray.400' },
        _focus: { borderColor: 'brand.500', boxShadow: '0 0 0 1px #0877C9' },
      },
      defaultProps: {
        focusBorderColor: 'brand.500',
      },
    },
    Table: {
      variants: {
        simple: {
          th: {
            fontFamily: "'Epilogue Variable', 'Segoe UI', sans-serif",
            textTransform: 'none',
            letterSpacing: '0',
            fontWeight: '700',
            fontSize: '12px',
            color: 'gray.600',
            borderColor: 'gray.200',
            bg: '#F7F8FA',
          },
          td: {
            borderColor: 'gray.200',
            fontSize: '14px',
            color: 'gray.700',
            verticalAlign: 'middle',
            height: '44px',
          },
        },
      },
    },
    Modal: {
      baseStyle: {
        dialog: {
          borderRadius: '6px',
          borderWidth: '1px',
          borderColor: 'gray.200',
          boxShadow: '0 12px 28px rgba(17, 24, 39, 0.16)',
          overflow: 'hidden',
          bg: 'white',
        },
        header: {
          fontWeight: '800',
          bg: 'white',
          color: 'gray.800',
          borderBottomWidth: '1px',
          borderColor: 'gray.200',
        },
      },
    },
    Menu: {
      baseStyle: {
        list: {
          p: '2',
          borderRadius: '6px',
          borderColor: 'gray.200',
          boxShadow: '0 8px 20px rgba(30,41,59,0.14)',
        },
        item: {
          borderRadius: '4px',
          fontWeight: '600',
          _hover: { bg: 'brand.50', color: 'brand.700' },
          _focus: { bg: 'brand.50', color: 'brand.700' },
        },
      },
    },
    Tabs: {
      variants: {
        line: {
          tablist: { borderColor: 'gray.200', gap: '1' },
          tab: {
            fontWeight: '700',
            borderRadius: '0',
            _selected: { color: 'brand.700', bg: 'transparent', borderColor: 'brand.500' },
            _hover: { bg: 'gray.50' },
          },
        },
        enclosed: {
          tablist: { bg: 'gray.100', p: '1', borderRadius: '6px', border: '0' },
          tab: {
            border: '0',
            borderRadius: '4px',
            fontWeight: '700',
            _selected: { bg: 'white', color: 'brand.700', boxShadow: 'none' },
          },
        },
      },
    },
    Accordion: {
      baseStyle: {
        container: { borderColor: 'gray.200' },
        button: { fontWeight: '700', borderRadius: '4px', _hover: { bg: 'gray.50', color: 'brand.700' } },
        panel: { bg: 'gray.50', borderRadius: '0' },
      },
    },
    Popover: {
      baseStyle: {
        content: { borderRadius: '6px', borderColor: 'gray.200', boxShadow: '0 8px 20px rgba(30,41,59,0.14)' },
        header: { fontWeight: '800', bg: 'gray.50', borderRadius: '6px 6px 0 0' },
      },
    },
    Drawer: {
      baseStyle: {
        dialog: { bg: 'white', borderLeftWidth: '1px', borderColor: 'gray.200' },
        header: { bg: 'white', color: 'gray.800', fontWeight: '800', borderBottomWidth: '1px', borderColor: 'gray.200' },
      },
    },
    Badge: {
      baseStyle: {
        borderRadius: '4px',
        textTransform: 'none',
        px: '2',
        py: '0.5',
        fontWeight: '700',
      },
    },
    Tooltip: {
      baseStyle: {
        borderRadius: '4px',
      },
    },
  },
  fonts: {
    heading: "'Andada Pro Variable', Georgia, serif",
    body: "'Epilogue Variable', 'Segoe UI', sans-serif",
  },
}

export default extendTheme(
  { breakpoints },
  globalStyles,
  buttonStyles,
  badgeStyles,
  linkStyles,
  drawerStyles,
  CardComponent,
  CardBodyComponent,
  CardHeaderComponent,
  MainPanelComponent,
  PanelContentComponent,
  PanelContainerComponent,
  dividerStyles,
  componentOverrides,
)
