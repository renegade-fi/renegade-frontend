import { env } from "@/env/server"

export async function getAllSetMembers(key: string): Promise<string[]> {
  const response = await fetch(`${env.KV_REST_API_URL}/smembers/${key}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${env.KV_REST_API_TOKEN}`,
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const data = await response.json()
  return data.result.filter(
    (member: unknown): member is string => typeof member === "string",
  )
}
