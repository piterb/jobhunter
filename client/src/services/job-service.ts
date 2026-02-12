import { supabase } from "@/lib/supabase";
import { Job, Activity, PaginatedJobs } from "@/types/job";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

/**
 * Helper to get the current session token
 */
async function getAuthToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
}

export const jobService = {
    /**
     * Fetch all jobs for the current user via Express Backend with pagination
     */
    async getJobs(
        page: number = 1,
        limit: number = 10,
        sort: string = 'created_at',
        order: 'asc' | 'desc' = 'desc',
        search?: string
    ): Promise<PaginatedJobs> {
        const token = await getAuthToken();

        // For now, if no token, try direct Supabase (might fail RLS)
        // but the user says "API funguje", so they likely want to use the Express API
        if (token) {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                sort: sort,
                order: order
            });
            if (search) queryParams.append('search', search);

            const response = await fetch(`${API_URL}/jobs?${queryParams}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                return response.json();
            }
        }

        // Fallback or if no token yet (useful for initial demo if they are not logged in)
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let query = supabase
            .from("jobs")
            .select("*", { count: 'exact' });

        if (search) {
            const searchTerm = `%${search}%`;
            query = query.or(`title.ilike.${searchTerm},company.ilike.${searchTerm},location.ilike.${searchTerm},notes.ilike.${searchTerm}`);
        }

        const { data, count, error } = await query
            .order(sort as any, { ascending: order === 'asc' })
            .range(from, to);

        if (error) {
            console.error("Error fetching jobs from Supabase:", error);
            throw error;
        }

        return {
            data: data as Job[],
            count: count || 0,
            page,
            limit,
            totalPages: count ? Math.ceil(count / limit) : 0
        };
    },

    /**
     * Fetch a single job by ID with its activities
     */
    async getJobById(id: string): Promise<Job> {
        const token = await getAuthToken();

        if (token) {
            // 1. Fetch Job
            const jobRes = await fetch(`${API_URL}/jobs/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (jobRes.ok) {
                const job = await jobRes.json();

                // 2. Fetch Activities (since Express routes separate them)
                const actRes = await fetch(`${API_URL}/jobs/${id}/activities`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (actRes.ok) {
                    job.activities = await actRes.json();
                }
                return job;
            }
        }

        // Fallback to direct Supabase
        const { data, error } = await supabase
            .from("jobs")
            .select(`
        *,
        activities (*)
      `)
            .eq("id", id)
            .single();

        if (error) {
            console.error("Error fetching job details:", error);
            throw error;
        }

        return data as Job;
    },

    /**
     * Smart Ingest a job from URL via Express Backend
     */
    async ingestJob(url: string, token: string): Promise<any> {
        const response = await fetch(`${API_URL}/ingest`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ url }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to ingest job");
        }

        return response.json();
    },

    /**
     * Update job status
     */
    async updateJobStatus(id: string, status: string): Promise<void> {
        const token = await getAuthToken();

        if (token) {
            const response = await fetch(`${API_URL}/jobs/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status }),
            });
            if (response.ok) return;
        }

        // Fallback
        const { error } = await supabase
            .from("jobs")
            .update({ status, updated_at: new Date().toISOString() })
            .eq("id", id);

        if (error) {
            console.error("Error updating job status:", error);
            throw error;
        }
    },

    /**
     * Update a job
     */
    async updateJob(id: string, jobData: Partial<Job>): Promise<Job> {
        const token = await getAuthToken();

        if (token) {
            const response = await fetch(`${API_URL}/jobs/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(jobData),
            });
            if (response.ok) {
                return response.json();
            }
        }

        // Fallback: Update directly in Supabase
        const { data, error } = await supabase
            .from("jobs")
            .update({
                ...jobData,
                updated_at: new Date().toISOString()
            })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("Error updating job:", error);
            throw error;
        }

        return data as Job;
    },

    /**
     * Create a new job manually
     */
    async createJob(jobData: Partial<Job>): Promise<Job> {
        const token = await getAuthToken();

        if (token) {
            const response = await fetch(`${API_URL}/jobs`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(jobData),
            });

            if (response.ok) {
                return response.json();
            }
        }

        // Fallback: Create directly in Supabase
        const { data, error } = await supabase
            .from("jobs")
            .insert([{
                ...jobData,
                status: jobData.status || "Saved",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) {
            console.error("Error creating job:", error);
            throw error;
        }

        return data as Job;
    },

    /**
     * Add a new activity to a job
     */
    async addActivity(jobId: string, activity: Partial<Activity>): Promise<Activity> {
        const token = await getAuthToken();

        if (token) {
            const response = await fetch(`${API_URL}/jobs/${jobId}/activities`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(activity),
            });

            if (response.ok) {
                return response.json();
            }
        }

        // Fallback: Create directly in Supabase
        const { data, error } = await supabase
            .from("activities")
            .insert([{
                ...activity,
                job_id: jobId,
                occurred_at: activity.occurred_at || new Date().toISOString(),
            }])
            .select()
            .single();

        if (error) {
            console.error("Error adding activity:", error);
            throw error;
        }

        return data as Activity;
    },

    /**
     * Delete a job
     */
    async deleteJob(id: string): Promise<void> {
        const token = await getAuthToken();

        if (token) {
            const response = await fetch(`${API_URL}/jobs/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) return;
        }

        // Fallback: Delete directly in Supabase
        const { error } = await supabase
            .from("jobs")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("Error deleting job:", error);
            throw error;
        }
    }
};
