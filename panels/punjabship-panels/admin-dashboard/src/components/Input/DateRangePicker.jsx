import { Box, Button, Portal, useColorModeValue, useOutsideClick } from '@chakra-ui/react'
import { forwardRef, useEffect, useRef, useState } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'

const DateRangePicker = forwardRef(
  ({ startDate, endDate, onChange, minDate, maxDate, placeholder = 'Select date range' }, ref) => {
    const [showCalendar, setShowCalendar] = useState(false)
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })
    const [range, setRange] = useState({
      from: startDate ? new Date(startDate) : undefined,
      to: endDate ? new Date(endDate) : undefined,
    })

    const buttonRef = useRef(null)
    const calendarRef = useRef(null)

    useOutsideClick({
      ref: calendarRef,
      handler: () => setShowCalendar(false),
    })

    useEffect(() => {
      if (showCalendar && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect()
        setPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width,
        })
      }
    }, [showCalendar])

    useEffect(() => {
      setRange({
        from: startDate ? new Date(startDate) : undefined,
        to: endDate ? new Date(endDate) : undefined,
      })
    }, [startDate, endDate])

    const bgColor = useColorModeValue('white', 'gray.700')
    const borderColor = useColorModeValue('gray.200', 'gray.600')

    const handleRangeSelect = (selectedRange) => {
      if (!selectedRange) {
        setRange({ from: undefined, to: undefined })
        return
      }

      setRange(selectedRange)

      // If both dates are selected, call onChange and close
      if (selectedRange?.from && selectedRange?.to) {
        const fromStr = selectedRange.from.toISOString().split('T')[0]
        const toStr = selectedRange.to.toISOString().split('T')[0]
        onChange({ startDate: fromStr, endDate: toStr })
        setShowCalendar(false)
      }
    }

    const formatDateRange = () => {
      if (range.from && range.to) {
        return `${range.from.toLocaleDateString()} → ${range.to.toLocaleDateString()}`
      }
      if (range.from) {
        return `${range.from.toLocaleDateString()} → ...`
      }
      return placeholder
    }

    const disabled = {}
    if (minDate) {
      disabled.before = new Date(minDate)
    }
    if (maxDate) {
      disabled.after = new Date(maxDate)
    }

    return (
      <Box ref={ref} width="100%">
        <Button
          ref={buttonRef}
          onClick={() => setShowCalendar(!showCalendar)}
          variant="outline"
          w="full"
          justifyContent="flex-start"
          borderColor={borderColor}
          bg={bgColor}
        >
          {formatDateRange()}
        </Button>

        {showCalendar && (
          <Portal>
            <Box
              ref={calendarRef}
              position="absolute"
              zIndex="popover"
              bg={bgColor}
              border="1px solid"
              borderColor={borderColor}
              boxShadow="lg"
              rounded="md"
              p={2}
              style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                width: `370px`,
              }}
            >
              <DayPicker
                mode="range"
                selected={range}
                onSelect={handleRangeSelect}
                disabled={disabled}
                numberOfMonths={1}
              />
            </Box>
          </Portal>
        )}
      </Box>
    )
  },
)

DateRangePicker.displayName = 'DateRangePicker'
export default DateRangePicker

