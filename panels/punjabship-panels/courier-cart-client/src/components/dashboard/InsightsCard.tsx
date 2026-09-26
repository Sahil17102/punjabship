import React from 'react'
import { alpha, Box, Card, CardContent, Stack, Typography } from '@mui/material'
import { MdCheckCircle, MdInfo, MdLightbulb, MdTrendingDown, MdTrendingUp, MdWarning } from 'react-icons/md'

interface InsightsCardProps {
  operational: {
    deliverySuccessRate: number
    ndrRate: number
    rtoRate: number
    avgDeliveryTime: number
  }
  trends: {
    ordersGrowth: number
    revenueGrowth: number
  }
  actions: {
    ndrCount: number
    rtoCount: number
    weightDiscrepancyCount: number
  }
}

type InsightType = 'good' | 'warning' | 'notice'

const BRAND_PRIMARY = '#0877C9'
const BRAND_ACCENT = '#B8D719'

export default function InsightsCard({ operational, trends, actions }: InsightsCardProps) {
  const insights: Array<{
    type: InsightType
    message: string
    icon: React.ReactNode
  }> = []

  if (operational.deliverySuccessRate >= 90) {
    insights.push({
      type: 'good',
      message: `Delivery success is strong at ${operational.deliverySuccessRate}%.`,
      icon: <MdCheckCircle size={18} />,
    })
  } else if (operational.deliverySuccessRate < 75) {
    insights.push({
      type: 'warning',
      message: `Delivery success dropped to ${operational.deliverySuccessRate}%. Prioritize interventions.`,
      icon: <MdWarning size={18} />,
    })
  }

  if (trends.ordersGrowth > 0) {
    insights.push({
      type: 'good',
      message: `Orders are growing by ${trends.ordersGrowth}% vs previous week.`,
      icon: <MdTrendingUp size={18} />,
    })
  } else if (trends.ordersGrowth < 0) {
    insights.push({
      type: 'warning',
      message: `Orders are down ${Math.abs(trends.ordersGrowth)}% this week.`,
      icon: <MdTrendingDown size={18} />,
    })
  }

  if (actions.ndrCount > 0 || actions.rtoCount > 0) {
    insights.push({
      type: 'notice',
      message: `${actions.ndrCount} NDR and ${actions.rtoCount} RTO orders need action.`,
      icon: <MdInfo size={18} />,
    })
  }

  if (operational.avgDeliveryTime > 7) {
    insights.push({
      type: 'warning',
      message: `Average delivery time is ${operational.avgDeliveryTime} days. Consider faster lanes.`,
      icon: <MdWarning size={18} />,
    })
  }

  const palette: Record<InsightType, { bg: string; border: string; color: string }> = {
    good: { bg: alpha(BRAND_PRIMARY, 0.07), border: alpha(BRAND_PRIMARY, 0.2), color: BRAND_PRIMARY },
    warning: { bg: alpha(BRAND_ACCENT, 0.12), border: alpha(BRAND_ACCENT, 0.25), color: '#8a3e00' },
    notice: { bg: alpha('#6b7280', 0.1), border: alpha('#6b7280', 0.25), color: '#374151' },
  }

  return (
    <Card sx={{ height: '100%', borderRadius: 2.6, border: `1px solid ${alpha(BRAND_PRIMARY, 0.14)}`, boxShadow: `0 8px 20px ${alpha(BRAND_PRIMARY, 0.08)}` }}>
      <CardContent sx={{ p: 2.2 }}>
        <Stack direction="row" spacing={1.1} alignItems="center" mb={1.8}>
          <Box sx={{ width: 34, height: 34, borderRadius: 1.8, display: 'grid', placeItems: 'center', bgcolor: alpha(BRAND_ACCENT, 0.16), color: '#8a3e00' }}>
            <MdLightbulb size={20} />
          </Box>
          <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#17171A' }}>Smart Insights</Typography>
        </Stack>

        <Stack spacing={1.05}>
          {insights.slice(0, 4).map((insight, idx) => (
            <Box
              key={idx}
              sx={{
                p: 1.2,
                borderRadius: 2,
                border: `1px solid ${palette[insight.type].border}`,
                bgcolor: palette[insight.type].bg,
              }}
            >
              <Stack direction="row" spacing={0.9} alignItems="flex-start">
                <Box sx={{ color: palette[insight.type].color, mt: 0.15 }}>{insight.icon}</Box>
                <Typography sx={{ fontSize: '12px', color: '#17171A', lineHeight: 1.45, fontWeight: 600 }}>
                  {insight.message}
                </Typography>
              </Stack>
            </Box>
          ))}

          {insights.length === 0 && (
            <Typography sx={{ fontSize: '12px', color: '#496189' }}>
              Insights will appear as shipment activity increases.
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}
