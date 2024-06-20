import numeral from 'numeral'
import { formatUnits } from 'viem'

export const formatNumber = (
  balance: bigint,
  decimals: number,
  long: boolean = false,
) => {
  const balanceValue = Number(formatUnits(balance, decimals))
  const tempNumeral = numeral(balanceValue)

  if (balanceValue.toString().indexOf('e') !== -1) {
    if (long) {
      return formatScientificToDecimal(balanceValue)
    } else {
      return tempNumeral.format('0[.]00e+0')
    }
  }

  let formatStr = ''
  if (balanceValue > 10000000) {
    formatStr = long ? '0,0[.]00' : '0.00a'
  } else if (balanceValue > 1000000) {
    formatStr = long ? '0.[00]' : '0[.]00a'
  } else if (balanceValue > 10000) {
    formatStr = long ? '0.[00]' : '0[.]00a'
  } else if (balanceValue > 100) {
    formatStr = `0[.]00${long ? '00' : ''}`
  } else if (balanceValue >= 1) {
    formatStr = `0.[00${long ? '00' : ''}]`
  } else {
    formatStr = getFormat(balanceValue, long)
  }

  if (Number(balance.toString())) return tempNumeral.format(formatStr)
  return tempNumeral.format('0')
}

export const formatScientificToDecimal = (price: number) => {
  let priceStr = price.toString()
  const decimalPos = priceStr.indexOf('.')
  const exponentPos = priceStr.indexOf('e')

  if (decimalPos === -1) {
    priceStr =
      priceStr.substring(0, exponentPos) + '.' + priceStr.substring(exponentPos)
  }

  const integerPart = priceStr.split('.')[0]
  const fractionalPart = priceStr.split('.')[1].split('e')[0]
  const exponentValue = Math.abs(Number(priceStr.split('e')[1]))

  return `0.${'0'.repeat(
    exponentValue - 1,
  )}${integerPart}${fractionalPart.substring(0, 3)}`
}

export const getFormat = (price: number, long: boolean = false) => {
  let format = '0.'
  const fraction = price.toString().split('.')[1]

  if (fraction) {
    for (let digit of fraction) {
      if (digit === '0') {
        format += 0
      } else {
        break
      }
    }
  }

  return format + (long ? '0000' : '0')
}