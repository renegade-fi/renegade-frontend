import { useQuery } from "@tanstack/react-query";

import type { MaintenanceMode } from "@/app/api/get-maintenance-mode/route";

async function fetchMaintenanceMode(): Promise<MaintenanceMode> {
    const response = await fetch("/api/get-maintenance-mode");
    if (!response.ok) {
        throw new Error("Failed to fetch maintenance mode");
    }
    return response.json();
}

export function useMaintenanceMode() {
    return useQuery<MaintenanceMode, Error>({
        queryKey: ["maintenanceMode"],
        queryFn: fetchMaintenanceMode,
        select: (data) => ({
            ...data,
        }),
        staleTime: 0,
    });
}
