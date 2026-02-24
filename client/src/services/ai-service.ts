import { authService } from "./auth-service";
import { AIUsageLog, PaginatedAILogs } from "shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

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
        const token = authService.getToken();
        if (!token) throw new Error("Not authenticated");

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

        if (!response.ok) {
            throw new Error("Failed to fetch AI logs");
        }

        return response.json();
    },

    async generateCoverLetter(jobId: string, customInstructions?: string, dryRun: boolean = false): Promise<string> {
        const token = authService.getToken();
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
