/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  alpha,
  Badge,
  Box,
  Button,
  CardContent,
  Collapse,
  Grid,
  IconButton,
  Popover,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import {
  Controller,
  useForm,
  type DefaultValues,
  type Path,
  type RegisterOptions,
} from 'react-hook-form'
import { FaFilter } from 'react-icons/fa6'
import { MdDelete, MdExpandMore } from 'react-icons/md'
import { RxDoubleArrowDown, RxDoubleArrowUp } from 'react-icons/rx'
import CustomDrawer from './UI/drawer/CustomDrawer'
import CustomDatePicker from './UI/inputs/CustomDatePicker'
import CustomInput from './UI/inputs/CustomInput'
import CustomSelect from './UI/inputs/CustomSelect'
import MultiSelect from './UI/inputs/MultiSelect'

type FieldType = 'text' | 'select' | 'date' | 'multiselect'

export interface FilterField {
  name: string
  label: string
  type?: FieldType
  required?: boolean
  isAdvanced?: boolean
  options?: { label: string; value: string | boolean }[]
  placeholder?: string
  rules?: RegisterOptions
}

interface GlassFilterBarProps<T extends Record<string, any>> {
  fields: FilterField[]
  onApply: (filters: T) => void
  defaultValues: T
  sticky?: boolean
  bgOverlayImg?: string
  loading?: boolean
  appliedCount?: number
  mode?: 'inline' | 'button'
  buttonLabel?: string
  buttonIcon?: React.ReactNode
}

const BRAND_ORANGE = '#0877C9'
const BRAND_WINE = '#B8D719'
const BRAND_INK = '#17171A'
const BRAND_MUTED = '#6E6763'

export const FilterBar = <T extends Record<string, any>>({
  fields,
  onApply,
  defaultValues,
  bgOverlayImg,
  loading,
  appliedCount,
  mode = 'inline',
  buttonLabel = 'Filters',
  buttonIcon = <FaFilter />,
}: GlassFilterBarProps<T>) => {
  const { control, handleSubmit, reset } = useForm<T>({
    defaultValues: defaultValues as DefaultValues<T>,
  })
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [expandedAccordions, setExpandedAccordions] = useState<string[]>(['primary', 'advanced'])
  const filterButtonRef = useRef<HTMLButtonElement>(null)

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const primaryFields = fields.filter((f) => !f.isAdvanced)
  const advancedFields = fields.filter((f) => f.isAdvanced)

  useEffect(() => {
    reset(defaultValues as DefaultValues<T>)
  }, [defaultValues, reset])

  const renderFieldControl = (field: FilterField, controllerField: any) => {
    if (field.type === 'select') {
      return (
        <CustomSelect
          label={field.label}
          value={controllerField.value ?? ''}
          onSelect={(val) => controllerField.onChange(val)}
          items={field.options?.map((opt) => ({ key: opt.value, label: opt.label })) || []}
          placeholder={field.placeholder}
          helperText={field.required ? 'Required' : ''}
          width="100%"
          required={field.required}
        />
      )
    }

    if (field.type === 'date') {
      return (
        <CustomDatePicker
          label={field.label}
          value={controllerField.value || null}
          onChange={controllerField.onChange}
          placeholder={field.placeholder}
          required={field.required}
        />
      )
    }

    if (field.type === 'multiselect') {
      return (
        <MultiSelect
          label={field.label}
          value={controllerField.value || []}
          onChange={(val) => controllerField.onChange(val)}
          options={field.options || []}
          placeholder={field.placeholder}
        />
      )
    }

    return (
      <CustomInput
        label={field.label}
        fullWidth
        placeholder={field.placeholder}
        {...controllerField}
      />
    )
  }

  const renderSkeletonContent = () => (
    <Box>
      <Grid container spacing={2}>
        {fields?.slice(0, 3).map((_, idx) => (
          <Grid key={idx} size={{ md: 4, xs: 12 }}>
            <Skeleton variant="text" height={20} sx={{ mb: 1 }} />
            <Skeleton variant="rectangular" height={42} sx={{ borderRadius: 2 }} />
          </Grid>
        ))}
      </Grid>
    </Box>
  )

  const submit = (data: T) => {
    onApply(data)
    if (isMobile) setDrawerOpen(false)
    if (mode === 'button' && !isMobile) setPopoverOpen(false)
  }

  const handleAccordionChange = (panel: string) => {
    setExpandedAccordions((prev) =>
      prev.includes(panel) ? prev.filter((p) => p !== panel) : [...prev, panel],
    )
  }

  const desktopActionButtonSx = {
    border: `1px solid ${alpha(BRAND_ORANGE, 0.16)}`,
    p: 1,
    borderRadius: 2,
    background: '#FFFFFF',
    color: BRAND_ORANGE,
    '&:hover': {
      background: alpha(BRAND_ORANGE, 0.04),
      borderColor: alpha(BRAND_ORANGE, 0.34),
    },
  }

  const renderFormContent = () => (
    <form onSubmit={handleSubmit(submit)}>
      <Stack gap={2}>
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          alignItems={{ xs: 'stretch', lg: 'center' }}
          justifyContent="space-between"
          gap={2}
        >
          <Grid container spacing={2} sx={{ flex: 1 }}>
            {primaryFields.map((field) => (
              <Grid size={{ md: 4, xs: 12 }} key={field.name}>
                <Controller
                  name={field.name as Path<T>}
                  control={control}
                  render={({ field: controllerField }) => renderFieldControl(field, controllerField)}
                />
              </Grid>
            ))}
          </Grid>

          {!isMobile ? (
            <Stack mt={{ lg: 2.5 }} gap={1} direction="row" alignItems="center">
              {advancedFields.length ? (
                <Tooltip title={showAdvanced ? 'Hide advanced filters' : 'Show advanced filters'}>
                  <IconButton
                    sx={desktopActionButtonSx}
                    size="small"
                    onClick={() => setShowAdvanced((prev) => !prev)}
                  >
                    {showAdvanced ? <RxDoubleArrowUp /> : <RxDoubleArrowDown />}
                  </IconButton>
                </Tooltip>
              ) : null}

              <Button
                type="submit"
                variant="contained"
                sx={{
                  textTransform: 'none',
                  fontWeight: 800,
                  borderRadius: 2,
                  minWidth: 92,
                  background: `linear-gradient(135deg, ${BRAND_ORANGE} 0%, #970915 100%)`,
                }}
              >
                Apply
              </Button>

              <Tooltip title="Clear all filters">
                <IconButton
                  sx={desktopActionButtonSx}
                  size="small"
                  onClick={() => {
                    reset(defaultValues)
                    onApply({} as T)
                  }}
                >
                  <MdDelete />
                </IconButton>
              </Tooltip>
            </Stack>
          ) : null}
        </Stack>

        {advancedFields.length > 0 && (
          <Collapse in={showAdvanced} timeout="auto" unmountOnExit>
            <Box
              sx={{
                p: { xs: 0.5, md: 1.5 },
                borderRadius: 3,
                border: `1px solid ${alpha(BRAND_ORANGE, 0.08)}`,
                backgroundColor: '#FAF7F5',
              }}
            >
              <Grid container spacing={2}>
                {advancedFields.map((field) => (
                  <Grid size={{ md: 3, xs: 12 }} key={field.name}>
                    <Controller
                      name={field.name as Path<T>}
                      control={control}
                      render={({ field: controllerField }) => renderFieldControl(field, controllerField)}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Collapse>
        )}
      </Stack>
    </form>
  )

  const renderAccordionContent = () => (
    <form onSubmit={handleSubmit(submit)}>
      <Stack gap={0}>
        {/* Primary Filters Accordion */}
        <Accordion
          expanded={expandedAccordions.includes('primary')}
          onChange={() => handleAccordionChange('primary')}
          sx={{
            boxShadow: 'none',
            borderBottom: `1px solid ${alpha(BRAND_INK, 0.08)}`,
            '&:first-of-type': { borderRadius: '12px 12px 0 0' },
            '&.Mui-expanded': {
              margin: 0,
            },
          }}
        >
          <AccordionSummary
            expandIcon={<MdExpandMore />}
            sx={{
              backgroundColor: alpha(BRAND_ORANGE, 0.02),
              '&:hover': { backgroundColor: alpha(BRAND_ORANGE, 0.05) },
              py: 1.5,
              px: 2,
            }}
          >
            <Typography sx={{ fontWeight: 700, color: BRAND_INK, fontSize: '0.95rem' }}>
              Primary Filters
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 2 }}>
            <Grid container spacing={2}>
              {primaryFields.map((field) => (
                <Grid size={{ md: 6, xs: 12 }} key={field.name}>
                  <Controller
                    name={field.name as Path<T>}
                    control={control}
                    render={({ field: controllerField }) => renderFieldControl(field, controllerField)}
                  />
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Advanced Filters Accordion */}
        {advancedFields.length > 0 && (
          <Accordion
            expanded={expandedAccordions.includes('advanced')}
            onChange={() => handleAccordionChange('advanced')}
            sx={{
              boxShadow: 'none',
              '&:last-of-type': { borderRadius: '0 0 12px 12px' },
              '&.Mui-expanded': {
                margin: 0,
              },
            }}
          >
            <AccordionSummary
              expandIcon={<MdExpandMore />}
              sx={{
                backgroundColor: alpha('#111113', 0.03),
                '&:hover': { backgroundColor: alpha('#111113', 0.06) },
                py: 1.5,
                px: 2,
              }}
            >
              <Typography sx={{ fontWeight: 700, color: BRAND_INK, fontSize: '0.95rem' }}>
                Advanced Filters
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 2 }}>
              <Grid container spacing={2}>
                {advancedFields.map((field) => (
                  <Grid size={{ md: 6, xs: 12 }} key={field.name}>
                    <Controller
                      name={field.name as Path<T>}
                      control={control}
                      render={({ field: controllerField }) => renderFieldControl(field, controllerField)}
                    />
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Action Buttons */}
        <Box
          sx={{
            p: 2,
            borderTop: `1px solid ${alpha(BRAND_INK, 0.08)}`,
            backgroundColor: alpha(BRAND_INK, 0.02),
            borderRadius: '0 0 12px 12px',
            display: 'flex',
            gap: 1,
          }}
        >
          <Button
            type="submit"
            variant="contained"
            sx={{
              flex: 1,
              textTransform: 'none',
              fontWeight: 700,
              background: `linear-gradient(135deg, ${BRAND_ORANGE} 0%, #970915 100%)`,
            }}
          >
            Apply
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              reset(defaultValues)
              onApply({} as T)
            }}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderColor: alpha(BRAND_INK, 0.2),
              color: BRAND_INK,
            }}
          >
            Clear
          </Button>
        </Box>
      </Stack>
    </form>
  )

  if (mode === 'button') {
    return (
      <>
        {isMobile ? (
          <IconButton
            ref={filterButtonRef}
            onClick={() => setDrawerOpen(true)}
            sx={{
              border: `1px solid ${alpha(BRAND_ORANGE, 0.3)}`,
              backgroundColor: '#FFFFFF',
              color: BRAND_ORANGE,
              transition: 'all 200ms ease',
              '&:hover': {
                backgroundColor: alpha(BRAND_ORANGE, 0.06),
                borderColor: BRAND_ORANGE,
              },
            }}
          >
            {typeof appliedCount === 'number' && appliedCount > 0 ? (
              <Badge badgeContent={appliedCount} color="error">
                {buttonIcon}
              </Badge>
            ) : (
              buttonIcon
            )}
          </IconButton>
        ) : (
          <>
            <Button
              ref={filterButtonRef}
              onClick={() => setPopoverOpen(!popoverOpen)}
              variant="outlined"
              startIcon={buttonIcon}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 2,
                borderColor: alpha(BRAND_ORANGE, 0.3),
                color: BRAND_INK,
                backgroundColor: '#FFFFFF',
                transition: 'all 200ms ease',
                '&:hover': {
                  borderColor: BRAND_ORANGE,
                  backgroundColor: alpha(BRAND_ORANGE, 0.04),
                  color: BRAND_ORANGE,
                },
              }}
            >
              {typeof appliedCount === 'number' && appliedCount > 0 ? (
                <Badge
                  badgeContent={appliedCount}
                  color="error"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.65rem',
                      padding: '0 4px',
                    },
                  }}
                >
                  <Box>{buttonLabel}</Box>
                </Badge>
              ) : (
                buttonLabel
              )}
            </Button>

            <Popover
              open={popoverOpen}
              anchorEl={filterButtonRef.current}
              onClose={() => setPopoverOpen(false)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              disableAutoFocus
              disableEnforceFocus
              disableRestoreFocus
              slotProps={{
                paper: {
                  sx: {
                    mt: 1,
                    backgroundColor: alpha('#FFFFFF', 0.98),
                    backdropFilter: 'blur(12px)',
                    border: `1px solid ${alpha(BRAND_INK, 0.08)}`,
                    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.12)',
                    borderRadius: 3,
                    minWidth: 360,
                  },
                },
              }}
            >
              <Box sx={{ p: 0 }}>
                {loading ? (
                  <Box sx={{ p: 2 }}>
                    <Stack gap={1}>
                      <Skeleton height={40} />
                      <Skeleton height={40} />
                    </Stack>
                  </Box>
                ) : (
                  renderAccordionContent()
                )}
              </Box>
            </Popover>
          </>
        )}

        <CustomDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          width={420}
          title="Filter records"
        >
          <Stack spacing={2}>
            <Typography sx={{ fontSize: '0.9rem', color: BRAND_MUTED }}>
              Apply quick or advanced filters for this workspace.
            </Typography>
            {loading ? renderSkeletonContent() : renderAccordionContent()}
          </Stack>
        </CustomDrawer>
      </>
    )
  }

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        {isMobile ? (
          <IconButton
            sx={{
              border: `1px solid ${alpha(BRAND_ORANGE, 0.2)}`,
              p: 1,
              borderRadius: 2,
              background: '#FFFFFF',
              color: BRAND_ORANGE,
            }}
            onClick={() => setDrawerOpen(true)}
          >
            <FaFilter />
          </IconButton>
        ) : (
          <CardContent
            sx={{
              width: '100%',
              p: { xs: 1.4, md: 2.2 },
              borderRadius: 3,
              border: `1px solid ${alpha(BRAND_INK, 0.08)}`,
              background: 'linear-gradient(180deg, #ffffff 0%, #faf7f5 100%)',
              boxShadow: '0 18px 34px rgba(20, 20, 20, 0.06)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 4,
                background: `linear-gradient(180deg, ${BRAND_ORANGE} 0%, ${alpha(BRAND_WINE, 0.4)} 100%)`,
              },
            }}
          >
            {bgOverlayImg ? (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `url(${bgOverlayImg})`,
                  backgroundSize: 'cover',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                  opacity: 0.05,
                }}
              />
            ) : null}

            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                spacing={1}
                mb={2}
              >
                <Box>
                  <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: BRAND_INK }}>
                    Filter records
                  </Typography>
                  <Typography sx={{ fontSize: '0.84rem', color: BRAND_MUTED, mt: 0.35 }}>
                    Narrow down operational records with quick and advanced filters.
                  </Typography>
                </Box>
                {typeof appliedCount === 'number' ? (
                  <Box
                    sx={{
                      px: 1.1,
                      py: 0.5,
                      borderRadius: 1.5,
                      bgcolor: alpha(BRAND_ORANGE, 0.08),
                      color: BRAND_ORANGE,
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {appliedCount} active
                  </Box>
                ) : null}
              </Stack>
              {loading ? renderSkeletonContent() : renderFormContent()}
            </Box>
          </CardContent>
        )}

        {isMobile && typeof appliedCount === 'number' ? (
          <Typography sx={{ fontSize: '0.82rem', color: BRAND_MUTED, fontWeight: 700 }}>
            {appliedCount} filters applied
          </Typography>
        ) : null}
      </Stack>

      <CustomDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={420}
        title="Filter records"
      >
        <Stack spacing={2}>
          <Typography sx={{ fontSize: '0.9rem', color: BRAND_MUTED }}>
            Apply quick or advanced filters for this workspace.
          </Typography>
          {loading ? renderSkeletonContent() : renderFormContent()}
        </Stack>
      </CustomDrawer>
    </>
  )
}
