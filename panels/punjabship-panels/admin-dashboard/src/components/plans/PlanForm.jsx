import { Button, FormControl, FormHelperText, FormLabel, Input, Stack, Switch } from '@chakra-ui/react'
import { useCreatePlan, useUpdatePlan } from 'hooks/usePlans'
import { useEffect, useState } from 'react'

const PlanForm = ({ plan, onClose }) => {
  const createPlan = useCreatePlan()
  const updatePlan = useUpdatePlan()

  const [form, setForm] = useState({ name: '', description: '', business_type: 'b2c' })

  useEffect(() => {
    if (plan) {
      setForm({
        name: plan.name,
        description: plan.description || '',
        business_type: plan.business_type || 'b2c',
      })
    } else {
      setForm({ name: '', description: '', business_type: 'b2c' })
    }
  }, [plan])

  const handleSubmit = () => {
    if (plan) {
      updatePlan.mutate({ id: plan.id, data: form }, { onSuccess: onClose })
    } else {
      createPlan.mutate(form, { onSuccess: onClose })
    }
  }

  return (
    <Stack spacing={4}>
      <FormControl>
        <FormLabel>Name</FormLabel>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </FormControl>
      <FormControl>
        <FormLabel>Description</FormLabel>
        <Input
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </FormControl>
      <FormControl display="flex" alignItems="center" justifyContent="space-between">
        <Stack spacing={1}>
          <FormLabel mb="0">B2B Plan</FormLabel>
          <FormHelperText mt="0">
            {plan
              ? 'Business type is locked after creation.'
              : 'Turn on to create a B2B plan. Leave off for B2C.'}
          </FormHelperText>
        </Stack>
        <Switch
          isChecked={form.business_type === 'b2b'}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, business_type: e.target.checked ? 'b2b' : 'b2c' }))
          }
          isDisabled={Boolean(plan)}
          colorScheme="blue"
        />
      </FormControl>
      <Button colorScheme="blue" onClick={handleSubmit}>
        {plan ? 'Update Plan' : 'Create Plan'}
      </Button>
    </Stack>
  )
}

export default PlanForm
