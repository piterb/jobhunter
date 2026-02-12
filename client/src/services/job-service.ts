import { supabase } from "@/lib/supabase";
import { Job, Activity } from "@/types/job";

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
     * Fetch all jobs for the current user via Express Backend
     */
    async getJobs(): Promise<Job[]> {
        const token = await getAuthToken();

        // For now, if no token, try direct Supabase (might fail RLS)
        // but the user says "API funguje", so they likely want to use the Express API
        if (token) {
            const response = await fetch(`${API_URL}/jobs`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                return response.json();
            }
        }

        // Fallback or if no token yet (useful for initial demo if they are not logged in)
        const { data, error } = await supabase
            .from("jobs")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching jobs from Supabase:", error);
            throw error;
        }

        return data as Job[];
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
    async ingestJob(url: string, token: string): Promise<Job> {
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
    }
};
