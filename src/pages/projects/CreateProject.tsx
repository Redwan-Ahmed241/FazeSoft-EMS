import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { 
  FolderPlus, 
  ArrowRight, 
  Calendar, 
  Building2, 
  User as UserIcon, 
  FileText, 
  Hash, 
  Sparkles,
  Loader2
} from "lucide-react";
import { toast } from "sonner@2.0.3";
import { clientsApi } from "../../api/clients";
import { useAuth } from "../../context/AuthContext";
import type { ClientOut } from "../../types/client";
import type { ProjectFormData } from "../../types/project";

export function CreateProject() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const draft = (location.state ?? {}) as Partial<ProjectFormData>;

  const [fetchingClients, setFetchingClients] = useState(true);
  const [clients, setClients] = useState<ClientOut[]>([]);

  // Form fields — prefilled from draft state when returning from a later step
  const [projectName, setProjectName] = useState(draft.projectName ?? "");
  const [projectCode, setProjectCode] = useState(draft.projectCode ?? "");
  const [description, setDescription] = useState(draft.description ?? "");
  const [startDate, setStartDate] = useState(draft.startDate ?? "");
  const [endDate, setEndDate] = useState(draft.endDate ?? "");
  const [clientId, setClientId] = useState(draft.clientId ?? "");

  // Load clients list on mount
  useEffect(() => {
    async function loadClients() {
      try {
        setFetchingClients(true);
        const data = await clientsApi.list();
        setClients(data || []);
        if (data && data.length > 0 && !clientId) {
          setClientId(data[0].client_id);
        }
      } catch (err: unknown) {
        console.error("Failed to load clients:", err);
        toast.error("Could not fetch clients list. Please ensure clients exist.");
      } finally {
        setFetchingClients(false);
      }
    }
    loadClients();
  }, []);

  // Auto-generate a starter project code if empty
  const handleNameChange = (val: string) => {
    setProjectName(val);
    if (!projectCode || projectCode.startsWith("PRJ-")) {
      const acronym = val
        .split(" ")
        .filter(Boolean)
        .map((w) => w[0]?.toUpperCase())
        .join("")
        .slice(0, 4);
      if (acronym) {
        setProjectCode(`PRJ-${acronym}-${Math.floor(100 + Math.random() * 900)}`);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectName.trim()) {
      toast.error("Please enter a Project Name");
      return;
    }
    if (!projectCode.trim()) {
      toast.error("Please enter a Project Code");
      return;
    }
    if (!description.trim()) {
      toast.error("Please provide a Project Description");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Please specify both Start Date and End Date");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      toast.error("End Date cannot be earlier than Start Date");
      return;
    }
    if (!clientId) {
      toast.error("Please select a valid Client");
      return;
    }

    const projectData: ProjectFormData = {
      projectName: projectName.trim(),
      projectCode: projectCode.trim().toUpperCase(),
      description: description.trim(),
      clientId,
      startDate,
      endDate,
    };

    // Move to Step 2 — no API call here. Creation happens on the review page.
    navigate(`/dashboard/projects/create/team`, { state: { projectData } });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Step Indicator Header */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl shadow-inner">
              <FolderPlus className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                  Step 1 of 3
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" /> Project Definition
                </span>
              </div>
              <h1 className="text-2xl font-bold text-foreground mt-0.5">Create New Project</h1>
            </div>
          </div>

          {/* Stepper Pill */}
          <div className="flex items-center gap-2 text-sm font-medium bg-muted/60 px-4 py-2 rounded-xl border border-border/50">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
              1
            </span>
            <span className="text-foreground font-semibold">Project Details</span>
            <span className="text-muted-foreground">→</span>
            <span className="w-6 h-6 rounded-full bg-muted-foreground/20 text-muted-foreground text-xs flex items-center justify-center font-medium">
              2
            </span>
            <span className="text-muted-foreground">Team Setup</span>
          </div>
        </div>
      </div>

      {/* Main Form Card */}
      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="border-b border-border/60 pb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" /> Project Information
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Fill in the essential timeline and client details to register the project.
          </p>
        </div>

        {/* Name & Code Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Project Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Enterprise HR Portal Redesign"
                value={projectName}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                className="w-full pl-4 pr-4 py-2.5 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground flex items-center justify-between">
              <span>Project Code <span className="text-red-500">*</span></span>
              <span className="text-xs text-muted-foreground font-normal">Unique ID</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                <Hash className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="e.g. PRJ-EHPR-102"
                value={projectCode}
                onChange={(e) => setProjectCode(e.target.value.toUpperCase())}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-foreground font-mono text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition uppercase"
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            placeholder="Briefly describe the project goals, scope, key deliverables, and client requirements..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition resize-y min-h-[90px]"
          />
        </div>

        {/* Dates Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" /> Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" /> End Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || undefined}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            />
          </div>
        </div>

        {/* Client & Manager Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-primary" /> Client <span className="text-red-500">*</span>
            </label>
            {fetchingClients ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2.5">
                <Loader2 className="w-4 h-4 animate-spin text-primary" /> Loading client list...
              </div>
            ) : clients.length === 0 ? (
              <div className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200 dark:border-amber-900/50">
                No clients found in system. Please add a client first.
              </div>
            ) : (
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              >
                {clients.map((c) => (
                  <option key={c.client_id} value={c.client_id}>
                    {c.client_name} ({c.company_name})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground flex items-center gap-1.5">
              <UserIcon className="w-4 h-4 text-primary" /> Project Manager
            </label>
            <div className="px-4 py-2.5 rounded-xl border border-input bg-muted/40 text-foreground flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">
                {user?.name || user?.email || "Current User"}
              </span>
              <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded border border-border">
                {user?.role?.replace(/_/g, " ").toUpperCase() || "CTO"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Manager is automatically assigned to the authenticated user creating this project.
            </p>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-6 border-t border-border flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted font-medium transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={clients.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold shadow-md hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Continue to Team <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
export default CreateProject;
