export async function fetchAssetPrice(
  asset: string,
  apiKey: string,
): Promise<any> {
  const response = await fetch(
    `https://api.amberdata.com/market/spot/prices/pairs/${asset}_usdt/latest/?exchange=binance`,
    {
      headers: {
        accept: "application/json",
        "x-api-key": apiKey,
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
