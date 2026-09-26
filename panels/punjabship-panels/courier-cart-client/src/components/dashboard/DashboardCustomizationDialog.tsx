import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  Slider,
  Typography,
  alpha,
  useTheme,
} from '@mui/material'
import { useState, useEffect } from 'react'
import { MdClose, MdDragIndicator, MdSettings, MdSave } from 'react-icons/md'
import { useDashboardPreferences, useSaveDashboardPreferences } from '../../hooks/useDashboardPreferences'
import type { DashboardPreferences } from '../../api/dashboardPreferences.api'
import { toast } from '../UI/Toast'

interface DashboardCustomizationDialogProps {
  open: boolean
  onClose: () => void
}

const widgetLabels: Record<string, string> = {
  quickStats: 'Quick Stats Cards',
  quickActions: 'Quick Actions',
  insights: 'Smart Insights',
  actionItems: 'Action Items',
  recommendations: 'Recommendations',
  performanceMetrics: 'Performance Metrics',
  ordersTrend: 'Orders Trend Chart',
  financialHealth: 'Financial Health',
  recentActivity: 'Recent Activity',
  todaysOperations: "Today's Operations",
  orderStatusChart: 'Order Status Chart',
  courierComparison: 'Courier Comparison',
  metricsOverview: 'Metrics Overview',
  courierPerformance: 'Courier Performance',
  topDestinations: 'Top Destinations',
}

const defaultPreferences: DashboardPreferences = {
  widgetVisibility: {
    quickStats: true,
    quickActions: true,
    insights: true,
    actionItems: true,
    recommendations: true,
    performanceMetrics: true,
    ordersTrend: true,
    financialHealth: true,
    recentActivity: true,
    todaysOperations: true,
    orderStatusChart: true,
    courierComparison: true,
    metricsOverview: true,
    courierPerformance: true,
    topDestinations: true,
  },
  widgetOrder: [
    'quickStats',
    'quickActions',
    'insights',
    'actionItems',
    'recommendations',
    'performanceMetrics',
    'ordersTrend',
    'financialHealth',
    'recentActivity',
    'todaysOperations',
    'orderStatusChart',
    'courierComparison',
    'metricsOverview',
    'courierPerformance',
    'topDestinations',
  ],
  layout: {
    columns: 12,
    spacing: 3,
    cardStyle: 'default',
    showGridLines: false,
  },
  dateRange: {
    defaultRange: '7days',
  },
}

export default function DashboardCustomizationDialog({ open, onClose }: DashboardCustomizationDialogProps) {
  const theme = useTheme()
  const { data: preferences, isLoading } = useDashboardPreferences()
  const { mutate: savePreferences, isPending } = useSaveDashboardPreferences()

  const [localPreferences, setLocalPreferences] = useState<DashboardPreferences>(defaultPreferences)

  useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences)
    } else if (!isLoading && open) {
      // If no preferences exist yet, use defaults
      setLocalPreferences(defaultPreferences)
    }
  }, [preferences, isLoading, open])

  const handleVisibilityChange = (widgetId: string) => {
    setLocalPreferences({
      ...localPreferences,
      widgetVisibility: {
        ...localPreferences.widgetVisibility,
        [widgetId]: !localPreferences.widgetVisibility[widgetId],
      },
    })
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const newOrder = [...localPreferences.widgetOrder]
    ;[newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]]
    setLocalPreferences({ ...localPreferences, widgetOrder: newOrder })
  }

  const handleMoveDown = (index: number) => {
    if (index === localPreferences.widgetOrder.length - 1) return
    const newOrder = [...localPreferences.widgetOrder]
    ;[newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]]
    setLocalPreferences({ ...localPreferences, widgetOrder: newOrder })
  }

  const handleSave = () => {
    savePreferences(localPreferences, {
      onSuccess: () => {
        toast.open({
          message: 'Dashboard preferences saved successfully! 🎉',
          severity: 'success',
          duration: 3000,
        })
        onClose()
      },
      onError: (error: unknown) => {
        const err = error as { message?: string }
        toast.open({
          message: err?.message || 'Failed to save dashboard preferences. Please try again.',
          severity: 'error',
          duration: 4000,
        })
      },
    })
  }

  const handleReset = () => {
    if (preferences) {
      setLocalPreferences(preferences)
    } else {
      setLocalPreferences(defaultPreferences)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        },
      }}
    >
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                borderRadius: '10px',
                p: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MdSettings size={24} color={theme.palette.primary.main} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                Customize Dashboard
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Configure your dashboard layout
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={onClose} size="small">
            <MdClose size={20} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        {isLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={3}>
            {/* Widget Visibility */}
            <Box>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Widget Visibility
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Toggle widgets on/off to customize your dashboard
            </Typography>
            <Stack spacing={1.5}>
              {localPreferences.widgetOrder
                .filter((widgetId) => widgetId !== 'revenueChart' && widgetId !== 'revenueByTypeChart')
                .map((widgetId) => (
                <Box
                  key={widgetId}
                  sx={{
                    p: 2,
                    borderRadius: '12px',
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    bgcolor: alpha(theme.palette.background.paper, 0.5),
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                    },
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1 }}>
                      <MdDragIndicator size={20} color={theme.palette.text.secondary} style={{ cursor: 'grab' }} />
                      <Typography variant="body2" fontWeight="medium">
                        {widgetLabels[widgetId] || widgetId}
                      </Typography>
                    </Stack>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={localPreferences.widgetVisibility[widgetId] || false}
                          onChange={() => handleVisibilityChange(widgetId)}
                          size="small"
                        />
                      }
                      label=""
                    />
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Box>

          {/* Widget Order */}
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Widget Order
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Reorder widgets to prioritize what matters most
            </Typography>
            <Stack spacing={1.5}>
              {localPreferences.widgetOrder
                .filter((widgetId) => widgetId !== 'revenueChart' && widgetId !== 'revenueByTypeChart')
                .map((widgetId, index) => (
                <Box
                  key={widgetId}
                  sx={{
                    p: 2,
                    borderRadius: '12px',
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    bgcolor: alpha(theme.palette.background.paper, 0.5),
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                    },
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1 }}>
                      <Box
                        sx={{
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          borderRadius: '6px',
                          px: 1,
                          py: 0.5,
                          minWidth: 32,
                          textAlign: 'center',
                        }}
                      >
                        <Typography variant="caption" fontWeight="bold" color="primary.main">
                          {index + 1}
                        </Typography>
                      </Box>
                      <Typography variant="body2" fontWeight="medium">
                        {widgetLabels[widgetId] || widgetId}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        sx={{ minWidth: 80 }}
                      >
                        ↑ Up
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === localPreferences.widgetOrder.length - 1}
                        sx={{ minWidth: 80 }}
                      >
                        ↓ Down
                      </Button>
                    </Stack>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Box>

          {/* Layout Settings */}
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Layout Settings
            </Typography>
            <Stack spacing={3} mt={1}>
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2" fontWeight="medium" color="text.primary">
                    Grid Spacing
                  </Typography>
                  <Box
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      borderRadius: '8px',
                      px: 1.5,
                      py: 0.5,
                      minWidth: 50,
                      textAlign: 'center',
                    }}
                  >
                    <Typography variant="body2" fontWeight="bold" color="primary.main">
                      {localPreferences.layout.spacing || 3}
                    </Typography>
                  </Box>
                </Stack>
                <Slider
                  value={localPreferences.layout.spacing || 3}
                  onChange={(_, value) =>
                    setLocalPreferences({
                      ...localPreferences,
                      layout: {
                        ...localPreferences.layout,
                        spacing: value as number,
                      },
                    })
                  }
                  min={1}
                  max={8}
                  step={1}
                  marks={[
                    { value: 1, label: '1' },
                    { value: 3, label: '3' },
                    { value: 5, label: '5' },
                    { value: 8, label: '8' },
                  ]}
                  sx={{
                    mt: 2,
                    '& .MuiSlider-thumb': {
                      width: 20,
                      height: 20,
                      boxShadow: `0 0 0 8px ${alpha(theme.palette.primary.main, 0.16)}`,
                      '&:hover': {
                        boxShadow: `0 0 0 10px ${alpha(theme.palette.primary.main, 0.16)}`,
                      },
                    },
                    '& .MuiSlider-track': {
                      height: 6,
                      borderRadius: 3,
                    },
                    '& .MuiSlider-rail': {
                      height: 6,
                      borderRadius: 3,
                      opacity: 0.3,
                    },
                    '& .MuiSlider-mark': {
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                    },
                    '& .MuiSlider-markLabel': {
                      fontSize: '0.75rem',
                      color: theme.palette.text.secondary,
                    },
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  Adjust spacing between dashboard widgets
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={localPreferences.layout.showGridLines || false}
                    onChange={(e) =>
                      setLocalPreferences({
                        ...localPreferences,
                        layout: {
                          ...localPreferences.layout,
                          showGridLines: e.target.checked,
                        },
                      })
                    }
                  />
                }
                label="Show Grid Lines"
              />
            </Stack>
          </Box>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, px: 3 }}>
        <Button onClick={handleReset} variant="outlined" disabled={isPending}>
          Reset
        </Button>
        <Button onClick={onClose} variant="outlined" disabled={isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={<MdSave size={18} />}
          disabled={isPending}
          sx={{
            bgcolor: theme.palette.primary.main,
            '&:hover': {
              bgcolor: theme.palette.primary.dark,
            },
          }}
        >
          {isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

