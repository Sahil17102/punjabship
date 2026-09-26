// TablesTableRow.jsx
import { Td, Tr, useColorModeValue } from '@chakra-ui/react'
import CopyableAwb from 'components/Orders/CopyableAwb'

const TablesTableRow = ({
  row,
  columnKeys,
  renderers = {},
  renderActions,
  columnWidths = {},
  isScrolled, // pass from parent
  checkboxComponent,
  actionsStickyLeft = false,
  hasCheckbox = false,
  actionsColumnWidth = '180px',
  rowIndex = 0,
  wrapCells = false,
}) => {
  const bg = useColorModeValue('white', 'gray.800')
  const rowHover = useColorModeValue('gray.50', 'whiteAlpha.100')

  return (
    <Tr bg={bg} _hover={{ bg: rowHover }} transition="background-color 140ms ease">
      {checkboxComponent}
      {columnKeys.map((key, idx) => {
        const value = row[key]
        const isAwbColumn = String(key).toLowerCase().includes('awb')
        const content = renderers[key]
          ? renderers[key](value, row)
          : isAwbColumn
            ? <CopyableAwb awb={value} />
            : value

        return (
          <Td
            key={idx}
            ps={4}
            minW={columnWidths[key] || 'auto'}
            maxW={columnWidths[key] || 'auto'}
            w={columnWidths[key] || 'auto'}
            overflow={wrapCells ? 'visible' : 'hidden'}
            py={2.5}
            bg="inherit"
            whiteSpace={wrapCells ? 'normal' : 'nowrap'}
            textOverflow={wrapCells ? 'clip' : 'ellipsis'}
            overflowWrap={wrapCells ? 'anywhere' : 'normal'}
            sx={{ '& *': { maxWidth: '100%', whiteSpace: wrapCells ? 'normal' : undefined, overflowWrap: wrapCells ? 'anywhere' : undefined } }}
          >
            {content ?? '—'}
          </Td>
        )
      })}

      {renderActions && (
        <Td
          px={5}
          minW={actionsColumnWidth}
          w={actionsColumnWidth}
          bg="inherit"
          position="sticky"
          {...(actionsStickyLeft ? { left: hasCheckbox ? 56 : 0 } : { right: 0 })}
          zIndex={3}
          overflow="visible"
          whiteSpace="nowrap"
        >
          {renderActions(row)}
        </Td>
      )}
    </Tr>
  )
}

export default TablesTableRow
