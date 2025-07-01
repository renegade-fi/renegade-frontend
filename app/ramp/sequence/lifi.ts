import { getRoutes, type RoutesRequest } from "@lifi/sdk";

/**
 * Request the best route (first element of sorted routes) from LI.FI.
 */
export async function requestBestRoute(request: RoutesRequest) {
    const res = await getRoutes(request);
    if (!res.routes || res.routes.length === 0) {
        throw new Error("LI.FI: no routes returned");
    }
    return res.routes[0];
}
