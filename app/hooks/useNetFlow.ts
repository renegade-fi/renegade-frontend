import { NetFlowResponse } from '@/app/api/stats/net-flow/route'
import { useQuery } from '@tanstack/react-query'

async function fetchNetFlow(): Promise<NetFlowResponse> {
    const response = await fetch('/api/stats/net-flow')
    if (!response.ok) {
        throw new Error('Failed to fetch net flow data')
    }
    return response.json()
}

export function useNetFlow() {
    return useQuery<NetFlowResponse, Error>({
        queryKey: ['stats', 'netFlow'],
        queryFn: fetchNetFlow,
    })
}