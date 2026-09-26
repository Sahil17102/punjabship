import { Button, HStack, Text, Tooltip, useColorModeValue, useToken } from '@chakra-ui/react'
import { IconDownload, IconFileTypeCsv } from '@tabler/icons-react'
import Papa from 'papaparse'

/**
 * Generic component for downloading sample CSV files
 * @param {Object} props
 * @param {Array<Object>} props.headers - Array of objects representing CSV headers with example values
 * @param {string} props.filename - Name of the CSV file to download (default: 'sample.csv')
 * @param {string} props.buttonText - Text to display on button (default: 'Download Sample CSV')
 * @param {string} props.size - Button size (default: 'sm')
 * @param {string} props.colorScheme - Button color scheme (default: 'teal')
 * @param {string} props.tooltip - Tooltip text to show on hover
 * @param {Object} props.buttonProps - Additional props to pass to Button component
 */
const DownloadSampleCSVButton = ({
  headers = [],
  filename = 'sample.csv',
  buttonText = 'Download Sample CSV',
  size = 'sm',
  colorScheme = 'teal',
  tooltip,
  buttonProps = {},
}) => {
  const bgColor = useColorModeValue(`${colorScheme}.50`, `${colorScheme}.900`)
  const hoverBg = useColorModeValue(`${colorScheme}.100`, `${colorScheme}.800`)
  const iconColorToken = useColorModeValue(`${colorScheme}.600`, `${colorScheme}.300`)
  const iconColor = useToken('colors', iconColorToken)
  const borderColor = useColorModeValue(`${colorScheme}.300`, `${colorScheme}.600`)
  const textColor = useColorModeValue(`${colorScheme}.700`, `${colorScheme}.200`)

  const handleDownload = () => {
    if (!headers || headers.length === 0) {
      console.warn('No headers provided for CSV download')
      return
    }

    // Create CSV with headers and example row
    const csv = Papa.unparse(headers, { header: true })
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const button = (
    <Button
      size={size}
      onClick={handleDownload}
      bg={bgColor}
      borderWidth="1.5px"
      borderColor={borderColor}
      color={textColor}
      fontWeight="semibold"
      borderRadius="md"
      _hover={{
        bg: hoverBg,
        transform: 'translateY(-2px)',
        boxShadow: 'lg',
        borderColor: `${colorScheme}.400`,
      }}
      _active={{
        transform: 'translateY(0px)',
      }}
      transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
      {...buttonProps}
    >
      <HStack spacing={2}>
        <IconFileTypeCsv size={20} strokeWidth={2} color={iconColor} />
        <IconDownload size={14} strokeWidth={2.5} color={iconColor} />
        <Text fontSize={size === 'sm' ? 'sm' : 'md'} color={textColor}>
          {buttonText}
        </Text>
      </HStack>
    </Button>
  )

  if (tooltip) {
    return (
      <Tooltip label={tooltip} placement="top" hasArrow bg={`${colorScheme}.600`}>
        {button}
      </Tooltip>
    )
  }

  return button
}

export default DownloadSampleCSVButton
