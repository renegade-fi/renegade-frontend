export async function getAllSetMembers(key: string): Promise<string[]> {
  const response = await fetch(
    `${process.env.KV_REST_API_URL}/smembers/${key}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
      },
      cache: "no-store",
    },
  )

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const data = await response.json()
  return data.result.filter(
    (member: unknown): member is string => typeof member === "string",
  )
}
