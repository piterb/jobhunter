import { authService } from "./auth-service";
import { Job, Activity, PaginatedJobs, IngestedJobResponse } from "@/types/job";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

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
        const token = authService.getToken();
        if (!token) throw new Error("Not authenticated");

        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            sort: sort,
            order: order
        });
        if (search) queryParams.append('search', search);

        const response = await fetch(`${API_URL}/jobs?${queryParams}`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch jobs: ${response.statusText}`);
        }
        return response.json();
    },

    /**
     * Fetch a single job by ID with its activities
     */
    async getJobById(id: string): Promise<Job> {
        const token = authService.getToken();
        if (!token) throw new Error("Not authenticated");

        // 1. Fetch Job
        const jobRes = await fetch(`${API_URL}/jobs/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!jobRes.ok) throw new Error("Job not found");

        const job = await jobRes.json();

        // 2. Fetch Activities
        const actRes = await fetch(`${API_URL}/jobs/${id}/activities`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (actRes.ok) {
            job.activities = await actRes.json();
        }
        return job;
    },

    /**
     * Smart Ingest a job from URL via Express Backend
     */
    async ingestJob(url: string, token: string): Promise<IngestedJobResponse> {
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
        const token = authService.getToken();
        if (!token) throw new Error("Not authenticated");

        const response = await fetch(`${API_URL}/jobs/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status }),
        });

        if (!response.ok) {
            throw new Error("Failed to update status");
        }
    },

    /**
     * Update a job
     */
    async updateJob(id: string, jobData: Partial<Job>): Promise<Job> {
        const token = authService.getToken();
        if (!token) throw new Error("Not authenticated");

        const response = await fetch(`${API_URL}/jobs/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(jobData),
        });

        if (!response.ok) {
            throw new Error("Failed to update job");
        }
        return response.json();
    },

    /**
     * Create a new job manually
     */
    async createJob(jobData: Partial<Job>): Promise<Job> {
        const token = authService.getToken();
        if (!token) throw new Error("Not authenticated");

        const response = await fetch(`${API_URL}/jobs`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(jobData),
        });

        if (!response.ok) {
            throw new Error("Failed to create job");
        }
        return response.json();
    },

    /**
     * Add a new activity to a job
     */
    async addActivity(jobId: string, activity: Partial<Activity>): Promise<Activity> {
        const token = authService.getToken();
        if (!token) throw new Error("Not authenticated");

        const response = await fetch(`${API_URL}/jobs/${jobId}/activities`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(activity),
        });

        if (!response.ok) {
            throw new Error("Failed to add activity");
        }
        return response.json();
    },

    /**
     * Delete a job
     */
    async deleteJob(id: string): Promise<void> {
        const token = authService.getToken();
        if (!token) throw new Error("Not authenticated");

        const response = await fetch(`${API_URL}/jobs/${id}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error("Failed to delete job");
        }
    }
};
