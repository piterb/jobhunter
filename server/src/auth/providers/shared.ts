export type JwtPayloadLike = {
    [key: string]: unknown;
    sub?: string;
    aud?: string | string[];
    scope?: string;
};

function valueAsString(value: unknown): string | undefined {
    return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function getStringClaim(payload: JwtPayloadLike, claimName: string): string | undefined {
    return valueAsString(payload[claimName]);
}

export function normalizeAudience(aud: JwtPayloadLike['aud']): string[] {
    if (!aud) return [];
    if (typeof aud === 'string') return [aud];
    if (Array.isArray(aud)) return aud.filter((item): item is string => typeof item === 'string');
    return [];
}

export function normalizeScopes(scope: unknown): string[] {
    if (typeof scope !== 'string') return [];
    return scope.split(' ').map((item) => item.trim()).filter(Boolean);
}

export function normalizeStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === 'string');
}

export function mergeUnique(values: string[][]): string[] {
    return [...new Set(values.flat().filter(Boolean))];
}
