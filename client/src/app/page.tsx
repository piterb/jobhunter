"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { JobTable } from "@/components/dashboard/job-table";
import { DetailPanel } from "@/components/dashboard/detail-panel/detail-panel";
import { Job } from "@/types/job";
import { Search, Filter, Loader2 } from "lucide-react";
import { jobService } from "@/services/job-service";
import { ProtectedRoute } from "@/components/auth/protected-route";

// Realistic Mock data (fallback) matches aligned Job type
const MOCK_JOBS: Job[] = [
  {
    id: "1",
    user_id: "mock-user",
    title: "Senior Frontend Engineer",
    company: "Vercel",
    status: "interview",
    location: "Remote",
    salary_min: 140000,
    salary_max: 190000,
    url: "https://vercel.com/jobs",
    skills_tools: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
    experience_level: "Senior (5+ years)",
    contact_person: "Guillermo Rauch",
    contact_email: "guillermo@vercel.com",
    contact_linkedin: "https://linkedin.com/in/rauchg",
    contact_phone: null,
    notes: "Join the team that builds the world's most popular web framework. We are looking for engineers who care about performance and DX.",
    applied_at: "2024-02-10T10:00:00Z",
    last_activity: "2024-02-11T12:00:00Z",
    created_at: "2024-02-10T10:00:00Z",
    updated_at: "2024-02-11T12:00:00Z",
    activities: [
      {
        id: "a1",
        job_id: "1",
        user_id: "mock-user",
        event_type: "interview",
        content: "Technical Interview: Deep dive into React internals and Next.js App Router.",
        occurred_at: "2024-02-11T14:00:00Z",
        created_at: "2024-02-11T14:00:00Z"
      },
      {
        id: "a2",
        job_id: "1",
        user_id: "mock-user",
        event_type: "call",
        content: "Recruiter Screen: Discussed compensation and cultural fit.",
        occurred_at: "2024-02-10T11:00:00Z",
        created_at: "2024-02-10T11:00:00Z"
      }
    ]
  }
];

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadJobs() {
      try {
        setLoading(true);
        const data = await jobService.getJobs();
        setJobs(data || []);
        if (data && data.length > 0) {
          setSelectedJob(data[0]);
        } else {
          setSelectedJob(null);
        }
      } catch (err) {
        console.error("Failed to load jobs:", err);
        // On error, we can still show mock data for demo purposes, 
        // or just show an empty list. Let's keep mock data for now 
        // until they have the first real job.
        setJobs(MOCK_JOBS);
        setSelectedJob(MOCK_JOBS[0]);
      } finally {
        setLoading(false);
      }
    }
    loadJobs();
  }, []);

  const handleSelectJob = async (job: Job) => {
    setSelectedJob(job);
    try {
      const fullJob = await jobService.getJobById(job.id);
      setSelectedJob(fullJob);
    } catch (err) {
      console.error("Failed to load job details:", err);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell
        detailPanel={
          <DetailPanel
            job={selectedJob}
            onClose={() => setSelectedJob(null)}
          />
        }
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white mb-1">
                Applications
              </h1>
              <p className="text-sm text-slate-400">
                Manage and track your active job search.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
                  <Search size={16} />
                </div>
                <input
                  type="text"
                  placeholder="Search jobs..."
                  className="h-9 w-64 bg-slate-900 border border-slate-800 rounded-md pl-9 pr-4 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
              <button className="flex items-center gap-2 h-9 px-3 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-md text-sm font-medium transition-colors">
                <Filter size={16} />
                Filters
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 bg-slate-900 border border-slate-800 rounded-xl">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
              <p className="text-slate-400">Loading your applications...</p>
            </div>
          ) : (
            <JobTable
              jobs={jobs}
              onSelectJob={handleSelectJob}
              selectedJobId={selectedJob?.id}
            />
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
