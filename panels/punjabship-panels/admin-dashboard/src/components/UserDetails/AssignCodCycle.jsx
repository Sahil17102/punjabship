import { Button, Select, Stack, Text, useToast } from '@chakra-ui/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import api from 'services/axios'

export default function AssignCodCycle({ userId }) {
  const toast = useToast()
  const cache = useQueryClient()
  const [selected, setSelected] = useState('')
  const [saving, setSaving] = useState(false)
  const cycles = useQuery({ queryKey: ['cod-cycles'], queryFn: async () => (await api.get('/admin/cod-remittance/cycles')).data.data })
  const current = useQuery({ queryKey: ['seller-cod-cycle', userId], queryFn: async () => (await api.get(`/admin/cod-remittance/users/${userId}/cycle`)).data.data, enabled: Boolean(userId) })
  return <Stack spacing={2}>
    <Text fontWeight={600}>COD remittance cycle</Text>
    <Text fontSize="sm">Current: {current.data ? `${current.data.name} | ${Number(current.data.fee || 0).toFixed(2)}% per settlement` : 'Not assigned'}</Text>
    <Select value={selected} onChange={(e) => setSelected(e.target.value)} placeholder="Select cycle">
      {(cycles.data || []).map((cycle) => <option key={cycle.id} value={cycle.id}>{cycle.name} | {cycle.days} days | {Number(cycle.fee || 0).toFixed(2)}%</option>)}
    </Select>
    <Button size="sm" isDisabled={!selected} isLoading={saving} onClick={async () => {
      setSaving(true)
      try { await api.put(`/admin/cod-remittance/users/${userId}/cycle`, { cycleId: selected }); cache.invalidateQueries({ queryKey: ['seller-cod-cycle', userId] }); toast({ status: 'success', title: 'Cycle assigned for newly collected COD shipments' }) }
      catch (error) { toast({ status: 'error', title: error.response?.data?.message || 'Could not assign cycle' }) }
      finally { setSaving(false) }
    }}>Assign COD cycle</Button>
    {(cycles.error || current.error) && <Text color="red.700">Could not load COD cycles.</Text>}
  </Stack>
}
