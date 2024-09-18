import { VercelKV } from "@vercel/kv"

export async function getAllSetMembers(
  kv: VercelKV,
  key: string,
): Promise<string[]> {
  const members = await kv.smembers(key)
  return members.filter(
    (member): member is string => typeof member === "string",
  )
}
