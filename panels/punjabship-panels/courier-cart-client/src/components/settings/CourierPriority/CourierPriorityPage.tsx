'use client'

import { Box, Button, CircularProgress, Stack } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useAllCouriersWithDetails } from '../../../hooks/Integrations/useCouriers'
import { useCourierPriorities, useCreateCourierPriority } from '../../../hooks/useCourierPriority'
import PageHeading from '../../UI/heading/PageHeading'
import CourierPriorityCard from './CourierPriorityCard'
import PersonalisedEditor, { type PriorityCourier } from './PersonalisedEditor'

export type ProfileName = 'fastest' | 'economical' | 'personalised'

interface FormValues {
  personalised_order: PriorityCourier[]
}

const CourierPriorityPage = () => {
  const { data: profiles, isLoading } = useCourierPriorities()
  const [selected, setSelected] = useState<ProfileName>('fastest') // default

  const { data: allCouriers = [] } = useAllCouriersWithDetails()
  const createProfile = useCreateCourierPriority()

  const { handleSubmit, control, reset, getValues } = useForm<FormValues>({
    defaultValues: {
      personalised_order: [],
    },
  })

  // 🔹 Prefill form
  useEffect(() => {
    if (!allCouriers.length) return
    if (profiles) {
      if (profiles?.personalised_order?.length) {
        reset({
          personalised_order: profiles?.personalised_order,
        })
        setSelected('personalised')
        return
      }
      if (profiles?.name) {
        setSelected(profiles?.name)
      }
    }

    // fallback: default from allCouriers
    reset({
      personalised_order: allCouriers.map(
        (c: { courierId: number; name: string; id: number }, i: number) => ({
          courierId: c.id ?? c.courierId,
          name: c.name,
          priority: i + 1,
        }),
      ),
    })
  }, [profiles, allCouriers])

  const onSubmit = (data: FormValues) => {
    createProfile.mutate({
      name: selected,
      ...(selected === 'personalised' && { personalised_order: data.personalised_order }),
    })
  }

  console.log(getValues())

  const allProfiles = useMemo(() => {
    return [{ name: 'fastest' }, { name: 'economical' }, { name: 'personalised' }]
  }, [])

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack gap={4} p={3}>
        <Stack direction={'row'} justifyContent={'space-between'}>
          <PageHeading title="Courier Priority Settings" />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            disabled={createProfile.isPending}
          >
            {createProfile.isPending ? 'Saving...' : 'Save'}
          </Button>
        </Stack>
        <Stack direction="row" spacing={2} flexWrap="wrap">
          {allProfiles?.map((profile: { name: string }, index) => (
            <CourierPriorityCard
              key={`${profile.name}_${index}`}
              profile={profile}
              selected={selected === profile.name}
              onSelect={setSelected}
            />
          ))}
        </Stack>
        {selected === 'personalised' && (
          <Box mt={4}>
            <Controller
              name="personalised_order"
              control={control}
              render={({ field }) => (
                <PersonalisedEditor couriers={field.value ?? []} onChange={field.onChange} />
              )}
            />
          </Box>
        )}
      </Stack>
    </form>
  )
}

export default CourierPriorityPage
