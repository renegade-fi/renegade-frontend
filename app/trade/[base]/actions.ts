'use server'

import { cookies } from 'next/headers'

import { STORAGE_SIDE, STORAGE_USDC_DENOMINATED } from '@/lib/constants/storage'

export async function setSide(side: 'buy' | 'sell') {
  cookies().set(STORAGE_SIDE, side)
}

export async function setUseUSDC(isUSDCDenominated: boolean) {
  cookies().set(STORAGE_USDC_DENOMINATED, isUSDCDenominated ? 'true' : 'false')
}
