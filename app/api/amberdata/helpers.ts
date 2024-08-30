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
      },
    },
  )

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}
