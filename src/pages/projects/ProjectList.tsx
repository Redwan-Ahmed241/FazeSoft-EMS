import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Briefcase,
  Calendar,
  Pencil,
  Plus,
  Users,
  Loader2,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner@2.0.3";
import { useAuth } from "../../context/AuthContext";
import { apiClient } from "../../utils/apiClient";
import type { ProjectListOut } from "../../types/project";

export function ProjectList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectListOut[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        // Tier 1 → fetch from GET /api/v1/projects (all projects)
        // Tier 2 + 3 → fetch from GET /api/v1/projects/mine (only assigned)
        const isFullAccess = user?.role === "admin" || user?.role === "hr";
        const endpoint = isFullAccess ? "/projects" : "/projects/mine";
        const projData = await apiClient.get<ProjectListOut[]>(endpoint);
        setProjects(projData || []);
      } catch (err) {
        console.error("Failed to load projects:", err);
        toast.error("Failed to load projects.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.role]);

  const statusStyles: Record<string, string> = {
    "In Progress": "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
    Planned: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
    Completed: "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300",
    "On Hold": "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    Cancelled: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-primary" /> Projects
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and edit all projects and their teams.
          </p>
        </div>
        <button
          onClick={() => navigate("/dashboard/projects/create")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold shadow-md hover:bg-primary/90 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {/* Scrollable panel */}
      <div className="border border-border rounded-2xl bg-card shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-muted/40 flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">All Projects</h2>
          <span className="text-xs font-semibold text-muted-foreground">{projects.length} total</span>
        </div>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-semibold text-muted-foreground">No projects yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Create your first project to start managing teams.
            </p>
          </div>
        ) : (
          <div className="max-h-[65vh] overflow-y-auto divide-y divide-border">
            {projects.map((p) => (
              <div
                key={p.project_id}
                className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4 hover:bg-muted/30 transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                      {p.project_code}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusStyles[p.status] || "bg-gray-100 text-gray-700"}`}>
                      {p.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-foreground mt-1.5 truncate">
                    {p.project_name}
                  </h3>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {p.start_date}
                    </span>
                    {p.status === "Planned" && (
                      <span className="flex items-center gap-1 text-amber-600">
                        <Users className="w-3 h-3" /> Needs team
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => navigate(`/dashboard/projects/${p.project_id}`)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
                  >
                    View <ChevronRight className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => navigate(`/dashboard/projects/${p.project_id}/edit`)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
export default ProjectList;