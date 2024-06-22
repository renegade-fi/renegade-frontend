'use server'

import { cookies } from 'next/headers'

import { STORAGE_SIDE } from '@/lib/constants/storage'

export async function setSide(side: 'buy' | 'sell') {
  cookies().set(STORAGE_SIDE, side)
}
