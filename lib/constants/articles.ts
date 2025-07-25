export const HELP_CENTER_BASE_URL = "https://help.renegade.fi/hc/en-us";
const HELP_CENTER_ARTICLES_BASE_URL = `${HELP_CENTER_BASE_URL}/articles`;

export const HELP_CENTER_ARTICLES = {
    EXTERNAL_MATCHES: {
        title: "What are External Matches",
        url: `${HELP_CENTER_ARTICLES_BASE_URL}/35455732014355-What-are-External-Matches`,
    },
    FEES: {
        title: "What are the fees",
        url: `${HELP_CENTER_ARTICLES_BASE_URL}/32530643173651-What-are-the-fees`,
    },
    MIDPOINT_PRICING: {
        title: "How does Renegade's midpoint peg pricing work",
        url: `${HELP_CENTER_ARTICLES_BASE_URL}/32530574872211-What-is-a-midpoint-peg`,
    },
    ORDER_FILLING: {
        title: "Why is my order still open",
        url: `${HELP_CENTER_ARTICLES_BASE_URL}/32759851318931-Why-is-my-order-still-open`,
    },
    PRIVACY: {
        title: "What is pre-trade and post-trade privacy",
        url: `${HELP_CENTER_ARTICLES_BASE_URL}/32760870056723-What-is-pre-trade-and-post-trade-privacy`,
    },
    SAVINGS_VS_BINANCE: {
        title: "How are the savings versus Binance calculated",
        url: `${HELP_CENTER_ARTICLES_BASE_URL}/33044476688531-How-are-the-savings-versus-Binance-calculated`,
    },
    ZERO_MEV: {
        title: "Does Renegade really have zero MEV, copy trading, slippage, or price impact",
        url: `${HELP_CENTER_ARTICLES_BASE_URL}/32762213393043-Does-Renegade-really-have-zero-MEV-copy-trading-slippage-or-price-impact`,
    },
} as const;
