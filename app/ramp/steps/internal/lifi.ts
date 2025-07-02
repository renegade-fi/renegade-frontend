import { getRoutes, type RoutesRequest } from "@lifi/sdk";

// Error messages
const NO_ROUTES_ERROR = "LI.FI: no routes returned";

/**
 * Request the best route from LI.FI for token bridging or swapping.
 */
export async function requestBestRoute(request: RoutesRequest) {
    const res = await getRoutes(request);
    if (!res.routes || res.routes.length === 0) {
        throw new Error(NO_ROUTES_ERROR);
    }
    return res.routes[0];
}
