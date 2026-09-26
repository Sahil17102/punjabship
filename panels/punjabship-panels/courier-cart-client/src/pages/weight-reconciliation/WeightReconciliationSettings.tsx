import {
  Alert,
  alpha,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { FiArrowLeft, FiSave } from 'react-icons/fi'
import { RiSettings2Fill } from 'react-icons/ri'
import { useNavigate } from 'react-router-dom'
import {
  useUpdateWeightReconciliationSettings,
  useWeightReconciliationSettings,
} from '../../hooks/useWeightReconciliation'

export default function WeightReconciliationSettings() {
  const BRAND_PURPLE = '#0877C9'
  const BRAND_ORANGE = '#B8D719'
  const sectionCardSx = {
    backgroundColor: '#FFFFFF',
    borderRadius: '24px',
    border: `1px solid ${alpha(BRAND_PURPLE, 0.12)}`,
    boxShadow: '0 16px 34px rgba(20, 20, 20, 0.07)',
    p: 3,
  }

  const navigate = useNavigate()
  const { data: settings, isLoading } = useWeightReconciliationSettings()
  const updateSettings = useUpdateWeightReconciliationSettings()

  const [formData, setFormData] = useState({
    autoAcceptEnabled: false,
    autoAcceptThresholdKg: 0.05,
    autoAcceptThresholdPercent: 5,
    notifyOnDiscrepancy: true,
    notifyOnLargeDiscrepancy: true,
    largeDiscrepancyThresholdKg: 0.5,
    emailDailySummary: false,
    emailWeeklyReport: true,
  })

  useEffect(() => {
    if (settings) {
      setFormData({
        autoAcceptEnabled: settings.auto_accept_enabled,
        autoAcceptThresholdKg: Number(settings.auto_accept_threshold_kg),
        autoAcceptThresholdPercent: Number(settings.auto_accept_threshold_percent),
        notifyOnDiscrepancy: settings.notify_on_discrepancy,
        notifyOnLargeDiscrepancy: settings.notify_on_large_discrepancy,
        largeDiscrepancyThresholdKg: Number(settings.large_discrepancy_threshold_kg),
        emailDailySummary: settings.email_daily_summary,
        emailWeeklyReport: settings.email_weekly_report,
      })
    }
  }, [settings])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateSettings.mutate(formData)
  }

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack gap={3}>
        <Box
          sx={{
            p: { xs: 2.5, md: 3.2 },
            borderRadius: 5,
            border: `1px solid ${alpha(BRAND_PURPLE, 0.12)}`,
            background:
              'radial-gradient(circle at top right, rgba(8,119,201,0.12) 0%, transparent 24%), linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,247,250,0.98) 100%)',
            boxShadow: '0 18px 38px rgba(20, 20, 20, 0.08)',
          }}
        >
          <Button
            startIcon={<FiArrowLeft />}
            onClick={() => navigate('/reconciliation/weight')}
            sx={{
              color: '#6B7280',
              textTransform: 'none',
              mb: 2,
              '&:hover': { color: '#0877C9' },
            }}
          >
            Back to Weight Reconciliation
          </Button>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: '#17171A',
              fontSize: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <RiSettings2Fill size={28} color={BRAND_PURPLE} />
            Weight Reconciliation Settings
          </Typography>
          <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.5, fontSize: '14px' }}>
            Configure thresholds, alerts, and reporting rules with a cleaner PunjabShip workflow.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.2} mt={2.5}>
            {['Auto-accept thresholds', 'Discrepancy notifications', 'Daily and weekly reports'].map(
              (item) => (
                <Box
                  key={item}
                  sx={{
                    px: 1.5,
                    py: 0.8,
                    borderRadius: '999px',
                    bgcolor: alpha(BRAND_ORANGE, 0.1),
                    color: BRAND_ORANGE,
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    width: 'fit-content',
                  }}
                >
                  {item}
                </Box>
              ),
            )}
          </Stack>
        </Box>

        <form onSubmit={handleSubmit}>
          <Stack gap={3}>
            <Box sx={sectionCardSx}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0877C9', mb: 1 }}>
                Auto-Acceptance
              </Typography>
              <Typography variant="body2" sx={{ color: '#6B7280', mb: 3, fontSize: '14px' }}>
                Automatically accept weight discrepancies that fall within your defined thresholds
              </Typography>

              {formData.autoAcceptEnabled && (
                <Alert
                  severity="info"
                  sx={{
                    mb: 3,
                    backgroundColor: '#E7F3FF',
                    borderLeft: '4px solid #0877C9',
                    '& .MuiAlert-icon': {
                      color: '#0877C9',
                    },
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#0877C9', mb: 1 }}>
                    What happens when auto-acceptance is enabled:
                  </Typography>
                  <Box component="ul" sx={{ m: 0, pl: 2.5, color: '#4B5563' }}>
                    <li>
                      <Typography variant="body2" component="span">
                        <strong>Automatic Acceptance:</strong> Discrepancies within your threshold
                        are automatically accepted without manual review
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2" component="span">
                        <strong>Order Update:</strong> The order's shipping charge is automatically
                        updated to reflect the actual weight charged by the courier
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2" component="span">
                        <strong>Wallet Charge:</strong> If there's an additional charge, it's
                        automatically deducted from your wallet balance
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2" component="span">
                        <strong>Email Notification:</strong> You'll receive an email notification
                        informing you about the auto-accepted discrepancy and all actions taken
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2" component="span">
                        <strong>No Action Required:</strong> Auto-accepted discrepancies are marked
                        as "Accepted" and require no further action from you
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2" component="span">
                        <strong>Dispute Option:</strong> You can still review and raise a dispute if
                        you believe the auto-acceptance was incorrect
                      </Typography>
                    </li>
                  </Box>
                </Alert>
              )}

              <Stack gap={3}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    p: 2,
                    borderRadius: '8px',
                    bgcolor: '#F9FAFB',
                  }}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 600, color: '#0877C9', mb: 0.5 }}>
                      Enable Auto-Accept
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '13px' }}>
                      Automatically accept minor weight differences
                    </Typography>
                  </Box>
                  <Switch
                    checked={formData.autoAcceptEnabled}
                    onChange={(e) =>
                      setFormData({ ...formData, autoAcceptEnabled: e.target.checked })
                    }
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#0877C9',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#0877C9',
                      },
                    }}
                  />
                </Box>

                {formData.autoAcceptEnabled && (
                  <>
                    <Divider />
                    <Box>
                      <Typography
                        sx={{ fontWeight: 600, color: '#0877C9', mb: 1.5, fontSize: '14px' }}
                      >
                        Weight Threshold (kg)
                      </Typography>
                      <TextField
                        type="number"
                        fullWidth
                        value={formData.autoAcceptThresholdKg}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            autoAcceptThresholdKg: Number(e.target.value),
                          })
                        }
                        inputProps={{ step: 0.01, min: 0 }}
                        helperText="Auto-accept if weight difference is less than or equal to this value (e.g., 0.05 kg = 50g)"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&.Mui-focused fieldset': {
                              borderColor: '#0877C9',
                            },
                          },
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{ color: '#6B7280', mt: 0.5, display: 'block', fontSize: '12px' }}
                      >
                        Example: If set to 0.05 kg, discrepancies of 50g or less will be
                        auto-accepted
                      </Typography>
                    </Box>

                    <Box>
                      <Typography
                        sx={{ fontWeight: 600, color: '#0877C9', mb: 1.5, fontSize: '14px' }}
                      >
                        Percentage Threshold (%)
                      </Typography>
                      <TextField
                        type="number"
                        fullWidth
                        value={formData.autoAcceptThresholdPercent}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            autoAcceptThresholdPercent: Number(e.target.value),
                          })
                        }
                        inputProps={{ step: 0.1, min: 0, max: 100 }}
                        helperText="Auto-accept if weight difference percentage is less than or equal to this value"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&.Mui-focused fieldset': {
                              borderColor: '#0877C9',
                            },
                          },
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{ color: '#6B7280', mt: 0.5, display: 'block', fontSize: '12px' }}
                      >
                        Example: If set to 5%, a 1kg order with 50g difference (5%) will be
                        auto-accepted
                      </Typography>
                    </Box>

                    <Alert severity="warning" sx={{ mt: 1 }}>
                      <Typography variant="body2" sx={{ fontSize: '13px' }}>
                        <strong>Note:</strong> A discrepancy will be auto-accepted if it meets{' '}
                        <strong>either</strong> the weight threshold <strong>OR</strong> the
                        percentage threshold. Whichever condition is met first will trigger
                        auto-acceptance.
                      </Typography>
                    </Alert>
                  </>
                )}
              </Stack>
            </Box>

            {/* Notification Settings */}
            <Box sx={sectionCardSx}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0877C9', mb: 1 }}>
                Notifications
              </Typography>
              <Typography variant="body2" sx={{ color: '#6B7280', mb: 2, fontSize: '14px' }}>
                Choose when you want to be notified about weight issues
              </Typography>
              <Alert severity="info" sx={{ mb: 3, backgroundColor: '#F0F9FF', fontSize: '13px' }}>
                <Typography variant="body2" sx={{ fontSize: '13px' }}>
                  <strong>Important:</strong> Even when auto-acceptance is enabled, you will always
                  receive an email notification about auto-accepted discrepancies so you're aware of
                  what happened automatically.
                </Typography>
              </Alert>

              <Stack gap={2}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    p: 2,
                    borderRadius: '8px',
                    bgcolor: '#F9FAFB',
                  }}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 600, color: '#0877C9', mb: 0.5 }}>
                      Notify on All Discrepancies
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '13px' }}>
                      Get notified whenever a weight discrepancy is detected
                    </Typography>
                  </Box>
                  <Switch
                    checked={formData.notifyOnDiscrepancy}
                    onChange={(e) =>
                      setFormData({ ...formData, notifyOnDiscrepancy: e.target.checked })
                    }
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#0877C9',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#0877C9',
                      },
                    }}
                  />
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    p: 2,
                    borderRadius: '8px',
                    bgcolor: '#F9FAFB',
                  }}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 600, color: '#0877C9', mb: 0.5 }}>
                      Notify on Large Discrepancies
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '13px' }}>
                      Get priority alerts for significant weight differences
                    </Typography>
                  </Box>
                  <Switch
                    checked={formData.notifyOnLargeDiscrepancy}
                    onChange={(e) =>
                      setFormData({ ...formData, notifyOnLargeDiscrepancy: e.target.checked })
                    }
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#0877C9',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#0877C9',
                      },
                    }}
                  />
                </Box>

                {formData.notifyOnLargeDiscrepancy && (
                  <>
                    <Divider />
                    <Box>
                      <Typography
                        sx={{ fontWeight: 600, color: '#0877C9', mb: 1.5, fontSize: '14px' }}
                      >
                        Large Discrepancy Threshold (kg)
                      </Typography>
                      <TextField
                        type="number"
                        fullWidth
                        value={formData.largeDiscrepancyThresholdKg}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            largeDiscrepancyThresholdKg: Number(e.target.value),
                          })
                        }
                        inputProps={{ step: 0.1, min: 0 }}
                        helperText="Send priority alert if weight difference exceeds this value"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&.Mui-focused fieldset': {
                              borderColor: '#0877C9',
                            },
                          },
                        }}
                      />
                    </Box>
                  </>
                )}
              </Stack>
            </Box>

            {/* Email Reports */}
            <Box sx={sectionCardSx}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0877C9', mb: 1 }}>
                Email Reports
              </Typography>
              <Typography variant="body2" sx={{ color: '#6B7280', mb: 2, fontSize: '14px' }}>
                Receive regular email summaries of weight reconciliation activities
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: '#6B7280',
                  mb: 3,
                  display: 'block',
                  fontSize: '12px',
                  fontStyle: 'italic',
                }}
              >
                Note: These are summary reports. You'll also receive individual notifications for
                each discrepancy (including auto-accepted ones) based on your notification settings
                above.
              </Typography>

              <Stack gap={2}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    p: 2,
                    borderRadius: '8px',
                    bgcolor: '#F9FAFB',
                  }}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 600, color: '#0877C9', mb: 0.5 }}>
                      Daily Summary
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '13px' }}>
                      Receive a daily email with all weight discrepancies
                    </Typography>
                  </Box>
                  <Switch
                    checked={formData.emailDailySummary}
                    onChange={(e) =>
                      setFormData({ ...formData, emailDailySummary: e.target.checked })
                    }
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#0877C9',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#0877C9',
                      },
                    }}
                  />
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    p: 2,
                    borderRadius: '8px',
                    bgcolor: '#F9FAFB',
                  }}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 600, color: '#0877C9', mb: 0.5 }}>
                      Weekly Report
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '13px' }}>
                      Receive a comprehensive weekly report with analytics
                    </Typography>
                  </Box>
                  <Switch
                    checked={formData.emailWeeklyReport}
                    onChange={(e) =>
                      setFormData({ ...formData, emailWeeklyReport: e.target.checked })
                    }
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#0877C9',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#0877C9',
                      },
                    }}
                  />
                </Box>
              </Stack>
            </Box>

            {/* Save Button */}
            <Stack direction="row" justifyContent="flex-end" gap={2}>
              <Button
                variant="outlined"
                onClick={() => navigate('/reconciliation/weight')}
                sx={{
                  borderColor: '#E2E8F0',
                  color: '#6B7280',
                  textTransform: 'none',
                  px: 3,
                  py: 1.2,
                  '&:hover': {
                    borderColor: '#0877C9',
                    backgroundColor: 'rgba(59, 74, 116, 0.04)',
                  },
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={updateSettings.isPending}
                startIcon={<FiSave />}
                sx={{
                  bgcolor: '#0877C9',
                  color: '#FFFFFF',
                  textTransform: 'none',
                  px: 3,
                  py: 1.2,
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: '#2F3B5F',
                  },
                  '&:disabled': {
                    bgcolor: '#9CA3AF',
                    color: '#FFFFFF',
                  },
                }}
              >
                {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
              </Button>
            </Stack>
          </Stack>
        </form>
      </Stack>
    </Container>
  )
}
