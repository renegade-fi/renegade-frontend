import { useQuery } from "@tanstack/react-query"

export function useVolume() {
    const queryKey = ["stats", "volume"]
    return {
        ...useQuery({
            queryKey,
            queryFn: () => getVolume(),
        }),
        queryKey,
    }
}

async function getVolume() {
    const res = await fetch(`/api/stats/volume`).then((res) => res.json())
    if (res.error) {
        throw new Error(res.error)
    }
    return res.data.map((item: any) => ({
        timestamp: item[0].toString(),
        volume: item[1],
    })) as { timestamp: string; volume: number }[]
}