import { useQuery } from "@tanstack/react-query";

type RawTvlData = {
    address: `0x${string}`;
    tvl: bigint;
};

export function useTvl(chainId: number) {
    const queryKey = ["stats", "tvl", chainId];
    return {
        ...useQuery<RawTvlData[], Error>({
            queryFn: () => fetchTvlData(chainId),
            queryKey,
            staleTime: Infinity,
        }),
        queryKey,
    };
}

const fetchTvlData = async (chainId: number) => {
    const response = await fetch(`/api/stats/tvl?chainId=${chainId}`);
    if (!response.ok) {
        throw new Error("Failed to fetch TVL data");
    }
    const res = await response.json().then((res) =>
        res.data.map(({ address, tvl }: RawTvlData) => ({
            address,
            tvl: BigInt(tvl),
        })),
    );
    return res;
};
