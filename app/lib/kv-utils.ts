import { VercelKV } from "@vercel/kv";

export async function getAllSetMembers(kv: VercelKV, key: string, batchSize: number = 100): Promise<string[]> {
    let cursor = 0;
    const allMembers: string[] = [];
    do {
        const [nextCursor, members] = await kv.sscan(key, cursor.toString(), { count: batchSize });
        cursor = typeof nextCursor === 'string' ? parseInt(nextCursor) : nextCursor;
        allMembers.push(...members.filter((member): member is string => typeof member === 'string'));
    } while (cursor !== 0);
    return allMembers;
}