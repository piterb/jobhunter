import crypto from 'crypto';

// -------------------------------------------------------------------------
// REUSABLE MOCK DB & QUERY BUILDER
// -------------------------------------------------------------------------

export const mockDb: Record<string, any[]> = {
    jobs: [],
    activities: [],
    profiles: [],
    ai_usage_logs: [],
};

// Reset function to call in beforeEach
export const resetMockDb = () => {
    mockDb.jobs = [];
    mockDb.activities = [];
    mockDb.profiles = [];
    mockDb.ai_usage_logs = [];
};

// A helper to mimic Supabase's query builder chain
export class MockQueryBuilder {
    private table: string;
    private filters: Array<(item: any) => boolean> = [];
    private updates: any = null;
    private inserts: any[] | null = null;
    private isDelete: boolean = false;
    private sortOptions: { column: string, ascending: boolean } | null = null;
    private singleResult: boolean = false;
    private rangeResult: { start: number, end: number } | null = null;
    private selectCount: 'exact' | null = null;

    constructor(table: string) {
        this.table = table;
    }

    select(columns?: string, options?: { count: 'exact' }) {
        if (options?.count === 'exact') {
            this.selectCount = 'exact';
        }
        return this;
    }

    insert(data: any | any[]) {
        this.inserts = Array.isArray(data) ? data : [data];
        return this;
    }

    update(data: any) {
        this.updates = data;
        return this;
    }

    delete() {
        this.isDelete = true;
        return this;
    }

    eq(column: string, value: any) {
        this.filters.push((item) => item[column] === value);
        return this;
    }

    order(column: string, { ascending = true } = {}) {
        this.sortOptions = { column, ascending };
        return this;
    }

    range(start: number, end: number) {
        this.rangeResult = { start, end };
        return this;
    }

    single() {
        this.singleResult = true;
        return this;
    }

    limit(count: number) {
        if (!this.rangeResult) {
            this.rangeResult = { start: 0, end: count - 1 };
        }
        return this;
    }

    async then(resolve: (res: any) => void, reject: (err: any) => void) {
        try {
            await new Promise((r) => setTimeout(r, 2)); // Tiny delay

            const currentTableData = mockDb[this.table] || [];

            // 1. Handle INSERT
            if (this.inserts) {
                const newRows = this.inserts.map((row) => ({
                    id: row.id || crypto.randomUUID(),
                    created_at: new Date().toISOString(),
                    ...row,
                }));

                if (!mockDb[this.table]) mockDb[this.table] = [];
                mockDb[this.table] = [...(mockDb[this.table] || []), ...newRows];

                const resultData = this.singleResult ? newRows[0] : newRows;
                return resolve({ data: resultData, error: null });
            }

            // 2. Identify target rows (filtering)
            let matchingRows = currentTableData;
            for (const filter of this.filters) {
                matchingRows = matchingRows.filter(filter);
            }

            // Calculate count before pagination if needed
            const totalCount = matchingRows.length;

            // 3. Handle UPDATE
            if (this.updates) {
                const idsToUpdate = new Set(matchingRows.map((r) => r.id));
                const updatedRows: any[] = [];

                mockDb[this.table] = currentTableData.map((row) => {
                    if (idsToUpdate.has(row.id)) {
                        const updated = { ...row, ...this.updates };
                        updatedRows.push(updated);
                        return updated;
                    }
                    return row;
                });

                if (this.singleResult && updatedRows.length === 0) {
                    return resolve({ data: null, error: { code: 'PGRST116', message: 'Not found' } });
                }

                const resultData = this.singleResult ? updatedRows[0] : updatedRows;
                return resolve({ data: resultData, error: null });
            }

            // 4. Handle DELETE
            if (this.isDelete) {
                const idsToDelete = new Set(matchingRows.map((r) => r.id));
                mockDb[this.table] = currentTableData.filter((r) => !idsToDelete.has(r.id));
                return resolve({ data: null, error: null });
            }

            // 5. Handle SELECT (Read)

            // Apply Sorting
            if (this.sortOptions) {
                matchingRows.sort((a, b) => {
                    const valA = a[this.sortOptions!.column];
                    const valB = b[this.sortOptions!.column];
                    if (valA < valB) return this.sortOptions!.ascending ? -1 : 1;
                    if (valA > valB) return this.sortOptions!.ascending ? 1 : -1;
                    return 0;
                });
            }

            // Apply One-off Range (Pagination)
            if (this.rangeResult) {
                // Supabase range is inclusive [start, end]
                matchingRows = matchingRows.slice(this.rangeResult.start, this.rangeResult.end + 1);
            }

            // Validate single() expectation
            if (this.singleResult) {
                if (matchingRows.length === 0) {
                    return resolve({ data: null, error: { code: 'PGRST116', message: 'Not found' } });
                }
                return resolve({ data: matchingRows[0], error: null });
            }

            return resolve({
                data: matchingRows,
                error: null,
                count: this.selectCount === 'exact' ? totalCount : null
            });

        } catch (err: any) {
            reject(err);
        }
    }
}
