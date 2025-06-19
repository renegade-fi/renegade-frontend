import { type QueryKey, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { useBlockNumber } from "wagmi";

const N = BigInt(50);

export function useRefreshOnBlock({ queryKey }: { queryKey: QueryKey }) {
    const _queryClient = useQueryClient();
    const { data } = useBlockNumber({ watch: true });

    React.useEffect(() => {
        if (data && data % N === BigInt(0)) {
            // Disable for more granular control over invalidations
            // queryClient.invalidateQueries({ queryKey })
        }
    }, [data]);
}
