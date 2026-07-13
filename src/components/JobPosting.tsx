import { useState } from "react";
import { Plus, Edit, Archive, Eye, Share2, Sparkles, Linkedin, Facebook, Twitter, Globe, Trash2, X, Copy, Check, AlertTriangle, Link2, Mail } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { useSharedContext, type JobPost } from "./SharedContext";

export function JobPosting() {
  const { jobs, addJob, updateJob, deleteJob } = useSharedContext();
  const [showAIModal, setShowAIModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [aiJobTitle, setAiJobTitle] = useState("");
  const [aiKeywords, setAiKeywords] = useState("");
  const [generatedDescription, setGeneratedDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Create/Edit form state
  const [editingJob, setEditingJob] = useState<JobPost | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDepartment, setFormDepartment] = useState("Engineering");
  const [formLocation, setFormLocation] = useState("");
  const [formType, setFormType] = useState("Full-time");
  const [formSalary, setFormSalary] = useState("");
  const [formPlatforms, setFormPlatforms] = useState<string[]>([]);
  const [formDescription, setFormDescription] = useState("");

  // Delete state
  const [deleteConfirm, setDeleteConfirm] = useState<JobPost | null>(null);

  // Share state
  const [shareJob, setShareJob] = useState<JobPost | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const resetCreateForm = () => {
    setFormTitle("");
    setFormDepartment("Engineering");
    setFormLocation("");
    setFormType("Full-time");
    setFormSalary("");
    setFormPlatforms([]);
    setFormDescription("");
    setEditingJob(null);
  };

  const openEditModal = (job: JobPost) => {
    setEditingJob(job);
    setFormTitle(job.title);
    setFormDepartment(job.department);
    setFormLocation(job.location);
    setFormType(job.type);
    setFormSalary(job.salary);
    setFormPlatforms([...job.platforms]);
    setFormDescription(job.description || "");
    setShowCreateModal(true);
  };

  const togglePlatform = (name: string) => {
    setFormPlatforms((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
    );
  };

  const handlePublishJob = () => {
    if (!formTitle.trim()) {
      toast.error("Please enter a job title");
      return;
    }

    if (editingJob) {
      // Update existing job
      updateJob(editingJob.id, {
        title: formTitle,
        department: formDepartment,
        location: formLocation || "Remote",
        type: formType,
        salary: formSalary || "Competitive",
        platforms: formPlatforms.length > 0 ? formPlatforms : ["Company Site"],
        description: formDescription,
      });
      toast.success(`"${formTitle}" has been updated successfully!`);
    } else {
      // Create new job
      const newJob = {
        title: formTitle,
        department: formDepartment,
        location: formLocation || "Remote",
        type: formType,
        salary: formSalary || "Competitive",
        platforms: formPlatforms.length > 0 ? formPlatforms : ["Company Site"],
        description: formDescription,
      };
      addJob(newJob);
      toast.success(`"${newJob.title}" has been published successfully!`);
    }

    setShowCreateModal(false);
    resetCreateForm();
  };

  const handleDeleteJob = (job: JobPost) => {
    deleteJob(job.id);
    setDeleteConfirm(null);
    toast.success(`"${job.title}" has been deleted`);
  };

  const handleCopyLink = (job: JobPost) => {
    const url = `https://hiremate.app/careers/${job.id}/${job.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setLinkCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleShareToPlatform = (platform: string, job: JobPost) => {
    const url = encodeURIComponent(`https://hiremate.app/careers/${job.id}/${job.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`);
    const text = encodeURIComponent(`We're hiring! Check out this ${job.title} position at our company. ${job.salary} | ${job.location} | ${job.type}`);
    let shareUrl = "";

    switch (platform) {
      case "LinkedIn":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
      case "Twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        break;
      case "Facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case "Email":
        shareUrl = `mailto:?subject=${encodeURIComponent(`Job Opening: ${job.title}`)}&body=${text}%0A%0A${url}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "noopener,noreferrer");
      toast.success(`Sharing to ${platform}...`);
    }
    setShareJob(null);
  };

  const handleGenerateAI = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setGeneratedDescription(
        `Position Overview:\nWe are seeking a talented ${aiJobTitle} to join our dynamic team. This role offers an exciting opportunity to work on cutting-edge projects and collaborate with industry experts.\n\nKey Responsibilities:\n• Lead and contribute to ${aiKeywords} initiatives\n• Collaborate with cross-functional teams to deliver high-quality solutions\n• Mentor junior team members and promote best practices\n• Drive innovation and continuous improvement\n\nRequirements:\n• 5+ years of experience in ${aiKeywords}\n• Strong problem-solving and communication skills\n• Bachelor's degree in relevant field or equivalent experience\n• Proven track record of successful project delivery\n\nWhat We Offer:\n• Competitive salary and benefits package\n• Flexible work arrangements\n• Professional development opportunities\n• Collaborative and inclusive work environment`
      );
      setIsGenerating(false);
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-700";
      case "Draft":
        return "bg-yellow-100 text-yellow-700";
      case "Closed":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Job Postings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and create job vacancies with AI assistance
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAIModal(true)}
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-primary px-6 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5 transition-all"
          >
            <Sparkles className="h-4 w-4" />
            Generate with AI
          </button>
          <button
            onClick={() => {
              resetCreateForm();
              setShowCreateModal(true);
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all"
          >
            <Plus className="h-4 w-4" />
            Create Job
          </button>
        </div>
      </div>

      {/* Job Postings Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="rounded-2xl bg-card p-6 shadow-sm border border-border hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(job.status)}`}>
                {job.status}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEditModal(job)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
                  title="Edit job"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDeleteConfirm(job)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-all"
                  title="Delete job"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <h3 className="text-lg font-bold text-foreground mb-2">{job.title}</h3>
            <div className="space-y-2 mb-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{job.department}</span> • {job.type}
              </p>
              <p className="text-sm text-muted-foreground">{job.location}</p>
              <p className="text-sm font-semibold text-primary">{job.salary}</p>
            </div>

            <div className="flex items-center gap-4 mb-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{job.views}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-sm font-medium text-foreground">{job.applicants}</span>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2">Posted on {new Date(job.postedDate).toLocaleDateString()}</p>
              <div className="flex flex-wrap gap-1">
                {job.platforms.map((platform, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    {platform === "LinkedIn" && <Linkedin className="h-3 w-3" />}
                    {platform === "Facebook" && <Facebook className="h-3 w-3" />}
                    {platform === "Twitter" && <Twitter className="h-3 w-3" />}
                    {(platform === "Company Site" || platform === "Indeed" || platform === "Behance" || platform === "Job Boards") && <Globe className="h-3 w-3" />}
                    {platform}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setJobs((prev) =>
                    prev.map((j) =>
                      j.id === job.id
                        ? { ...j, status: job.status === "Active" ? "Closed" : "Active" }
                        : j
                    )
                  );
                  toast.success(`"${job.title}" ${job.status === "Active" ? "archived" : "reactivated"}`);
                }}
                className="flex-1 rounded-lg border border-input px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition-all flex items-center justify-center gap-2"
              >
                <Archive className="h-4 w-4" />
                {job.status === "Active" ? "Archive" : "Reactivate"}
              </button>
              <button
                onClick={() => {
                  setShareJob(job);
                  setLinkCopied(false);
                }}
                className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
            </div>
          </div>
        ))}
      </div>

      {jobs.length === 0 && (
        <div className="rounded-2xl bg-card p-12 shadow-sm border border-border text-center">
          <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">No Job Postings</h3>
          <p className="text-sm text-muted-foreground mb-4">Get started by creating your first job posting.</p>
          <button
            onClick={() => { resetCreateForm(); setShowCreateModal(true); }}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
          >
            <Plus className="h-4 w-4" />
            Create Job
          </button>
        </div>
      )}

      {/* AI Generation Modal */}
      {showAIModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-card p-6 shadow-xl my-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-lg bg-primary p-2">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-foreground">AI Job Description Generator</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Job Title</label>
                <input
                  type="text"
                  placeholder="e.g., Senior Software Engineer"
                  value={aiJobTitle}
                  onChange={(e) => setAiJobTitle(e.target.value)}
                  className="w-full rounded-lg border border-input bg-input-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Keywords & Requirements</label>
                <input
                  type="text"
                  placeholder="e.g., React, TypeScript, AWS, Agile"
                  value={aiKeywords}
                  onChange={(e) => setAiKeywords(e.target.value)}
                  className="w-full rounded-lg border border-input bg-input-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <button
                onClick={handleGenerateAI}
                disabled={isGenerating || !aiJobTitle || !aiKeywords}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className={`h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} />
                {isGenerating ? "Generating..." : "Generate Description"}
              </button>

              {generatedDescription && (
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Generated Job Description</label>
                  <textarea
                    value={generatedDescription}
                    onChange={(e) => setGeneratedDescription(e.target.value)}
                    rows={12}
                    className="w-full rounded-lg border border-input bg-input-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-mono"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowAIModal(false);
                    setGeneratedDescription("");
                    setAiJobTitle("");
                    setAiKeywords("");
                  }}
                  className="flex-1 rounded-xl border-2 border-input py-2.5 text-sm font-semibold text-foreground hover:bg-accent transition-all"
                >
                  Close
                </button>
                {generatedDescription && (
                  <button
                    onClick={() => {
                      setShowAIModal(false);
                      resetCreateForm();
                      setFormTitle(aiJobTitle);
                      setFormDescription(generatedDescription);
                      setShowCreateModal(true);
                    }}
                    className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
                  >
                    Use This Description
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Job Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-card p-6 shadow-xl my-8">
            <h3 className="text-xl font-bold text-foreground mb-6">
              {editingJob ? "Edit Job Posting" : "Create New Job Posting"}
            </h3>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Job Title</label>
                  <input
                    type="text"
                    placeholder="e.g., Senior Developer"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full rounded-lg border border-input bg-input-background px-4 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Department</label>
                  <select
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    className="w-full rounded-lg border border-input bg-input-background px-4 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option>Engineering</option>
                    <option>Product</option>
                    <option>Design</option>
                    <option>Marketing</option>
                    <option>Sales</option>
                    <option>Analytics</option>
                    <option>HR</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Location</label>
                  <input
                    type="text"
                    placeholder="e.g., Remote, New York"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full rounded-lg border border-input bg-input-background px-4 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Employment Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full rounded-lg border border-input bg-input-background px-4 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                    <option>Internship</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Salary Range</label>
                <input
                  type="text"
                  placeholder="e.g., $80k - $120k"
                  value={formSalary}
                  onChange={(e) => setFormSalary(e.target.value)}
                  className="w-full rounded-lg border border-input bg-input-background px-4 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Job Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={6}
                  placeholder="Enter job description..."
                  className="w-full rounded-lg border border-input bg-input-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Publish To</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: "LinkedIn", icon: Linkedin },
                    { name: "Indeed", icon: Globe },
                    { name: "Company Site", icon: Globe },
                    { name: "Job Boards", icon: Globe },
                  ].map((platform) => (
                    <label
                      key={platform.name}
                      className={`flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-all ${
                        formPlatforms.includes(platform.name)
                          ? "border-primary bg-primary/5"
                          : "border-input bg-input-background hover:border-primary"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formPlatforms.includes(platform.name)}
                        onChange={() => togglePlatform(platform.name)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <platform.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">{platform.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetCreateForm();
                  }}
                  className="flex-1 rounded-xl border-2 border-input py-2.5 text-sm font-semibold text-foreground hover:bg-accent transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePublishJob}
                  className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
                >
                  {editingJob ? "Save Changes" : "Publish Job"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-red-100 p-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Delete Job Posting</h3>
              <p className="text-sm text-muted-foreground mb-1">
                Are you sure you want to delete <span className="font-semibold text-foreground">"{deleteConfirm.title}"</span>?
              </p>
              <p className="text-xs text-muted-foreground mb-6">
                This action cannot be undone. All {deleteConfirm.applicants} applicants associated with this posting will lose their link.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 rounded-xl border-2 border-input py-2.5 text-sm font-semibold text-foreground hover:bg-accent transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteJob(deleteConfirm)}
                  className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShareJob(null)}>
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">Share Job Posting</h3>
              <button onClick={() => setShareJob(null)} className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-all">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-5 p-4 rounded-xl bg-accent/50 border border-border">
              <h4 className="text-sm font-bold text-foreground">{shareJob.title}</h4>
              <p className="text-xs text-muted-foreground mt-1">{shareJob.department} • {shareJob.location} • {shareJob.salary}</p>
            </div>

            {/* Copy Link */}
            <div className="mb-5">
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Job Link</label>
              <div className="flex gap-2">
                <div className="flex-1 rounded-lg border border-input bg-input-background px-3 py-2.5 text-sm text-muted-foreground truncate">
                  https://hiremate.app/careers/{shareJob.id}/{shareJob.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
                </div>
                <button
                  onClick={() => handleCopyLink(shareJob)}
                  className={`shrink-0 rounded-lg px-4 py-2.5 text-sm font-medium transition-all flex items-center gap-2 ${
                    linkCopied
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {linkCopied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            {/* Share to Platforms */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-3 block">Share to Platform</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleShareToPlatform("LinkedIn", shareJob)}
                  className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 hover:border-blue-300 hover:bg-blue-50 transition-all"
                >
                  <div className="rounded-lg bg-blue-100 p-2">
                    <Linkedin className="h-4 w-4 text-blue-700" />
                  </div>
                  <span className="text-sm font-medium text-foreground">LinkedIn</span>
                </button>
                <button
                  onClick={() => handleShareToPlatform("Twitter", shareJob)}
                  className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 hover:border-sky-300 hover:bg-sky-50 transition-all"
                >
                  <div className="rounded-lg bg-sky-100 p-2">
                    <Twitter className="h-4 w-4 text-sky-600" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Twitter</span>
                </button>
                <button
                  onClick={() => handleShareToPlatform("Facebook", shareJob)}
                  className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 hover:border-blue-400 hover:bg-blue-50 transition-all"
                >
                  <div className="rounded-lg bg-blue-100 p-2">
                    <Facebook className="h-4 w-4 text-blue-800" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Facebook</span>
                </button>
                <button
                  onClick={() => handleShareToPlatform("Email", shareJob)}
                  className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 hover:border-gray-400 hover:bg-gray-50 transition-all"
                >
                  <div className="rounded-lg bg-gray-100 p-2">
                    <Mail className="h-4 w-4 text-gray-700" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Email</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
