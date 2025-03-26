export async function fetchPairPrice(
  asset: string,
  apiKey: string,
): Promise<any> {
  const response = await fetch(
    `https://api.amberdata.com/market/spot/prices/pairs/${asset}_usdt/latest/?exchange=binance`,
    {
      headers: {
        accept: "application/json",
        "x-api-key": apiKey,
        "Accept-Encoding": "gzip",
      },
    },
  )

  if (!response.ok) {
    throw new Error(
      `HTTP error fetching price for ${asset}: status: ${response.status}`,
    )
  }

  return response.json()
}

export async function fetchAssetPrice(
  asset: string,
  apiKey: string,
): Promise<any> {
  const response = await fetch(
    `https://api.amberdata.com/market/spot/prices/assets/${asset}/latest/`,
    {
      headers: {
        accept: "application/json",
        "x-api-key": apiKey,
        "Accept-Encoding": "gzip",
      },
    },
  )

  if (!response.ok) {
    throw new Error(
      `HTTP error fetching single asset price for ${asset}: status: ${response.status}`,
    )
  }

  return response.json()
}
