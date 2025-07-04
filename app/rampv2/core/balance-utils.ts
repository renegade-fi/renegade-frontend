export function balanceKey(chainId: number, token: string): string {
    return `${chainId}-${token.toLowerCase()}`;
}
