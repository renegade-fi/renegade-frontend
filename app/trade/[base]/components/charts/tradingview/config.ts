import type {
    ChartingLibraryFeatureset,
    ChartingLibraryWidgetOptions,
    ChartTypeFavorites,
    CustomTimezones,
    DatafeedConfiguration,
    Favorites,
    ResolutionString,
} from "@renegade-fi/tradingview-charts";

export const datafeedConfig = {
    exchanges: [
        {
            desc: "Binance",
            name: "BINANCE",
            value: "binance",
        },
        {
            desc: "Coinbase",
            name: "COINBASE",
            value: "coinbase",
        },
        {
            desc: "Kraken",
            name: "KRAKEN",
            value: "kraken",
        },
        {
            desc: "Okx",
            name: "OKX",
            value: "okx",
        },
    ],
    supported_resolutions: [
        "1",
        "3",
        "5",
        "15",
        "30",
        "60",
        "120",
        "240",
        "480",
        "960",
        "1D",
        "3D",
        "1W",
    ] as ResolutionString[],
    symbols_types: [
        {
            name: "crypto",
            value: "crypto",
        },
    ],
} satisfies DatafeedConfiguration;

const disabled_features: Partial<ChartingLibraryFeatureset>[] = [
    "left_toolbar",
    "header_compare",
    "header_fullscreen_button",
    "header_indicators",
    "show_interval_dialog_on_key_press",
    "header_symbol_search",
    "header_undo_redo",
    "header_quick_search",
    "symbol_search_hot_key",
    "header_saveload",
    "show_chart_property_page",
    "header_screenshot",
    "create_volume_indicator_by_default",
    "save_chart_properties_to_local_storage",
];

const enabled_features = ["items_favoriting"] satisfies ChartingLibraryFeatureset[];

const favorites = {
    intervals: ["5", "60", "1D"] as ResolutionString[],
} satisfies Favorites<ChartTypeFavorites>;

const loading_screen = {
    backgroundColor: "#0B0A09",
};

const time_frames = [
    {
        description: "5 years in 1 week intervals",
        resolution: "1W" as ResolutionString,
        text: "5y",
    },
    {
        description: "1 year in 1 week intervals",
        resolution: "1W" as ResolutionString,
        text: "1y",
    },
    {
        description: "6 months in 2 hour intervals",
        resolution: "120" as ResolutionString,
        text: "6m",
    },
    {
        description: "3 months in 1 hour intervals",
        resolution: "60" as ResolutionString,
        text: "3m",
    },
    {
        description: "1 month in 30 minute intervals",
        resolution: "30" as ResolutionString,
        text: "1m",
    },
    {
        description: "5 days in 5 minute intervals",
        resolution: "5" as ResolutionString,
        text: "5d",
    },
    {
        description: "1 day in 1 minute intervals",
        resolution: "1" as ResolutionString,
        text: "1d",
    },
];

const overrides = {
    "paneProperties.background": "#0B0A09",
    "paneProperties.backgroundType": "solid",
    "paneProperties.horzGridProperties.color": "#292524",
    "paneProperties.separatorColor": "#292524",
    "paneProperties.vertGridProperties.color": "#292524",
    "scalesProperties.textColor": "#a8a29e",
};

const customTimezones = new Set([
    "Africa/Cairo",
    "Africa/Casablanca",
    "Africa/Johannesburg",
    "Africa/Lagos",
    "Africa/Nairobi",
    "Africa/Tunis",
    "America/Anchorage",
    "America/Argentina/Buenos_Aires",
    "America/Bogota",
    "America/Caracas",
    "America/Chicago",
    "America/El_Salvador",
    "America/Juneau",
    "America/Lima",
    "America/Los_Angeles",
    "America/Mexico_City",
    "America/New_York",
    "America/Phoenix",
    "America/Santiago",
    "America/Sao_Paulo",
    "America/Toronto",
    "America/Vancouver",
    "Asia/Almaty",
    "Asia/Ashkhabad",
    "Asia/Bahrain",
    "Asia/Bangkok",
    "Asia/Chongqing",
    "Asia/Colombo",
    "Asia/Dhaka",
    "Asia/Dubai",
    "Asia/Ho_Chi_Minh",
    "Asia/Hong_Kong",
    "Asia/Jakarta",
    "Asia/Jerusalem",
    "Asia/Karachi",
    "Asia/Kathmandu",
    "Asia/Kolkata",
    "Asia/Kuwait",
    "Asia/Manila",
    "Asia/Muscat",
    "Asia/Nicosia",
    "Asia/Qatar",
    "Asia/Riyadh",
    "Asia/Seoul",
    "Asia/Shanghai",
    "Asia/Singapore",
    "Asia/Taipei",
    "Asia/Tehran",
    "Asia/Tokyo",
    "Asia/Yangon",
    "Atlantic/Reykjavik",
    "Australia/Adelaide",
    "Australia/Brisbane",
    "Australia/Perth",
    "Australia/Sydney",
    "Europe/Amsterdam",
    "Europe/Athens",
    "Europe/Belgrade",
    "Europe/Berlin",
    "Europe/Bratislava",
    "Europe/Brussels",
    "Europe/Bucharest",
    "Europe/Budapest",
    "Europe/Copenhagen",
    "Europe/Dublin",
    "Europe/Helsinki",
    "Europe/Istanbul",
    "Europe/Lisbon",
    "Europe/London",
    "Europe/Luxembourg",
    "Europe/Madrid",
    "Europe/Malta",
    "Europe/Moscow",
    "Europe/Oslo",
    "Europe/Paris",
    "Europe/Prague",
    "Europe/Riga",
    "Europe/Rome",
    "Europe/Stockholm",
    "Europe/Tallinn",
    "Europe/Vienna",
    "Europe/Vilnius",
    "Europe/Warsaw",
    "Europe/Zurich",
    "Pacific/Auckland",
    "Pacific/Chatham",
    "Pacific/Fakaofo",
    "Pacific/Honolulu",
    "Pacific/Norfolk",
    "US/Mountain",
]);

function constructConfig(
    baseConfig: Partial<ChartingLibraryWidgetOptions>,
): Partial<ChartingLibraryWidgetOptions> {
    const timezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (customTimezones.has(timezone)) {
        return {
            ...baseConfig,
            timezone: timezone as CustomTimezones,
        };
    }
    return baseConfig;
}

export const config = constructConfig({
    autosize: true,
    custom_css_url: "/static/theme.css",
    debug: false,
    disabled_features,
    enabled_features,
    favorites,
    fullscreen: false,
    interval: "60" as ResolutionString,
    library_path: "/static/charting_library/",
    loading_screen,
    overrides,
    theme: "dark",
    time_frames,
    // custom_font_family: "var(--font-sans)",
});
