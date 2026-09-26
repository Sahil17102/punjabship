'use client'

import { Avatar, Box, Chip, Paper, Typography } from '@mui/material'
import React, { useState } from 'react'
import { courierLogos, defaultLogo } from '../../../utils/constants'

export interface PriorityCourier {
  courierId: number
  name: string
  priority: number
}

interface PersonalisedEditorProps {
  couriers: PriorityCourier[]
  onChange: (updated: PriorityCourier[]) => void // 🔹 comes from react-hook-form Controller
}

const swap = (list: PriorityCourier[], from: number, to: number): PriorityCourier[] => {
  const result = [...list]
  const temp = result[from]
  result[from] = result[to]
  result[to] = temp
  // 🔹 Update priority based on new order
  return result.map((item, i) => ({ ...item, priority: i + 1 }))
}

const PersonalisedEditor: React.FC<PersonalisedEditorProps> = ({ couriers, onChange }) => {
  const [items, setItems] = useState<PriorityCourier[]>(couriers)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const handleDragStart = (index: number) => setDraggedIndex(index)

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault()

  const handleDrop = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return
    const newItems = swap(items, draggedIndex, index)
    setItems(newItems)
    onChange(newItems) // 🔹 update form state
    setDraggedIndex(null)
  }

  const getLogo = (courier: PriorityCourier) =>
    Object.entries(courierLogos || {}).find(([key]) =>
      courier?.name?.toLowerCase().includes(key.toLowerCase()),
    )?.[1] ?? defaultLogo

  return (
    <Box mt={4} display="grid" gridTemplateColumns="repeat(4, 1fr)" gap={2}>
      {items.map((c, index) => (
        <Paper
          key={c.courierId}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={handleDragOver}
          onDrop={() => handleDrop(index)}
          sx={{
            p: 2,
            textAlign: 'center',
            borderRadius: 3,
            cursor: 'grab',
            position: 'relative',
            backgroundColor: draggedIndex === index ? 'rgba(25,118,210,0.15)' : 'background.paper',
            boxShadow:
              draggedIndex === index ? '0 6px 12px rgba(0,0,0,0.2)' : '0 2px 6px rgba(0,0,0,0.1)',
            transition: 'all 0.2s ease',
          }}
        >
          {/* Priority Badge */}
          <Chip
            label={`#${c.priority ?? index + 1}`}
            color="primary"
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              fontWeight: 'bold',
            }}
          />

          <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
            <Avatar src={getLogo(c)} alt={c.name} sx={{ width: 40, height: 40 }} />
            <Typography fontWeight={600}>{c.name}</Typography>
          </Box>
        </Paper>
      ))}
    </Box>
  )
}

export default PersonalisedEditor
