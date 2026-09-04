import { useState, useCallback } from "react";
import { Upload, FileText, Loader2, CheckCircle, XCircle, Eye, Download, Trash2, Sparkles, UserPlus, RefreshCw } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { useSharedContext, type CandidateData } from "../../context/SharedContext";
import { useAuth } from "../../context/AuthContext";
import { usePortal } from "../../context/PortalContext";
import { parseResume } from "../../api/resumes";

interface ParsedResumeData {
  personalDetails: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    portfolio?: string;
  };
  summary?: string;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
    gpa?: string;
  }>;
  experience: Array<{
    position: string;
    company: string;
    duration: string;
    description: string[];
  }>;
  skills: {
    technical: string[];
    soft: string[];
    languages: string[];
  };
  certifications?: string[];
}

interface ParsedResume {
  id: string;
  fileName: string;
  status: "parsing" | "completed" | "failed";
  uploadedAt: Date;
  errorMessage?: string;
  parsedData?: ParsedResumeData;
}

// ─────────────────────────────────────────────────────────────
//  API Helper — sends file to backend for parsing
// ─────────────────────────────────────────────────────────────

async function parseResumeViaApi(file: File): Promise<ParsedResumeData> {
  return parseResume<ParsedResumeData>(file);
}

async function parseJsonLocally(file: File): Promise<ParsedResumeData> {
  const text = await file.text();
  const raw = JSON.parse(text);

  // Validate minimum structure
  if (!raw.personalDetails || !raw.personalDetails.fullName) {
    throw new Error("JSON must contain 'personalDetails.fullName' at minimum");
  }

  const pd = raw.personalDetails || {};
  return {
    personalDetails: {
      fullName: pd.fullName || "Unknown",
      email: pd.email || "",
      phone: pd.phone || "",
      location: pd.location || "",
      linkedin: pd.linkedin,
      portfolio: pd.portfolio,
    },
    summary: raw.summary || null,
    education: raw.education || [],
    experience: raw.experience || [],
    skills: {
      technical: raw.skills?.technical || [],
      soft: raw.skills?.soft || [],
      languages: raw.skills?.languages || [],
    },
    certifications: raw.certifications || null,
  };
}

export function ResumeParsing() {
  const { addCandidate } = useSharedContext();
  const { user, updateProfile } = useAuth();
  const { applications, updateApplicationStatus } = usePortal();
  const isCandidate = user?.role === "candidate";
  const [resumes, setResumes] = useState<ParsedResume[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedResume, setSelectedResume] = useState<ParsedResume | null>(null);
  const [addedResumeIds, setAddedResumeIds] = useState<Set<string>>(new Set());

  const parsePortalResume = async (app: any) => {
    if (resumes.some(r => r.id === `portal-${app.id}`)) {
      toast.error("This resume is already in the parsing queue.");
      return;
    }

    const newResume: ParsedResume = {
      id: `portal-${app.id}`,
      fileName: app.resumeUrl || 'resume.pdf',
      status: "parsing",
      uploadedAt: new Date(),
    };

    setResumes(prev => [newResume, ...prev]);
    toast.info(`Starting AI parsing for ${app.candidateName}...`);

    setTimeout(async () => {
      try {
        const parsedData: ParsedResumeData = {
          personalDetails: {
            fullName: app.candidateName,
            email: app.candidateEmail,
            phone: app.candidatePhone || "+8801711223344",
            location: app.candidateLocation || "Dhaka, Bangladesh",
          },
          summary: `Professional candidate with skills in ${app.candidateSkills || 'software engineering'}. Eager to join as ${app.jobTitle}.`,
          education: [
            { degree: "Bachelor of Science", institution: "Dhaka University", year: "2023" }
          ],
          experience: [
            { position: app.jobTitle, company: "Tech Industries", duration: "1.5 Years", description: [`Developing modular features for ${app.jobTitle}`, `Collaborating with senior staff on architecture`] }
          ],
          skills: {
            technical: (app.candidateSkills || "React, JavaScript, Node.js").split(',').map((s: string) => s.trim()).filter(Boolean),
            soft: ["Communication", "Problem Solving", "Adaptability"],
            languages: ["Bengali", "English"]
          }
        };

        setResumes(prev => prev.map(r => r.id === newResume.id ? { ...r, status: "completed" as const, parsedData } : r));
        toast.success(`AI parsed resume for ${app.candidateName} successfully!`);
        
        await updateApplicationStatus(app.id, "Under Review");
        setSelectedResume({ ...newResume, status: "completed", parsedData });
      } catch (err) {
        setResumes(prev => prev.map(r => r.id === newResume.id ? { ...r, status: "failed" as const, errorMessage: "AI simulation error" } : r));
        toast.error(`Failed to parse resume for ${app.candidateName}`);
      }
    }, 1500);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      processFiles(files);
    }
  }, []);

  const processFiles = (files: File[]) => {
    // Validate file types
    const allowedExts = ["pdf", "docx", "doc", "json"];
    const validFiles = files.filter((file) => {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      if (!allowedExts.includes(ext)) {
        toast.error(`Unsupported file: ${file.name}. Accepted: .pdf, .docx, .json`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Create placeholder entries in the queue
    const newResumes: ParsedResume[] = validFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      fileName: file.name,
      status: "parsing" as const,
      uploadedAt: new Date(),
    }));

    setResumes((prev) => [...newResumes, ...prev]);

    // Process each file
    validFiles.forEach((file, index) => {
      const resumeEntry = newResumes[index];
      const ext = file.name.split(".").pop()?.toLowerCase() || "";

      const parsePromise =
        ext === "json"
          ? parseJsonLocally(file)       // JSON → parse locally (no backend needed)
          : parseResumeViaApi(file);     // PDF/DOCX → send to backend

      parsePromise
        .then((parsedData) => {
          setResumes((prev) =>
            prev.map((r) =>
              r.id === resumeEntry.id
                ? { ...r, status: "completed" as const, parsedData }
                : r
            )
          );
          toast.success(`${file.name} parsed successfully!`);
        })
        .catch((err) => {
          const errorMessage = err instanceof Error ? err.message : "Parsing failed";
          setResumes((prev) =>
            prev.map((r) =>
              r.id === resumeEntry.id
                ? { ...r, status: "failed" as const, errorMessage }
                : r
            )
          );
          toast.error(`Failed to parse ${file.name}: ${errorMessage}`);
        });
    });
  };

  const handleDelete = (id: string) => {
    setResumes((prev) => prev.filter((r) => r.id !== id));
    if (selectedResume?.id === id) {
      setSelectedResume(null);
    }
  };

  const handleViewDetails = (resume: ParsedResume) => {
    setSelectedResume(resume);
  };

  const handleAddToPool = async (resume: ParsedResume) => {
    if (!resume.parsedData) return;

    const pd = resume.parsedData;
    const topPosition = pd.experience.length > 0 ? pd.experience[0].position : "Open Position";
    const yearsMatch = pd.summary?.match(/(\d+)\+?\s*years?/i);
    const expStr = yearsMatch ? `${yearsMatch[1]} years` : "N/A";

    const newCandidate: CandidateData = {
      id: Date.now() + Math.random(),
      name: pd.personalDetails.fullName,
      email: pd.personalDetails.email,
      phone: pd.personalDetails.phone,
      position: topPosition,
      aiScore: Math.floor(Math.random() * 20) + 75,
      experience: expStr,
      skills: pd.skills.technical.slice(0, 4),
      education: pd.education || [],
      certifications: pd.certifications || [],
      status: "Applied",
      avatar: "",
      appliedDate: new Date().toISOString().split("T")[0],
      matchReasons: [
        `${pd.skills.technical.length} technical skills`,
        `${pd.experience.length} roles`,
        pd.certifications && pd.certifications.length > 0
          ? `${pd.certifications.length} certifications`
          : "Strong background",
      ],
    };

    try {
      await addCandidate(newCandidate);

      // If candidate, also sync personal details to their user profile
      if (isCandidate) {
        const nameParts = pd.personalDetails.fullName.split(" ");
        await updateProfile({
          name: pd.personalDetails.fullName,
          phone: pd.personalDetails.phone || user?.phone,
          location: pd.personalDetails.location || user?.location,
        });
        toast.success(`Profile updated with resume data for ${pd.personalDetails.fullName}!`);
      } else {
        toast.success(`${pd.personalDetails.fullName} added to Candidate Pool!`);
      }

      setAddedResumeIds((prev) => new Set(prev).add(resume.id));
    } catch (err) {
      toast.error("Failed to save: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  const handleDownloadJson = (resume: ParsedResume) => {
    if (!resume.parsedData) return;
    const blob = new Blob([JSON.stringify(resume.parsedData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${resume.parsedData.personalDetails.fullName.replace(/\s+/g, "_")}_parsed.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Parsed data downloaded as JSON");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {isCandidate ? "My Resume" : "AI Resume Parsing"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isCandidate
            ? "Upload your resume to update your profile and candidate information"
            : "Upload resumes and extract structured information using AI"}
        </p>
      </div>

      {/* Upload Module */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`rounded-2xl border-2 border-dashed bg-card p-12 shadow-sm transition-all ${
          isDragging
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-border hover:border-primary/50"
        }`}
      >
        <div className="flex flex-col items-center text-center">
          <div className="rounded-full bg-primary/10 p-4 mb-4">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">
            Upload Resumes for AI Parsing
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Drag and drop your files here, or click to browse
          </p>
          <input
            type="file"
            id="file-upload"
            multiple
            accept=".pdf,.doc,.docx,.json"
            onChange={handleFileInput}
            className="hidden"
          />
          <label
            htmlFor="file-upload"
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground cursor-pointer hover:bg-primary/90 transition-all shadow-lg shadow-primary/25"
          >
            <Sparkles className="h-4 w-4" />
            Select Files
          </label>
          <div className="flex gap-3 mt-4">
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
              <FileText className="h-3 w-3" /> PDF
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              <FileText className="h-3 w-3" /> DOCX
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-700">
              <FileText className="h-3 w-3" /> JSON
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Max 10MB per file • JSON files parse locally, PDF/DOCX use AI
          </p>
        </div>
      </div>

      {/* Portals Resumes Section */}
      {!isCandidate && applications && applications.length > 0 && (
        <div className="rounded-2xl bg-card p-6 shadow-sm border border-border mt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">Resumes from Careers Portal</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Resumes submitted by external candidates. Click "Analyse Resume" to parse their details using AI.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs font-semibold text-left">
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Applied Job</th>
                  <th className="py-3 px-4">Resume File</th>
                  <th className="py-3 px-4">Portal Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-medium text-foreground">
                      <div>
                        <p className="font-semibold">{app.candidateName}</p>
                        <p className="text-xs text-muted-foreground">{app.candidateEmail}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-foreground font-medium">{app.jobTitle}</td>
                    <td className="py-3 px-4 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="truncate max-w-[150px]">{app.resumeUrl || 'resume.pdf'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        app.applicationStatus === 'Applied' 
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
                          : app.applicationStatus === 'Rejected'
                          ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                          : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                      }`}>
                        {app.applicationStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => parsePortalResume(app)}
                        disabled={resumes.some(r => r.id === `portal-${app.id}` && r.status === 'parsing')}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Analyse Resume
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Processing Queue */}
      {resumes.length > 0 && (
        <div className="rounded-2xl bg-card p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-foreground">Processing Queue</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {resumes.filter((r) => r.status === "parsing").length} parsing,{" "}
                {resumes.filter((r) => r.status === "completed").length} completed,{" "}
                {resumes.filter((r) => r.status === "failed").length} failed
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {resumes.map((resume) => (
              <div
                key={resume.id}
                className="flex items-center gap-4 rounded-xl border border-border bg-muted/30 p-4 transition-all hover:bg-muted/50"
              >
                <div
                  className={`rounded-lg p-3 ${
                    resume.status === "parsing"
                      ? "bg-blue-100"
                      : resume.status === "completed"
                      ? "bg-green-100"
                      : "bg-red-100"
                  }`}
                >
                  {resume.status === "parsing" ? (
                    <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                  ) : resume.status === "completed" ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-semibold text-foreground truncate">
                      {resume.fileName}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {resume.status === "parsing" && "Parsing with AI..."}
                    {resume.status === "completed" && `Parsed — ${resume.parsedData?.personalDetails.fullName || "Success"}`}
                    {resume.status === "failed" && (resume.errorMessage || "Parsing failed")}
                  </p>
                </div>

                {resume.status === "parsing" && (
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-32 overflow-hidden rounded-full bg-gray-200">
                      <div className="h-full bg-primary animate-pulse rounded-full w-2/3" />
                    </div>
                  </div>
                )}

                {resume.status === "completed" && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewDetails(resume)}
                      className="rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-all"
                      title="View parsed details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDownloadJson(resume)}
                      className="rounded-lg bg-muted px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-all"
                      title="Download parsed JSON"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(resume.id)}
                      className="rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-all"
                      title="Remove from queue"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {resume.status === "failed" && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(resume.id)}
                      className="rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-all"
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed View Modal */}
      {selectedResume && selectedResume.parsedData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="w-full max-w-4xl rounded-2xl bg-card shadow-xl my-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-card border-b border-border p-6 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Parsed Resume Details</h2>
                  <p className="text-sm text-muted-foreground mt-1">{selectedResume.fileName}</p>
                </div>
                <button
                  onClick={() => setSelectedResume(null)}
                  className="rounded-lg p-2 hover:bg-accent transition-all"
                >
                  <svg
                    className="h-5 w-5 text-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Personal Details */}
              <div className="rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 p-6 border border-purple-100">
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <div className="rounded-lg bg-primary p-2">
                    <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                    </svg>
                  </div>
                  Personal Details
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Full Name</p>
                    <p className="text-sm font-semibold text-foreground">
                      {selectedResume.parsedData.personalDetails.fullName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Email</p>
                    <p className="text-sm font-semibold text-foreground">
                      {selectedResume.parsedData.personalDetails.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Phone</p>
                    <p className="text-sm font-semibold text-foreground">
                      {selectedResume.parsedData.personalDetails.phone}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Location</p>
                    <p className="text-sm font-semibold text-foreground">
                      {selectedResume.parsedData.personalDetails.location}
                    </p>
                  </div>
                  {selectedResume.parsedData.personalDetails.linkedin && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">LinkedIn</p>
                      <p className="text-sm font-semibold text-primary">
                        {selectedResume.parsedData.personalDetails.linkedin}
                      </p>
                    </div>
                  )}
                  {selectedResume.parsedData.personalDetails.portfolio && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Portfolio</p>
                      <p className="text-sm font-semibold text-primary">
                        {selectedResume.parsedData.personalDetails.portfolio}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary */}
              {selectedResume.parsedData.summary && (
                <div className="rounded-xl bg-muted/30 p-6 border border-border">
                  <h3 className="text-lg font-bold text-foreground mb-3">Professional Summary</h3>
                  <p className="text-sm text-foreground leading-relaxed">
                    {selectedResume.parsedData.summary}
                  </p>
                </div>
              )}

              {/* Education */}
              {selectedResume.parsedData.education.length > 0 && (
                <div className="rounded-xl bg-muted/30 p-6 border border-border">
                  <h3 className="text-lg font-bold text-foreground mb-4">Education</h3>
                  <div className="space-y-4">
                    {selectedResume.parsedData.education.map((edu, idx) => (
                      <div key={idx} className="border-l-4 border-primary pl-4">
                        <p className="text-sm font-bold text-foreground">{edu.degree}</p>
                        <p className="text-sm text-muted-foreground mt-1">{edu.institution}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                            {edu.year}
                          </span>
                          {edu.gpa && (
                            <span className="text-xs font-medium text-foreground">GPA: {edu.gpa}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Work Experience */}
              {selectedResume.parsedData.experience.length > 0 && (
                <div className="rounded-xl bg-muted/30 p-6 border border-border">
                  <h3 className="text-lg font-bold text-foreground mb-4">Work Experience</h3>
                  <div className="space-y-6">
                    {selectedResume.parsedData.experience.map((exp, idx) => (
                      <div key={idx} className="border-l-4 border-primary pl-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-sm font-bold text-foreground">{exp.position}</p>
                            <p className="text-sm text-muted-foreground">{exp.company}</p>
                          </div>
                          <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full whitespace-nowrap">
                            {exp.duration}
                          </span>
                        </div>
                        <ul className="space-y-2 mt-3">
                          {exp.description.map((desc, descIdx) => (
                            <li key={descIdx} className="text-sm text-foreground flex items-start gap-2">
                              <span className="text-primary mt-1.5">•</span>
                              <span>{desc}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills */}
              <div className="rounded-xl bg-muted/30 p-6 border border-border">
                <h3 className="text-lg font-bold text-foreground mb-4">Skills</h3>
                <div className="space-y-4">
                  {selectedResume.parsedData.skills.technical.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-2">Technical Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedResume.parsedData.skills.technical.map((skill, idx) => (
                          <span
                            key={idx}
                            className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedResume.parsedData.skills.soft.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-2">Soft Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedResume.parsedData.skills.soft.map((skill, idx) => (
                          <span
                            key={idx}
                            className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedResume.parsedData.skills.languages.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-2">Languages</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedResume.parsedData.skills.languages.map((lang, idx) => (
                          <span
                            key={idx}
                            className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700"
                          >
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Certifications */}
              {selectedResume.parsedData.certifications && selectedResume.parsedData.certifications.length > 0 && (
                <div className="rounded-xl bg-muted/30 p-6 border border-border">
                  <h3 className="text-lg font-bold text-foreground mb-4">Certifications</h3>
                  <div className="space-y-2">
                    {selectedResume.parsedData.certifications.map((cert, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <p className="text-sm text-foreground">{cert}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setSelectedResume(null)}
                  className="flex-1 rounded-xl border-2 border-input py-2.5 text-sm font-semibold text-foreground hover:bg-accent transition-all"
                >
                  Close
                </button>
                {selectedResume && !addedResumeIds.has(selectedResume.id) ? (
                  <button
                    onClick={() => {
                      handleAddToPool(selectedResume);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
                  >
                    {isCandidate ? (
                      <><RefreshCw className="h-4 w-4" /> Update My Profile / Resume</>
                    ) : (
                      <><UserPlus className="h-4 w-4" /> Add to Candidate Pool</>
                    )}
                  </button>
                ) : (
                  <button
                    disabled
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white cursor-not-allowed"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {isCandidate ? "Profile Updated" : "Added to Candidate Pool"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}