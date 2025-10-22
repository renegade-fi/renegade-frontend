export interface HttpConfig {
    baseUrl: string;
    getAuthHeaders?: () => Record<string, string>;
}
