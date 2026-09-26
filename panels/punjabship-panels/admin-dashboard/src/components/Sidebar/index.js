import { Box } from '@chakra-ui/react'
import SidebarContent from './SidebarContent'

function Sidebar({ logoText, routes, sidebarVariant, sidebarWidth, onHoverChange }) {
  return (
    <Box display={{ base: 'none', xl: 'block' }}>
      <SidebarContent
        sidebarWidth={sidebarWidth}
        routes={routes}
        logoText={logoText || 'PunjabShip'}
        sidebarVariant={sidebarVariant}
        onHoverChange={onHoverChange}
      />
    </Box>
  )
}

export default Sidebar
