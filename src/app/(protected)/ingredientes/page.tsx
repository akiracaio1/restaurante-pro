'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

type Ingredient = {
  id: number
  user_id: number
  name: string
  unit: string
  unit_cost: number
  min_stock: number
  purchase_unit: string | null
  purchase_quantity: number | null
  purchase_cost: number | null
  yield_percentage: number | null
  reduction_stages: string | null
  processing_cost_per_unit: number | null
  processing_cost_per_batch: number | null
  processing_batch_size: number | null
}

export default function IngredientsPage() {
  return <div>ok</div>
}
