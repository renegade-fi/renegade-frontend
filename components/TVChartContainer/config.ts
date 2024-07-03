import {
  ChartingLibraryWidgetOptions,
  DatafeedConfiguration,
  ResolutionString,
} from '@renegade-fi/tradingview-charts'

// DatafeedConfiguration implementation
export const config = {
  // Represents the resolutions for bars supported by your datafeed
  supported_resolutions: [
    '1',
    '3',
    '5',
    '15',
    '30',
    '60',
    '120',
    '240',
    '480',
    '960',
    '1D',
    '3D',
    '1W',
  ] as ResolutionString[],

  // The `exchanges` arguments are used for the `searchSymbols` method if a user selects the exchange
  exchanges: [
    {
      value: 'binance',
      name: 'Binance Name',
      desc: 'Binance Description',
    },
  ],
  // The `symbols_types` arguments are used for the `searchSymbols` method if a user selects this symbol type
  symbols_types: [
    {
      name: 'crypto',
      value: 'crypto',
    },
  ],
} satisfies DatafeedConfiguration
