"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { JobTable } from "@/components/dashboard/job-table";
import { DetailPanel } from "@/components/dashboard/detail-panel/detail-panel";
import { Job, JobStatus } from "@/types/job";
import { Search, Loader2 } from "lucide-react";
import { jobService } from "@/services/job-service";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { AddJobModal } from "@/components/dashboard/add-job-modal";

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Ref to track selected job without triggering infinite loops in useCallback
  const selectedJobRef = useRef<Job | null>(null);
  useEffect(() => {
    selectedJobRef.current = selectedJob;
  }, [selectedJob]);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const pageSize = 10;

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page on search change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery]);

  const loadJobs = useCallback(async (silentUpdateId?: string, page: number = currentPage) => {
    try {
      if (!silentUpdateId) setLoading(true);
      if (!silentUpdateId) setLoadError(null);
      const response = await jobService.getJobs(
        page,
        pageSize,
        sortField,
        sortOrder,
        debouncedSearchQuery
      );

      const newJobs = response.data;
      const count = response.count;
      const pages = response.totalPages;

      setJobs(newJobs || []);
      setTotalCount(count);
      setTotalPages(pages);

      // Keep selected job updated if it matches one in the list
      const currentSelected = selectedJobRef.current;
      if (currentSelected) {
        const targetId = silentUpdateId || currentSelected.id;
        const updatedSelected = newJobs?.find((j: Job) => j.id === targetId);

        if (updatedSelected && (silentUpdateId === targetId || !silentUpdateId)) {
          // Fetch full details again to ensure activities are up to date
          const fullJob = await jobService.getJobById(updatedSelected.id);
          setSelectedJob(fullJob);
        }
      } else if (newJobs && newJobs.length > 0 && !silentUpdateId) {
        setSelectedJob(newJobs[0]);
      }
    } catch (err) {
      console.error("Failed to load jobs:", err);
      if (!silentUpdateId) {
        setJobs([]);
        setTotalCount(0);
        setTotalPages(1);
        setSelectedJob(null);
        setLoadError("Failed to load jobs from API. Check authentication and server logs.");
      }
    } finally {
      if (!silentUpdateId) setLoading(false);
    }
  }, [currentPage, debouncedSearchQuery, pageSize, sortField, sortOrder]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    loadJobs(undefined, newPage);
  };

  const handleSelectJob = async (job: Job) => {
    setSelectedJob(job);
    try {
      const fullJob = await jobService.getJobById(job.id);
      setSelectedJob(fullJob);
    } catch (err) {
      console.error("Failed to load job details:", err);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      await jobService.deleteJob(jobId);
      if (selectedJob?.id === jobId) {
        setSelectedJob(null);
      }
      loadJobs();
    } catch (err) {
      console.error("Failed to delete job:", err);
      alert("Failed to delete the job application. Please try again.");
    }
  };

  const handleUpdateJobStatus = async (jobId: string, newStatus: JobStatus) => {
    try {
      await jobService.updateJobStatus(jobId, newStatus);
      // Update local state for immediate feedback
      setJobs(prevJobs =>
        prevJobs.map(job =>
          job.id === jobId ? { ...job, status: newStatus } : job
        )
      );
      // If the updated job is the selected one, update it too
      if (selectedJob?.id === jobId) {
        setSelectedJob({ ...selectedJob, status: newStatus });
      }
    } catch (err) {
      console.error("Failed to update job status:", err);
      alert("Failed to update status. Please try again.");
    }
  };

  const handleEditJob = (job: Job) => {
    setEditingJob(job);
    setIsEditModalOpen(true);
  };

  return (
    <ProtectedRoute>
      <AddJobModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingJob(null);
        }}
        onJobAdded={() => {
          if (!editingJob) {
            setCurrentPage(1);
            loadJobs(undefined, 1);
          } else {
            loadJobs(selectedJob?.id);
          }
        }}
        initialData={editingJob || undefined}
      />
      <AppShell
        detailPanel={selectedJob ? (
          <DetailPanel
            job={selectedJob}
            onClose={() => setSelectedJob(null)}
            onActivityAdded={() => loadJobs(selectedJob.id)}
            onJobUpdated={() => loadJobs(selectedJob.id)}
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
                placeholder="Search by title, company, location..."
                className="bg-transparent border-none text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-0 w-full pl-8 h-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 ml-4">
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
            {loadError && (
              <div className="mx-4 sm:mx-6 mt-4 mb-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {loadError}
              </div>
            )}
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full py-24">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
                <p className="text-slate-400">Loading your applications...</p>
              </div>
            ) : (
              <JobTable
                jobs={jobs}
                onSelectJob={handleSelectJob}
                onEditJob={handleEditJob}
                onDeleteJob={handleDeleteJob}
                onStatusChange={handleUpdateJobStatus}
                selectedJobId={selectedJob?.id}
                sortField={sortField}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
            )}

            {/* Pagination Footer */}
            <div className="h-12 border-t border-slate-800 flex items-center justify-between px-4 sm:px-6 bg-slate-950/30 text-xs shrink-0 sticky bottom-0 z-20 backdrop-blur-sm">
              <span className="text-slate-500 hidden sm:inline">
                Showing {Math.min((currentPage - 1) * pageSize + 1, totalCount)}-{Math.min(currentPage * pageSize, totalCount)} of {totalCount} results
              </span>
              <span className="text-slate-500 sm:hidden">
                {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="px-3 py-1 rounded border border-slate-800 text-slate-500 hover:text-white hover:border-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Simple logic to show a window of pages around current
                    let p = i + 1;
                    if (totalPages > 5) {
                      if (currentPage > 3) {
                        p = currentPage - 2 + i;
                      }
                      if (p > totalPages) {
                        p = totalPages - (4 - i);
                      }
                    }
                    return (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p)}
                        className={`px-3 py-1 rounded border ${currentPage === p ? 'bg-indigo-600 text-white border-indigo-500' : 'border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'} transition-colors`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-1 rounded border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
