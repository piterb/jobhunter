import { supabase } from "@/lib/supabase";
import { AIUsageLog, PaginatedAILogs } from "shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

/**
 * Helper to get the current session token
 */
async function getAuthToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
}

export const aiService = {
    /**
     * Fetch all AI logs for the current user via Express Backend with pagination
     */
    async getLogs(
        page: number = 1,
        limit: number = 10,
        feature?: string,
        status?: string
    ): Promise<PaginatedAILogs> {
        const token = await getAuthToken();

        if (token) {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });
            if (feature) queryParams.append('feature', feature);
            if (status) queryParams.append('status', status);

            const response = await fetch(`${API_URL}/ai-logs?${queryParams}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                return response.json();
            }
        }

        // Fallback to direct Supabase
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let query = supabase
            .from("ai_usage_logs")
            .select("*", { count: 'exact' });

        if (feature) {
            query = query.eq('feature', feature);
        }

        if (status) {
            query = query.eq('status', status);
        }

        const { data, count, error } = await query
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) {
            console.error("Error fetching AI logs from Supabase:", error);
            throw error;
        }

        return {
            data: data as AIUsageLog[],
            count: count || 0,
            page,
            limit,
            totalPages: count ? Math.ceil(count / limit) : 0,
            totalTokens: 0,
            avgLatency: 0
        };
    },
    async generateCoverLetter(jobId: string, customInstructions?: string, dryRun: boolean = false): Promise<string> {
        const token = (await supabase.auth.getSession()).data.session?.access_token;
        if (!token) throw new Error("Not authenticated");

        const response = await fetch(`${API_URL}/generate/cover-letter`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ jobId, customInstructions, dryRun })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to generate cover letter');
        }

        const data = await response.json();
        return data.content;
    }
};
