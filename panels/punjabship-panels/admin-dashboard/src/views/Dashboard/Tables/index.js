// Chakra imports
import { Flex } from '@chakra-ui/react'
import { dashboardTableData, tablesTableData } from 'variables/general'
import Authors from './components/GenericTable'
import Projects from './components/Projects'

function Tables() {
  return (
    <Flex direction="column" pt={{ base: '120px', md: '75px' }}>
      <Authors
        title={'Authors Table'}
        captions={['Author', 'Function', 'Status', 'Employed', '']}
        data={tablesTableData}
      />
      <Projects
        title={'Projects Table'}
        captions={['Companies', 'Budget', 'Status', 'Completion', '']}
        data={dashboardTableData}
      />
    </Flex>
  )
}

export default Tables
