import sql from '../config/db';
import { AuthError } from './errors';
import { AuthContext } from './types';

type ProfileIdentity = {
    id: string;
    email: string;
    auth_subject: string | null;
};

function normalizeEmail(email?: string): string | undefined {
    if (!email) return undefined;
    const normalized = email.trim().toLowerCase();
    return normalized.length > 0 ? normalized : undefined;
}

function buildFallbackEmail(subject: string): string {
    const slug = subject.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 48) || 'unknown';
    return `${slug}@idp.local`;
}

function extractNameFields(authContext: AuthContext): { firstName?: string; lastName?: string; fullName?: string } {
    const claims = authContext.rawClaims;
    const firstName = typeof claims.given_name === 'string' ? claims.given_name : undefined;
    const lastName = typeof claims.family_name === 'string' ? claims.family_name : undefined;
    const fullName = typeof claims.name === 'string'
        ? claims.name
        : [firstName, lastName].filter(Boolean).join(' ') || undefined;
    return { firstName, lastName, fullName };
}

async function findByAuthSubject(subject: string): Promise<ProfileIdentity | undefined> {
    const [profile] = await sql<ProfileIdentity[]>`
        SELECT id, email, auth_subject
        FROM profiles
        WHERE auth_subject = ${subject}
        LIMIT 1
    `;
    return profile;
}

export async function resolveProfileIdentity(authContext: AuthContext): Promise<ProfileIdentity> {
    const subject = authContext.subject || authContext.userId;
    if (!subject) {
        throw new AuthError(401, 'invalid_token', 'Token does not include subject claim');
    }

    const normalizedEmail = normalizeEmail(authContext.email);

    // 1) Primary lookup by provider subject
    const bySubject = await findByAuthSubject(subject);
    if (bySubject) return bySubject;

    // 2) First-time user: create profile with new internal UUID and bind auth_subject
    const fallbackEmail = normalizedEmail || buildFallbackEmail(subject);
    const { firstName, lastName, fullName } = extractNameFields(authContext);

    try {
        const [created] = await sql<ProfileIdentity[]>`
            INSERT INTO profiles (email, auth_subject, first_name, last_name, full_name)
            VALUES (${fallbackEmail}, ${subject}, ${firstName || null}, ${lastName || null}, ${fullName || null})
            RETURNING id, email, auth_subject
        `;

        if (!created) {
            throw new AuthError(500, 'identity_resolution_failed', 'Failed to create profile for authenticated identity');
        }

        return created;
    } catch (error: unknown) {
        // Handle races: if another request created the profile in parallel.
        const raceBySubject = await findByAuthSubject(subject);
        if (raceBySubject) return raceBySubject;

        if (error instanceof AuthError) throw error;
        throw new AuthError(500, 'identity_resolution_failed', 'Could not resolve internal profile identity');
    }
}
