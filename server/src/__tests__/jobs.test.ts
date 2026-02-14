import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';

// -------------------------------------------------------------------------
// 1. MOCK DATA STORE & SUPABASE CLIENT
// -------------------------------------------------------------------------

// We'll store our data here in memory.
// It's a simple object map: { 'jobs': [...], 'users': [...] }
let mockDb: Record<string, any[]> = {
    jobs: []
};

// A helper to mimic Supabase's query builder chain
class MockQueryBuilder {
    private table: string;
    private filters: Array<(item: any) => boolean> = [];
    private updates: any = null;
    private inserts: any[] | null = null;
    private isDelete: boolean = false;
    private sortOptions: { column: string, ascending: boolean } | null = null;
    private singleResult: boolean = false;

    constructor(table: string) {
        this.table = table;
    }

    select(_columns?: string) {
        // In this mock, we always return all columns '*'
        // Does not support column filtering yet, but API usually selects *
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

    single() {
        this.singleResult = true;
        return this;
    }

    range(_from: number, _to: number) {
        // We'll just ignore range in the simple mock or we could implement it
        // For now, let's just return our data since we usually have small datasets in tests
        return this;
    }

    // Checking if the response should be an error or success
    async then(resolve: (res: any) => void, reject: (err: any) => void) {
        try {
            // Simulate async delay
            await new Promise((r) => setTimeout(r, 5));

            const currentTableData = mockDb[this.table] || [];

            // 1. Handle INSERT
            if (this.inserts) {
                const newRows = this.inserts.map((row) => ({
                    id: row.id || crypto.randomUUID(),
                    created_at: new Date().toISOString(),
                    // Default user_id if not present?? typically enforcing foreign key constraints
                    // We'll just take what's given.
                    ...row,
                }));

                // Update the main DB store
                mockDb[this.table] = [...currentTableData, ...newRows];

                // Return data
                const resultData = this.singleResult ? newRows[0] : newRows;
                return resolve({ data: resultData, error: null });
            }

            // 2. Identify target rows (filtering)
            // We start with all data and apply filters
            let matchingRows = currentTableData;
            for (const filter of this.filters) {
                matchingRows = matchingRows.filter(filter);
            }

            // 3. Handle UPDATE
            if (this.updates) {
                const idsToUpdate = new Set(matchingRows.map((r) => r.id));
                const updatedRows: any[] = [];

                // Update the main DB store
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

                // If asking for single result, return the first updated item
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
                // Determine type of sort (string vs number)
                matchingRows.sort((a, b) => {
                    const valA = a[this.sortOptions!.column];
                    const valB = b[this.sortOptions!.column];

                    if (valA < valB) return this.sortOptions!.ascending ? -1 : 1;
                    if (valA > valB) return this.sortOptions!.ascending ? 1 : -1;
                    return 0;
                });
            }

            const totalCount = matchingRows.length;

            // Validate single() expectation
            if (this.singleResult) {
                if (matchingRows.length === 0) {
                    return resolve({ data: null, count: 0, error: { code: 'PGRST116', message: 'Not found' } });
                }
                return resolve({ data: matchingRows[0], count: 1, error: null });
            }

            return resolve({ data: matchingRows, count: totalCount, error: null });

        } catch (err: any) {
            reject(err);
        }
    }
}

// -------------------------------------------------------------------------
// 2. MOCK AUTH MIDDLEWARE
// -------------------------------------------------------------------------
const MOCK_USER_ID = 'test-user-123';
const MOCK_USER_EMAIL = 'test@example.com';

// Important: We must mock the module before importing app
vi.mock('../middleware/auth', () => ({
    authMiddleware: (req: any, res: any, next: any) => {
        // Inject a consistent test user
        req.user = { id: MOCK_USER_ID, email: MOCK_USER_EMAIL };
        next();
    }
}));

// -------------------------------------------------------------------------
// 3. MOCK SUPABASE MODULE
// -------------------------------------------------------------------------
vi.mock('../config/supabase', () => ({
    // createSupabaseUserClient returns our Mock Query Builder
    createSupabaseUserClient: vi.fn(() => ({
        from: (table: string) => new MockQueryBuilder(table),
    })),
    // If these are used elsewhere, mock them too
    supabaseAdmin: {
        from: (table: string) => new MockQueryBuilder(table),
    },
    supabase: {
        from: (table: string) => new MockQueryBuilder(table),
    }
}));

// Import app AFTER mocks are set up
import app from '../app';

// -------------------------------------------------------------------------
// 4. THE TESTS
// -------------------------------------------------------------------------
describe('Jobs API (Unit Tests / Isolated Integration)', () => {

    beforeEach(() => {
        // Reset the in-memory DB before each test
        mockDb = { jobs: [] };
    });

    const validJob = {
        title: 'Senior Developer',
        company: 'Tech Corp',
        url: 'https://example.com/job/123',
        location: 'Remote',
        status: 'Applied',
        salary_min: 100000,
        salary_max: 150000,
        notes: 'Great opportunity',
        // user_id is injected by controller
    };

    describe('POST /api/v1/jobs', () => {
        it('should create a new job successfully', async () => {
            const response = await request(app)
                .post('/api/v1/jobs')
                .send(validJob);

            if (response.status !== 201) {
                console.error('Test failed with:', response.body);
            }

            expect(response.status).toBe(201);
            expect(response.body.title).toBe(validJob.title);
            expect(response.body.id).toBeDefined();
            // The controller injects the user_id from the auth token
            expect(response.body.user_id).toBe(MOCK_USER_ID);

            // Verify it's in our mock DB
            expect(mockDb.jobs).toHaveLength(1);
            expect(mockDb.jobs[0].title).toBe(validJob.title);
        });

        it('should validate required fields', async () => {
            const invalidJob = { ...validJob };
            delete (invalidJob as any).url; // url is required by schema

            const response = await request(app)
                .post('/api/v1/jobs')
                .send(invalidJob);

            // Zod validation failure
            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/v1/jobs', () => {
        it('should list all jobs for the current user', async () => {
            // Seed our mock DB directly
            mockDb.jobs = [
                { ...validJob, id: 'job-1', title: 'Job A', user_id: MOCK_USER_ID, created_at: '2023-01-01' },
                { ...validJob, id: 'job-2', title: 'Job B', user_id: MOCK_USER_ID, created_at: '2023-01-02' },
                // Job for another user
                { ...validJob, id: 'job-3', title: 'Other User Job', user_id: 'other-user', created_at: '2023-01-03' }
            ];

            const response = await request(app).get('/api/v1/jobs');

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(2); // Only MOCK_USER_ID jobs
            const ids = response.body.data.map((j: any) => j.id);
            expect(ids).toContain('job-1');
            expect(ids).toContain('job-2');
            expect(ids).not.toContain('job-3');
            expect(response.body.count).toBe(2);
            expect(response.body.totalPages).toBeDefined();
        });

        it('should sort jobs by creation date', async () => {
            mockDb.jobs = [
                { ...validJob, id: 'job-1', created_at: '2023-01-01', user_id: MOCK_USER_ID },
                { ...validJob, id: 'job-2', created_at: '2023-01-02', user_id: MOCK_USER_ID }
            ];

            const response = await request(app).get('/api/v1/jobs?sort=created_at&order=desc');
            expect(response.status).toBe(200);
            expect(response.body.data[0].id).toBe('job-2');
            expect(response.body.data[1].id).toBe('job-1');
        });
    });

    describe('GET /api/v1/jobs/:id', () => {
        it('should retrieve a single job', async () => {
            mockDb.jobs.push({ ...validJob, id: 'job-123', user_id: MOCK_USER_ID });

            const response = await request(app).get('/api/v1/jobs/job-123');
            expect(response.status).toBe(200);
            expect(response.body.id).toBe('job-123');
        });

        it('should return 404 if job does not exist', async () => {
            const response = await request(app).get('/api/v1/jobs/non-existent-id');
            expect(response.status).toBe(404);
        });
    });

    describe('PUT /api/v1/jobs/:id', () => {
        it('should update a job', async () => {
            mockDb.jobs.push({ ...validJob, id: 'job-123', user_id: MOCK_USER_ID });

            const updates = { title: 'Updated Title', status: 'Interview' };
            const response = await request(app)
                .put('/api/v1/jobs/job-123')
                .send(updates);

            expect(response.status).toBe(200);
            expect(response.body.title).toBe('Updated Title');
            expect(response.body.status).toBe('Interview');

            // Check DB
            expect(mockDb.jobs[0].title).toBe('Updated Title');
        });
    });

    describe('DELETE /api/v1/jobs/:id', () => {
        it('should delete a job and return 204', async () => {
            mockDb.jobs.push({ ...validJob, id: 'job-123', user_id: MOCK_USER_ID });

            const response = await request(app).delete('/api/v1/jobs/job-123');
            expect(response.status).toBe(204);

            expect(mockDb.jobs).toHaveLength(0);
        });
    });

});
