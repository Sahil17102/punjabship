import {
  Box,
  Button,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Portal,
  useColorModeValue,
} from '@chakra-ui/react'
import { forwardRef, useState } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'

const CustomDatePicker = forwardRef(({ selectedDate, onChange, minDate, maxDate }, ref) => {
  const [showCalendar, setShowCalendar] = useState(false)

  const bgColor = useColorModeValue('white', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  return (
    <Box ref={ref}>
      <Popover
        isOpen={showCalendar}
        onOpen={() => setShowCalendar(true)}
        onClose={() => setShowCalendar(false)}
        placement="bottom-start"
        strategy="fixed"
        closeOnBlur
      >
        <PopoverTrigger>
          <Button
            type="button"
            variant="outline"
            w="full"
            justifyContent="flex-start"
            borderColor={borderColor}
            bg={bgColor}
            _hover={{ borderColor: 'brand.400' }}
            _focus={{
              borderColor: 'brand.500',
              boxShadow: '0 0 0 1px #0877C9',
            }}
          >
            {selectedDate ? selectedDate.toLocaleDateString('en-IN') : 'Select date'}
          </Button>
        </PopoverTrigger>
        <Portal>
          <PopoverContent
            zIndex={1600}
            w="auto"
            maxW="calc(100vw - 24px)"
            bg={bgColor}
            borderColor={borderColor}
            boxShadow="lg"
            borderRadius="8px"
            _focus={{ outline: 'none' }}
          >
            <PopoverBody p={2} overflowX="auto">
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  onChange(date)
                  setShowCalendar(false)
                }}
                disabled={{
                  ...(minDate && { before: new Date(minDate) }),
                  ...(maxDate && { after: new Date(maxDate) }),
                }}
              />
            </PopoverBody>
          </PopoverContent>
        </Portal>
      </Popover>
    </Box>
  )
})

CustomDatePicker.displayName = 'CustomDatePicker'
export default CustomDatePicker
