import { AuthError } from './errors';
import { AuthContext, AuthPolicyConfig } from './types';

function hasAllScopes(currentScopes: string[], requiredScopes: string[]): boolean {
    const currentSet = new Set(currentScopes);
    return requiredScopes.every((scope) => currentSet.has(scope));
}

export function enforceAuthPolicy(context: AuthContext, policy: AuthPolicyConfig): void {
    if (policy.allowedClientIds.length > 0) {
        if (!context.clientId || !policy.allowedClientIds.includes(context.clientId)) {
            throw new AuthError(403, 'forbidden_client', 'Token client is not allowed for this deployment');
        }
    }

    if (policy.enforceAppClaims) {
        if (context.appId !== policy.expectedAppId) {
            throw new AuthError(403, 'forbidden_app', 'Token app_id does not match this application');
        }

        if (context.appEnv !== policy.expectedAppEnv) {
            throw new AuthError(403, 'forbidden_env', 'Token app_env does not match this environment');
        }
    }

    if (policy.requiredScopes.length > 0 && !hasAllScopes(context.scopes, policy.requiredScopes)) {
        throw new AuthError(403, 'forbidden_scope', 'Token does not include required scopes');
    }
}
