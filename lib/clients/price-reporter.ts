import { PriceReporterClient } from "@renegade-fi/price-reporter";

import { env } from "@/env/client";

export const client = PriceReporterClient.new(env.NEXT_PUBLIC_CHAIN_ENVIRONMENT);
