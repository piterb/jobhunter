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
    status: "Interview",
    location: "Remote, USA",
    salary_min: 140000,
    salary_max: 190000,
    url: "https://vercel.com/jobs",
    employment_type: "Full-time",
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
        event_type: "Note",
        content: "Technical Interview: Deep dive into React internals and Next.js App Router.",
        occurred_at: "2024-02-11T14:00:00Z",
        created_at: "2024-02-11T14:00:00Z"
      },
      {
        id: "a2",
        job_id: "1",
        user_id: "mock-user",
        event_type: "Call",
        content: "Recruiter Screen: Discussed compensation and cultural fit.",
        occurred_at: "2024-02-10T11:00:00Z",
        created_at: "2024-02-10T11:00:00Z"
      }
    ]
  },
  {
    id: "2",
    user_id: "mock-user",
    title: "Product Manager",
    company: "Linear",
    status: "Applied",
    location: "San Francisco, CA",
    salary_min: 130000,
    salary_max: 180000,
    url: "https://linear.app/careers",
    employment_type: "Full-time",
    skills_tools: ["Product Management", "Linear", "Figma", "SQL"],
    experience_level: "Mid-Senior",
    contact_person: "Linkin Park",
    contact_email: "recruiting@linear.app",
    contact_linkedin: null,
    contact_phone: null,
    notes: "Building the next generation of issue tracking.",
    applied_at: "2024-02-09T09:00:00Z",
    last_activity: "2024-02-09T09:00:00Z",
    created_at: "2024-02-09T09:00:00Z",
    updated_at: "2024-02-09T09:00:00Z",
    activities: []
  },
  {
    id: "3",
    user_id: "mock-user",
    title: "Data Scientist",
    company: "OpenAI",
    status: "Offer",
    location: "San Francisco, CA",
    salary_min: 200000,
    salary_max: 350000,
    url: "https://openai.com/careers",
    employment_type: "Full-time",
    skills_tools: ["Python", "PyTorch", "LLMs", "TensorFlow"],
    experience_level: "PhD preferred",
    contact_person: "Sam Altman",
    contact_email: "sam@openai.com",
    contact_linkedin: null,
    contact_phone: null,
    notes: "Working on AGI.",
    applied_at: "2024-01-15T10:00:00Z",
    last_activity: "2024-02-12T10:00:00Z",
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-02-12T10:00:00Z",
    activities: []
  },
  {
    id: "4",
    user_id: "mock-user",
    title: "UX Designer",
    company: "Shopify",
    status: "Rejected",
    location: "Remote, Canada",
    salary_min: 90000,
    salary_max: 130000,
    url: "https://shopify.com/careers",
    employment_type: "Contract",
    skills_tools: ["Figma", "Prototyping", "User Research"],
    experience_level: "Mid-level",
    contact_person: null,
    contact_email: null,
    contact_linkedin: null,
    contact_phone: null,
    notes: "E-commerce platform design.",
    applied_at: "2024-02-01T15:00:00Z",
    last_activity: "2024-02-05T10:00:00Z",
    created_at: "2024-02-01T15:00:00Z",
    updated_at: "2024-02-05T10:00:00Z",
    activities: []
  },
  {
    id: "5",
    user_id: "mock-user",
    title: "Software Architect",
    company: "Google",
    status: "Ghosted",
    location: "Mountain View, CA",
    salary_min: 250000,
    salary_max: 400000,
    url: "https://google.com/careers",
    employment_type: "Full-time",
    skills_tools: ["System Design", "Go", "Kubernetes", "Cloud"],
    experience_level: "Staff+",
    contact_person: null,
    contact_email: null,
    contact_linkedin: null,
    contact_phone: null,
    notes: "Large scale distributed systems.",
    applied_at: "2023-12-01T10:00:00Z",
    last_activity: "2023-12-01T10:00:00Z",
    created_at: "2023-12-01T10:00:00Z",
    updated_at: "2023-12-01T10:00:00Z",
    activities: []
  }
];

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  const loadJobs = async (silentUpdateId?: string) => {
    try {
      if (!silentUpdateId) setLoading(true);
      const data = await jobService.getJobs();
      setJobs(data || []);

      // Keep selected job updated if it matches one in the list
      if (selectedJob) {
        const targetId = silentUpdateId || selectedJob.id;
        const updatedSelected = data?.find(j => j.id === targetId);

        if (updatedSelected && (silentUpdateId === targetId || !silentUpdateId)) {
          // Fetch full details again to ensure activities are up to date
          const fullJob = await jobService.getJobById(updatedSelected.id);
          setSelectedJob(fullJob);
        }
      } else if (data && data.length > 0 && !silentUpdateId) {
        setSelectedJob(data[0]);
      }
    } catch (err) {
      console.error("Failed to load jobs:", err);
      if (!silentUpdateId) {
        setJobs(MOCK_JOBS);
        setSelectedJob(MOCK_JOBS[0]);
      }
    } finally {
      if (!silentUpdateId) setLoading(false);
    }
  };

  useEffect(() => {
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
        detailPanel={selectedJob ? (
          <DetailPanel
            job={selectedJob}
            onClose={() => setSelectedJob(null)}
            onActivityAdded={() => loadJobs(selectedJob.id)}
          />
        ) : null}
      >
        <div className="flex flex-col h-full bg-slate-950">
          {/* Toolbar */}
          <div className="h-14 border-b border-slate-800 flex items-center justify-between px-4 sm:px-6 bg-slate-950/30 shrink-0">
            <div className="relative flex-1 max-w-xs group">
              <Search
                size={16}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors"
              />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent border-none text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-0 w-full pl-8 h-full"
              />
            </div>
            <div className="flex items-center gap-2 ml-4">
              <button className="flex items-center gap-2 px-3 py-1.5 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white rounded-md text-xs font-medium transition-colors">
                <Filter size={14} />
                <span className="hidden sm:inline">Filters</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full py-24">
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

            {/* Pagination Footer (Mock) */}
            <div className="h-12 border-t border-slate-800 flex items-center justify-between px-4 sm:px-6 bg-slate-950/30 text-xs shrink-0 sticky bottom-0 z-20 backdrop-blur-sm">
              <span className="text-slate-500 hidden sm:inline">Showing 1-{jobs.length} of {jobs.length} results</span>
              <span className="text-slate-500 sm:hidden">1-{jobs.length} of {jobs.length}</span>
              <div className="flex gap-2">
                <button className="px-3 py-1 rounded border border-slate-800 text-slate-500 hover:text-white hover:border-slate-700 transition-colors" disabled>Prev</button>
                <div className="flex gap-1">
                  <button className="px-3 py-1 rounded bg-indigo-600 text-white border border-indigo-500">1</button>
                </div>
                <button className="px-3 py-1 rounded border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors">Next</button>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
