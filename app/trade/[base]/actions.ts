'use server'

import { cookies } from 'next/headers'

import { STORAGE_SIDE, STORAGE_USE_USDC } from '@/lib/constants/storage'

export async function setSide(side: 'buy' | 'sell') {
  cookies().set(STORAGE_SIDE, side)
}

export async function setUseUSDC(useUSDC: boolean) {
  cookies().set(STORAGE_USE_USDC, useUSDC ? 'true' : 'false')
}
