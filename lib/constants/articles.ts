export const HELP_CENTER_BASE_URL = "https://help.renegade.fi/hc/en-us/articles"

export const HELP_CENTER_ARTICLES = {
  INDICATIONS_OF_INTEREST: {
    title: "What are Indications of Interest",
    url: `${HELP_CENTER_BASE_URL}/35359659794579-What-are-Indications-of-Interest`,
  },
} as const

// Type for article keys
export type HelpCenterArticle = keyof typeof HELP_CENTER_ARTICLES
