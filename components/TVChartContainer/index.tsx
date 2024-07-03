import { useEffect, useRef } from 'react'

import {
  ChartingLibraryWidgetOptions,
  CustomIndicator,
  IPineStudyResult,
  LanguageCode,
  LibraryPineStudy,
  OhlcStudyPlotStyle,
  RawStudyMetaInfoId,
  ResolutionString,
  StudyPlotType,
  widget,
} from '@renegade-fi/tradingview-charts'

import Datafeed from './datafeed'

export const TVChartContainer = (
  props: Partial<ChartingLibraryWidgetOptions>,
) => {
  const chartContainerRef =
    useRef<HTMLDivElement>() as React.MutableRefObject<HTMLInputElement>

  useEffect(() => {
    const widgetOptions: ChartingLibraryWidgetOptions = {
      symbol: props.symbol,
      datafeed: Datafeed,
      interval: props.interval as ResolutionString,
      container: chartContainerRef.current,
      library_path: props.library_path,
      locale: props.locale as LanguageCode,
      disabled_features: [
        'left_toolbar',
        'header_compare',
        'header_fullscreen_button',
        'header_indicators',
        'show_interval_dialog_on_key_press',
        'header_symbol_search',
        'header_undo_redo',
        'header_quick_search',
        'symbol_search_hot_key',
        'header_saveload',
        'show_chart_property_page',
        'header_screenshot',
        'create_volume_indicator_by_default',
        // TODO: Remove in prod
        'use_localstorage_for_settings',
        'save_chart_properties_to_local_storage',
      ],
      enabled_features: ['items_favoriting'],
      charts_storage_url: props.charts_storage_url,
      charts_storage_api_version: props.charts_storage_api_version,
      client_id: props.client_id,
      user_id: props.user_id,
      fullscreen: props.fullscreen,
      autosize: props.autosize,
      theme: 'dark',
      overrides: {
        'paneProperties.backgroundType': 'solid',
        'paneProperties.background': '#0B0A09',
        'paneProperties.vertGridProperties.color': '#292524',
        'paneProperties.horzGridProperties.color': '#292524',
        'paneProperties.separatorColor': '#292524',
      },
      custom_css_url: '../theme.css',
      time_frames: [
        {
          text: '5y',
          resolution: '1W' as ResolutionString,
          description: '5 years in 1 week intervals',
        },
        {
          text: '1y',
          resolution: '1W' as ResolutionString,
          description: '1 year in 1 week intervals',
        },
        {
          text: '6m',
          resolution: '120' as ResolutionString,
          description: '6 months in 2 hour intervals',
        },
        {
          text: '3m',
          resolution: '60' as ResolutionString,
          description: '3 months in 1 hour intervals',
        },
        {
          text: '1m',
          resolution: '30' as ResolutionString,
          description: '1 month in 30 minute intervals',
        },
        {
          text: '5d',
          resolution: '5' as ResolutionString,
          description: '5 days in 5 minute intervals',
        },
        {
          text: '1d',
          resolution: '1' as ResolutionString,
          description: '1 day in 1 minute intervals',
        },
      ],
      favorites: {
        intervals: ['5', '60', '1D'] as ResolutionString[],
      },
      loading_screen: { backgroundColor: '#0B0A09' },
      /* Within the Widget constructor options */
      custom_indicators_getter: PineJS => {
        // @ts-ignore
        return Promise.resolve<CustomIndicator[]>([
          /* Advanced Colouring Candles */
          {
            name: 'Advanced Coloring Candles',
            metainfo: {
              _metainfoVersion: 51,

              id: 'advancedcolouringcandles@tv-basicstudies-1' as RawStudyMetaInfoId,
              name: 'Advanced Coloring Candles',
              description: 'Advanced Coloring Candles',
              shortDescription: 'Advanced Coloring Candles',

              isCustomIndicator: true,

              is_price_study: true, // whether the study should appear on the main series pane.
              linkedToSeries: true, // whether the study price scale should be the same as the main series one.

              format: {
                type: 'price',
                precision: 2,
              },

              plots: [
                {
                  id: 'plot_open',
                  type: 'ohlc_open',
                  target: 'plot_candle',
                },
                {
                  id: 'plot_high',
                  type: 'ohlc_high',
                  target: 'plot_candle',
                },
                {
                  id: 'plot_low',
                  type: 'ohlc_low',
                  target: 'plot_candle',
                },
                {
                  id: 'plot_close',
                  type: 'ohlc_close',
                  target: 'plot_candle',
                },
                {
                  id: 'plot_bar_color',
                  type: 'ohlc_colorer',
                  palette: 'palette_bar',
                  target: 'plot_candle',
                },
                {
                  id: 'plot_wick_color',
                  type: 'wick_colorer',
                  palette: 'palette_wick',
                  target: 'plot_candle',
                },
                {
                  id: 'plot_border_color',
                  type: 'border_colorer',
                  palette: 'palette_border',
                  target: 'plot_candle',
                },
              ],

              palettes: {
                palette_bar: {
                  colors: [{ name: 'Colour One' }, { name: 'Colour Two' }],

                  valToIndex: {
                    0: 0,
                    1: 1,
                  },
                },
                palette_wick: {
                  colors: [{ name: 'Colour One' }, { name: 'Colour Two' }],

                  valToIndex: {
                    0: 0,
                    1: 1,
                  },
                },
                palette_border: {
                  colors: [{ name: 'Colour One' }, { name: 'Colour Two' }],

                  valToIndex: {
                    0: 0,
                    1: 1,
                  },
                },
              },

              ohlcPlots: {
                plot_candle: {
                  title: 'Candles',
                },
              },

              defaults: {
                ohlcPlots: {
                  plot_candle: {
                    borderColor: '#000000',
                    color: '#000000',
                    drawBorder: true,
                    drawWick: true,
                    plottype: 'ohlc_candles',
                    visible: true,
                    wickColor: '#000000',
                  },
                },

                palettes: {
                  palette_bar: {
                    colors: [
                      { color: '#1948CC', width: 1, style: 0 },
                      { color: '#F47D02', width: 1, style: 0 },
                    ],
                  },
                  palette_wick: {
                    colors: [{ color: '#0C3299' }, { color: '#E65000' }],
                  },
                  palette_border: {
                    colors: [{ color: '#5B9CF6' }, { color: '#FFB74D' }],
                  },
                },

                precision: 2,
                inputs: {},
              },
              styles: {},
              inputs: [],
            },
            constructor: function (this: LibraryPineStudy<IPineStudyResult>) {
              this.main = function (context, inputCallback) {
                this._context = context
                this._input = inputCallback

                this._context.select_sym(0)

                const value = 3000 + Math.random() * 1000
                // const o = PineJS.Std.open(this._context)
                // const h = PineJS.Std.high(this._context)
                // const l = PineJS.Std.low(this._context)
                // const c = PineJS.Std.close(this._context)

                // Color is determined randomly
                const colour = Math.round(Math.random())
                return [
                  value,
                  value,
                  value,
                  value,
                  colour /*bar*/,
                  colour /*wick*/,
                  colour /*border*/,
                ]
              }
            },
          },
        ])
      },
    }

    const tvWidget = new widget(widgetOptions)
    return () => {
      tvWidget.remove()
    }
  }, [props])

  return (
    <>
      <div className="h-[500px]" ref={chartContainerRef} />
    </>
  )
}
