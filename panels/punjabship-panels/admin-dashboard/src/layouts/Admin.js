// Chakra imports
import { ChakraProvider, Portal, useDisclosure } from '@chakra-ui/react'
import Footer from 'components/Footer/Footer.js'
// Layout components
import AdminNavbar from 'components/Navbars/AdminNavbar.js'
import Configurator from 'components/Configurator/Configurator.js'
import Sidebar from 'components/Sidebar'
import { useEffect, useMemo, useState } from 'react'
import { Redirect, Route, Switch } from 'react-router-dom'
import routes from 'routes.js'
import { getCrmSession } from 'services/adminCrm.service'
import { useAuthStore } from 'store/useAuthStore'
import { filterAdminRoutes, getAdminHomePath } from 'utils/adminRouteAccess'
// Custom Chakra theme
import theme from 'theme/theme.js'
// Custom components
import MainPanel from '../components/Layout/MainPanel'
import PanelContainer from '../components/Layout/PanelContainer'
import PanelContent from '../components/Layout/PanelContent'

export default function Dashboard(props) {
  const { ...rest } = props
  // states and functions
  const [sidebarHovered, setSidebarHovered] = useState(false)
  const [fixed, setFixed] = useState(true)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const adminAccess = useAuthStore((state) => state.adminAccess)
  const setAdminAccess = useAuthStore((state) => state.setAdminAccess)
  const visibleRoutes = useMemo(
    () => filterAdminRoutes(routes, adminAccess),
    [adminAccess],
  )

  useEffect(() => {
    getCrmSession().then(setAdminAccess).catch(() => undefined)
  }, [setAdminAccess])

  // 🆕 Sidebar resizing state
  const sidebarWidth = 76
  const contentSidebarWidth = sidebarHovered ? 268 : sidebarWidth

  const getRoute = () => {
    return window.location.pathname !== '/admin/full-screen-maps'
  }
  const getActiveRoute = (routes) => {
    let activeRoute = 'Default Brand Text'
    for (let i = 0; i < routes.length; i++) {
      if (routes[i].collapse) {
        let collapseActiveRoute = getActiveRoute(routes[i].views)
        if (collapseActiveRoute !== activeRoute) {
          return collapseActiveRoute
        }
      } else if (routes[i].category) {
        let categoryActiveRoute = getActiveRoute(routes[i].views)
        if (categoryActiveRoute !== activeRoute) {
          return categoryActiveRoute
        }
      } else {
        const routePath = routes[i].layout + routes[i].path
        const currentPath = window.location.pathname
        const isActive = routes[i].exact
          ? currentPath === routePath
          : window.location.href.indexOf(routePath) !== -1
        if (isActive) {
          return routes[i].name
        }
      }
    }
    return activeRoute
  }
  // This changes navbar state(fixed or not)
  const getActiveNavbar = (routes) => {
    let activeNavbar = false
    for (let i = 0; i < routes.length; i++) {
      if (routes[i].category) {
        let categoryActiveNavbar = getActiveNavbar(routes[i].views)
        if (categoryActiveNavbar !== activeNavbar) {
          return categoryActiveNavbar
        }
      } else {
        const routePath = routes[i].layout + routes[i].path
        const currentPath = window.location.pathname
        const isActive = routes[i].exact
          ? currentPath === routePath
          : window.location.href.indexOf(routePath) !== -1
        if (isActive) {
          if (routes[i].secondaryNavbar) {
            return routes[i].secondaryNavbar
          }
        }
      }
    }
    return activeNavbar
  }
  const getRoutes = (routes) => {
    return routes.map((prop, key) => {
      // If it's a collapsible or category, go deeper
      if (prop.collapse || prop.category) {
        return getRoutes(prop.views)
      }

      // If it's a regular admin route, render it
      if (prop.layout === '/admin') {
        return <Route exact={prop.exact} path={prop.layout + prop.path} component={prop.component} key={key} />
      }

      return null
    })
  }

  document.documentElement.dir = 'ltr'

  return (
    <ChakraProvider theme={theme} resetCss={false}>
      {/* Sidebar with dynamic width */}
      <Sidebar
        routes={visibleRoutes}
        logoText={'PunjabShip'}
        sidebarVariant="opaque"
        sidebarWidth={sidebarWidth}
        onHoverChange={setSidebarHovered}
        {...rest}
      />

      {/* Main Panel adjusts with sidebar width */}
      <MainPanel
        w={{
          base: '100%',
          xl: `calc(100% - ${contentSidebarWidth}px)`,
        }}
        ml={{ xl: `${contentSidebarWidth}px` }}
      >
        <Portal>
          <AdminNavbar
            logoText={'PunjabShip'}
            brandText={getActiveRoute(visibleRoutes)}
            secondary={getActiveNavbar(visibleRoutes)}
            fixed={fixed}
            sidebarWidth={contentSidebarWidth}
            onOpen={onOpen}
            {...rest}
          />
        </Portal>
        {getRoute() ? (
          <PanelContent
            data-testid="admin-panel-content"
            pt={{ base: '104px', md: '64px' }}
            sx={{
              '& > div > *': {
                paddingTop: '12px !important',
              },
            }}
          >
            <PanelContainer>
              <Switch>
                {getRoutes(visibleRoutes)}
                <Redirect
                  from="/admin"
                  to={getAdminHomePath(adminAccess)}
                />
              </Switch>
            </PanelContainer>
          </PanelContent>
        ) : null}
        <Footer />
        <Configurator
          secondary={getActiveNavbar(visibleRoutes)}
          isOpen={isOpen}
          onClose={onClose}
          isChecked={fixed}
          onSwitch={setFixed}
        />
      </MainPanel>

      {/* 🖱️ Resize Handle */}
    </ChakraProvider>
  )
}
