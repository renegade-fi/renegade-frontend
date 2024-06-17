export const ROOT_KEY_MESSAGE_PREFIX =
  'Unlock your Renegade Wallet on chain ID:'

export const BASE_SEED_KEYS = [
  'WBTC_USDC_SEED',
  'WETH_USDC_SEED',
  'BNB_USDC_SEED',
  'MATIC_USDC_SEED',
  'LDO_USDC_SEED',
  'LINK_USDC_SEED',
  'UNI_USDC_SEED',
  'SUSHI_USDC_SEED',
  '1INCH_USDC_SEED',
  'AAVE_USDC_SEED',
  'COMP_USDC_SEED',
  'MKR_USDC_SEED',
  'REN_USDC_SEED',
  'MANA_USDC_SEED',
  'ENS_USDC_SEED',
  'DYDX_USDC_SEED',
  'CRV_USDC_SEED',
] as const

const BOT_SECRETS = JSON.parse(process.env.NEXT_PUBLIC_BOT_SECRETS)

export const BASE_KEY_TO_SEED_MAP = new Map(
  Object.keys(BOT_SECRETS)
    .filter(key => BASE_SEED_KEYS.includes(key as BaseSeedKey))
    .map(key => [key, BOT_SECRETS[key]]),
)

export const QUOTER_KEY = (
  baseSeedKey: BaseSeedKey,
  accountIndex: number,
): QuoterKey => {
  return `${baseSeedKey}-${accountIndex}`
}

export type BaseSeedKey = (typeof BASE_SEED_KEYS)[number]
export type QuoterKey = `${BaseSeedKey}-${number}`
