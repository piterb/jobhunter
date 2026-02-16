import { vi } from 'vitest';
import crypto from 'crypto';

export const mockStore: Record<string, any[]> = {
    jobs: [],
    activities: [],
    profiles: [],
    documents: [],
    ai_usage_logs: [],
};

export const resetMockStore = () => {
    mockStore.jobs = [];
    mockStore.activities = [];
    mockStore.profiles = [];
    mockStore.documents = [];
    mockStore.ai_usage_logs = [];
};

type Fragment = { __sql_fragment: true; query: string; values: any[] };

const isTemplateCall = (arg: any): arg is TemplateStringsArray =>
    Array.isArray(arg) && Object.prototype.hasOwnProperty.call(arg, 'raw');
const isFragment = (arg: any): arg is Fragment => !!arg && typeof arg === 'object' && arg.__sql_fragment === true;

const getBoundValue = (strings: TemplateStringsArray, values: any[], pattern: RegExp, occurrence = 1) => {
    let seen = 0;
    for (let i = 0; i < strings.length - 1; i++) {
        if (pattern.test(strings[i].toLowerCase())) {
            seen += 1;
            if (seen === occurrence) {
                return values[i];
            }
        }
    }
    return undefined;
};

const firstString = (v: any) => (typeof v === 'string' ? v : undefined);
const toNumber = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
};

const applyCommonFilters = (rows: any[], strings: TemplateStringsArray, values: any[]) => {
    let data = [...rows];

    const id = firstString(getBoundValue(strings, values, /(^|[^a-z_])id\s*=/));
    const userId = firstString(getBoundValue(strings, values, /user_id\s*=/));
    const jobId = firstString(getBoundValue(strings, values, /job_id\s*=/));

    if (id) data = data.filter((r) => r.id === id);
    if (userId) data = data.filter((r) => r.user_id === userId || r.id === userId);
    if (jobId) data = data.filter((r) => r.job_id === jobId);

    return data;
};

const handleQuery = (strings: TemplateStringsArray, values: any[]) => {
    const query = strings.join('?').trim();
    const queryLower = query.toLowerCase();

    if (queryLower.includes('sum(coalesce(tokens_input')) {
        const rows = applyCommonFilters(mockStore.ai_usage_logs, strings, values);
        const total = rows.reduce((acc, row) => acc + (row.tokens_input || 0) + (row.tokens_output || 0), 0);
        const avg = rows.length
            ? rows.reduce((acc, row) => acc + (row.latency_ms || 0), 0) / rows.length
            : 0;
        return [{ total_tokens: String(total), avg_latency: String(avg) }];
    }

    if (queryLower.startsWith('select count(*)')) {
        const tableMatch = queryLower.match(/from\s+(\w+)/);
        if (!tableMatch) return [{ count: '0' }];
        const table = tableMatch[1];
        const rows = applyCommonFilters(mockStore[table] || [], strings, values);
        return [{ count: String(rows.length) }];
    }

    if (queryLower.startsWith('select')) {
        const tableMatch = queryLower.match(/from\s+(\w+)/);
        if (!tableMatch) return [];
        const table = tableMatch[1];
        let rows = applyCommonFilters(mockStore[table] || [], strings, values);

        if (queryLower.includes("doc_type = 'resume'")) {
            rows = rows.filter((r) => String(r.doc_type || '').toLowerCase() === 'resume');
        }

        if (queryLower.includes('order by occurred_at desc')) {
            rows.sort((a, b) => String(b.occurred_at || '').localeCompare(String(a.occurred_at || '')));
        }
        if (queryLower.includes('order by created_at desc')) {
            rows.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
        }
        if (queryLower.includes('order by is_primary desc')) {
            rows.sort((a, b) => Number(!!b.is_primary) - Number(!!a.is_primary));
        }

        const limit = toNumber(getBoundValue(strings, values, /limit\s*$/));
        const offset = toNumber(getBoundValue(strings, values, /offset\s*$/)) ?? 0;
        if (limit !== undefined) {
            rows = rows.slice(offset, offset + limit);
        }

        return rows;
    }

    if (queryLower.startsWith('insert into')) {
        const tableMatch = queryLower.match(/into\s+(\w+)/);
        if (!tableMatch) return [];
        const table = tableMatch[1];

        let data: Record<string, any> = {};

        if (values.length && values[0] && typeof values[0] === 'object' && !isFragment(values[0])) {
            data = values[0];
        } else {
            const columnsMatch = query.match(/insert into\s+\w+\s*\(([^)]+)\)/i);
            if (columnsMatch) {
                const columns = columnsMatch[1].split(',').map((c) => c.trim());
                data = Object.fromEntries(columns.map((col, idx) => [col, values[idx]]));
            }
        }

        const newRow = {
            id: data.id || crypto.randomUUID(),
            created_at: data.created_at || new Date().toISOString(),
            ...data
        };

        if (!mockStore[table]) mockStore[table] = [];
        mockStore[table].push(newRow);
        return [newRow];
    }

    if (queryLower.startsWith('update')) {
        const tableMatch = queryLower.match(/update\s+(\w+)/);
        if (!tableMatch) return [];
        const table = tableMatch[1];

        let updates = values[0];
        if (isFragment(updates) || updates === undefined || typeof updates !== 'object') {
            updates = {};
        }

        if (queryLower.includes('set last_activity = now()')) {
            updates = { ...updates, last_activity: new Date().toISOString() };
        }
        if (queryLower.includes('set avatar_url =')) {
            const avatarUrl = getBoundValue(strings, values, /set avatar_url\s*=/);
            updates = { ...updates, avatar_url: avatarUrl, updated_at: new Date().toISOString() };
        }

        const rows = mockStore[table] || [];
        const filtered = applyCommonFilters(rows, strings, values);
        const ids = new Set(filtered.map((r) => r.id));

        const updated: any[] = [];
        mockStore[table] = rows.map((row) => {
            if (ids.has(row.id)) {
                const next = { ...row, ...updates };
                updated.push(next);
                return next;
            }
            return row;
        });

        return updated;
    }

    if (queryLower.startsWith('delete from')) {
        const tableMatch = queryLower.match(/from\s+(\w+)/);
        if (!tableMatch) return { count: 0 };
        const table = tableMatch[1];
        const rows = mockStore[table] || [];
        const filtered = applyCommonFilters(rows, strings, values);
        const ids = new Set(filtered.map((r) => r.id));
        mockStore[table] = rows.filter((r) => !ids.has(r.id));
        return { count: filtered.length };
    }

    return [];
};

export const sqlMock: any = vi.fn((strings: TemplateStringsArray | string, ...values: any[]) => {
    if (!isTemplateCall(strings)) {
        if (typeof strings === 'string') {
            return { __sql_fragment: true, query: strings.toLowerCase(), values } as Fragment;
        }
        return { __sql_fragment: true, query: '', values } as Fragment;
    }

    const query = strings.join('?').trim().toLowerCase();

    if (!query.startsWith('select') && !query.startsWith('insert') && !query.startsWith('update') && !query.startsWith('delete')) {
        return { __sql_fragment: true, query, values } as Fragment;
    }

    return Promise.resolve(handleQuery(strings, values));
});

sqlMock.begin = vi.fn(async (fn: Function) => await fn(sqlProxy));
sqlMock.unsafe = vi.fn((q: string, p: any[]) => sqlMock([q] as any, ...(p || [])));
sqlMock.val = (obj: any) => obj;

const sqlProxy = new Proxy(sqlMock, {
    apply(target, thisArg, argumentsList) {
        if (argumentsList.length === 1 && typeof argumentsList[0] === 'object' && !Array.isArray(argumentsList[0]) && !isTemplateCall(argumentsList[0])) {
            return argumentsList[0];
        }
        return target.apply(thisArg, argumentsList);
    }
});

export default sqlProxy;
