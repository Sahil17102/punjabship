import { Box, Button, FormControl, FormLabel, HStack, IconButton, Input, SimpleGrid, Stack, Table, Tbody, Td, Text, Th, Thead, Tooltip, Tr, useToast } from '@chakra-ui/react'
import { DeleteIcon, EditIcon } from '@chakra-ui/icons'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import api from 'services/axios'

const emptyForm = { name: '', days: '1', fee: '0' }

export default function CodCycles() {
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const toast = useToast()
  const cache = useQueryClient()
  const query = useQuery({ queryKey: ['cod-cycles'], queryFn: async () => (await api.get('/admin/cod-remittance/cycles')).data.data })

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
  }

  const submitForm = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      if (editingId) {
        await api.patch(`/admin/cod-remittance/cycles/${editingId}`, form)
        toast({ status: 'success', title: 'Cycle updated' })
      } else {
        await api.post('/admin/cod-remittance/cycles', form)
        toast({ status: 'success', title: 'Cycle created' })
      }
      cache.invalidateQueries({ queryKey: ['cod-cycles'] })
      resetForm()
    } catch (error) {
      toast({ status: 'error', title: error.response?.data?.message || `Could not ${editingId ? 'update' : 'create'} cycle` })
    } finally {
      setSaving(false)
    }
  }

  const startEditing = (cycle) => {
    setEditingId(cycle.id)
    setForm({ name: cycle.name, days: String(cycle.days), fee: String(cycle.fee ?? '0') })
  }

  const deleteCycle = async (cycle) => {
    if (!window.confirm(`Delete the ${cycle.name} cycle?`)) return
    try {
      await api.delete(`/admin/cod-remittance/cycles/${cycle.id}`)
      cache.invalidateQueries({ queryKey: ['cod-cycles'] })
      if (editingId === cycle.id) resetForm()
      toast({ status: 'success', title: 'Cycle deleted' })
    } catch (error) {
      toast({ status: 'error', title: error.response?.data?.message || 'Could not delete cycle' })
    }
  }

  return <Box borderWidth="1px" borderRadius="8px" bg="white" p={{ base: 3, md: 4 }} mb={4}>
    <HStack justify="space-between" align="center" mb={3}>
      <Box>
        <Text fontSize="lg" fontWeight={700}>Remittance cycles</Text>
        <Text fontSize="sm" color="gray.500">Create, edit, or remove cycles used for seller COD settlements.</Text>
      </Box>
      {editingId && <Button size="sm" variant="ghost" onClick={resetForm}>Cancel edit</Button>}
    </HStack>
    <Table size="sm" variant="simple">
      <Thead><Tr><Th>Cycle</Th><Th>Days after COD collection</Th><Th isNumeric>Wallet fee rate</Th><Th width="92px">Actions</Th></Tr></Thead>
      <Tbody>
        {(query.data || []).map((cycle) => <Tr key={cycle.id}>
          <Td fontWeight={600}>{cycle.name}</Td>
          <Td>D+{cycle.days}</Td>
          <Td isNumeric>{Number(cycle.fee || 0).toFixed(2)}%</Td>
          <Td>
            <HStack spacing={1} justify="end">
              <Tooltip label="Edit cycle"><IconButton size="sm" variant="ghost" icon={<EditIcon />} aria-label={`Edit ${cycle.name}`} onClick={() => startEditing(cycle)} /></Tooltip>
              <Tooltip label="Delete cycle"><IconButton size="sm" variant="ghost" colorScheme="red" icon={<DeleteIcon />} aria-label={`Delete ${cycle.name}`} onClick={() => deleteCycle(cycle)} /></Tooltip>
            </HStack>
          </Td>
        </Tr>)}
      </Tbody>
    </Table>
    {query.isLoading && <Text fontSize="sm" color="gray.500" mt={3}>Loading cycles...</Text>}
    {!query.isLoading && !query.data?.length && <Text fontSize="sm" color="gray.500" mt={3}>No remittance cycles created yet.</Text>}
    {query.error && <Text color="red.700" mt={3}>Could not load cycles.</Text>}
    <Stack as="form" mt={4} spacing={3} onSubmit={submitForm}>
      <Text fontWeight={600}>{editingId ? 'Edit remittance cycle' : 'Create remittance cycle'}</Text>
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
        <FormControl isRequired><FormLabel mb={1}>Cycle name</FormLabel><Input size="sm" value={form.name} maxLength={80} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormControl>
        <FormControl isRequired><FormLabel mb={1}>Days after collection</FormLabel><Input size="sm" type="number" min={0} max={365} step={1} value={form.days} onChange={(e) => setForm({ ...form, days: e.target.value })} /></FormControl>
        <FormControl isRequired><FormLabel mb={1}>Fee percentage on settled COD</FormLabel><Input size="sm" type="number" min={0} max={100} step="0.01" value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} /></FormControl>
      </SimpleGrid>
      <Button type="submit" size="sm" alignSelf="start" isLoading={saving}>{editingId ? 'Save changes' : 'Create cycle'}</Button>
    </Stack>
  </Box>
}
