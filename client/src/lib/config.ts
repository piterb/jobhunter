const prefix = process.env.NEXT_PUBLIC_RESOURCE_PREFIX || 'jobhunter';

export const CONFIG = {
    buckets: {
        documents: `${prefix}_documents`,
        avatars: `${prefix}_avatars`
    }
} as const;
