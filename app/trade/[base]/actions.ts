'use server'

import { STORAGE_SIDE } from '@/lib/constants/storage'
import { cookies } from 'next/headers'

export async function setSide(side: 'buy' | 'sell') {
  cookies().set(STORAGE_SIDE, side)
}
