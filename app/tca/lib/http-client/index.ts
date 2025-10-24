import type { z } from "zod";

export interface HttpConfig {
    baseUrl: string;
    getAuthHeaders?: () => Record<string, string>;
}

type HttpMethod = "GET" | "POST";

async function request<TRequest extends z.ZodTypeAny | undefined, TResponse extends z.ZodTypeAny>(
    config: HttpConfig,
    method: HttpMethod,
    path: string,
    responseSchema: TResponse,
    requestSchema?: TRequest,
    body?: z.input<TRequest>,
): Promise<z.output<TResponse>> {
    const urlPath = path.startsWith("/") ? path.slice(1) : path;
    const url = new URL(urlPath, config.baseUrl);

    const fetchOptions: RequestInit = {
        headers: {
            ...(config.getAuthHeaders ? config.getAuthHeaders() : {}),
        },
        method,
    };

    if (requestSchema && body !== undefined) {
        const parsedBody = requestSchema.parse(body);
        fetchOptions.body = JSON.stringify(parsedBody);
        fetchOptions.headers = {
            "Content-Type": "application/json",
            ...fetchOptions.headers,
        };
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
        throw new Error(`Failed to fetch ${path}: ${response.statusText}`);
    }

    const json = await response.json();
    return responseSchema.parse(json);
}

export const http = {
    get: <TResponse extends z.ZodTypeAny>(
        config: HttpConfig,
        path: string,
        responseSchema: TResponse,
    ): Promise<z.output<TResponse>> => {
        return request(config, "GET", path, responseSchema);
    },

    post: <TRequest extends z.ZodTypeAny, TResponse extends z.ZodTypeAny>(
        config: HttpConfig,
        path: string,
        requestSchema: TRequest,
        responseSchema: TResponse,
        body: z.input<TRequest>,
    ): Promise<z.output<TResponse>> => {
        return request(config, "POST", path, responseSchema, requestSchema, body);
    },
};
