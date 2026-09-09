import { useState } from "react";
import { Search, Mail, MessageSquare, Phone, Download, Eye, Star, Filter, Sparkles, TrendingUp, Award, Target, X, MapPin, Calendar, Briefcase, Clock, ChevronRight, FileText, User, Send, Wand2, Copy, Check, CheckCircle2, XCircle, Trash2, ExternalLink, AlertCircle } from "lucide-react";
import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import { useSharedContext, type CandidateData } from "../../context/SharedContext";
import { toast } from "sonner@2.0.3";
import InitialsAvatar from "../../components/common/ui/InitialsAvatar";
import { emailApi, createGmailComposeUrl, createOutlookComposeUrl, createMailtoUrl } from "../../api/emails";

const kanbanColumns = [
  { id: "Applied",  title: "Applied",   color: "bg-gray-50",   borderColor: "border-gray-300" },
  { id: "Screened", title: "Screened",  color: "bg-blue-50",   borderColor: "border-blue-300" },
  { id: "Interview",title: "Interview", color: "bg-purple-50", borderColor: "border-purple-300" },
  { id: "Offer",    title: "Offer",     color: "bg-yellow-50", borderColor: "border-yellow-300" },
  { id: "Hired",    title: "Hired",     color: "bg-green-50",  borderColor: "border-green-300" },
  { id: "Approved", title: "✅ Approved",color: "bg-green-50",borderColor: "border-green-300" },
  { id: "Rejected", title: "❌ Rejected",color: "bg-red-50",   borderColor: "border-red-400" },
];

const statusSteps = ["Applied", "Screened", "Interview", "Offer", "Hired"];

// AI email templates based on candidate status
function generateAIEmail(candidate: CandidateData, templateType: string): { subject: string; body: string } {
  switch (templateType) {
    case "interview_invite":
      return {
        subject: `Interview Invitation - ${candidate.position} at FazeMate`,
        body: `Dear ${candidate.name},\n\nThank you for your interest in the ${candidate.position} position at FazeMate. After reviewing your application and impressive background with ${candidate.experience} of experience, we would like to invite you for an interview.\n\nYour skills in ${candidate.skills.join(", ")} align well with what we're looking for, and we're excited to learn more about your experience.\n\nPlease let us know your availability for the upcoming week so we can schedule a convenient time for both parties.\n\nWe look forward to speaking with you.\n\nBest regards,\nFazeMate Recruitment Team`,
      };
    case "follow_up":
      return {
        subject: `Following Up - ${candidate.position} Application`,
        body: `Dear ${candidate.name},\n\nI hope this message finds you well. I wanted to follow up regarding your application for the ${candidate.position} role at FazeMate.\n\nWe were particularly impressed by your expertise in ${candidate.skills.slice(0, 2).join(" and ")} and your ${candidate.experience} of professional experience. Our team is currently in the evaluation phase, and we wanted to keep you updated on your application status.\n\nIf you have any questions or need additional information about the role, please don't hesitate to reach out.\n\nThank you for your patience, and we'll be in touch soon with next steps.\n\nBest regards,\nFazeMate Recruitment Team`,
      };
    case "offer_letter":
      return {
        subject: `Offer Letter - ${candidate.position} at FazeMate`,
        body: `Dear ${candidate.name},\n\nCongratulations! We are thrilled to extend an offer for the ${candidate.position} position at FazeMate.\n\nAfter careful consideration and a thorough evaluation process, our team was highly impressed by your ${candidate.experience} of experience and your exceptional skills in ${candidate.skills.join(", ")}. We believe you would be an outstanding addition to our team.\n\nPlease find the offer details below:\n- Position: ${candidate.position}\n- Start Date: To be discussed\n- Compensation: To be discussed\n\nWe kindly ask that you review the offer and respond within 5 business days. Should you have any questions or wish to discuss the terms, please don't hesitate to contact us.\n\nWe're excited about the possibility of you joining our team!\n\nBest regards,\nFazeMate Recruitment Team`,
      };
    case "rejection":
      return {
        subject: `Update on Your Application - ${candidate.position}`,
        body: `Dear ${candidate.name},\n\nThank you for taking the time to apply for the ${candidate.position} position at FazeMate and for your interest in joining our team.\n\nAfter careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current requirements. This was a difficult decision, as we were impressed by your skills in ${candidate.skills.slice(0, 2).join(" and ")}.\n\nWe encourage you to apply for future openings that match your experience. We will keep your resume on file for any upcoming opportunities.\n\nWe wish you the very best in your career journey.\n\nSincerely,\nFazeMate Recruitment Team`,
      };
    default:
      return {
        subject: `Regarding Your Application - ${candidate.position}`,
        body: `Dear ${candidate.name},\n\nThank you for your application for the ${candidate.position} position at FazeMate.\n\nBest regards,\nFazeMate Recruitment Team`,
      };
  }
}

function generateResumeText(candidate: CandidateData): string {
  return `
════════════════════════════════════════════════════
                    RESUME
════════════════════════════════════════════════════

${candidate.name.toUpperCase()}
${candidate.position}

────────────────────────────────────────────────────
CONTACT INFORMATION
────────────────────────────────────────────────────
Email:       ${candidate.email}
Phone:       ${candidate.phone}
Location:    Available upon request

────────────────────────────────────────────────────
PROFESSIONAL SUMMARY
────────────────────────────────────────────────────
Experienced professional with ${candidate.experience} of dedicated 
expertise in ${candidate.skills.join(", ")}. Proven ability to 
deliver high-quality results in fast-paced environments. 
Passionate about continuous learning and professional growth.

AI Match Score: ${candidate.aiScore}/100 (${candidate.aiScore >= 90 ? "Excellent" : candidate.aiScore >= 80 ? "Good" : candidate.aiScore >= 70 ? "Fair" : "Low"} Match)

────────────────────────────────────────────────────
CORE SKILLS
────────────────────────────────────────────────────
${candidate.skills.map((s) => `  • ${s}`).join("\n")}

────────────────────────────────────────────────────
EXPERIENCE
────────────────────────────────────────────────────
${candidate.position}
${candidate.experience} of professional experience

Key Achievements:
${(candidate.matchReasons || []).map((r) => `  • ${r}`).join("\n") || "  • Details available upon request"}

────────────────────────────────────────────────────
APPLICATION STATUS
────────────────────────────────────────────────────
Current Stage:  ${candidate.status}
Applied Date:   ${new Date(candidate.appliedDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}

════════════════════════════════════════════════════
          Generated by FazeMate ATS
════════════════════════════════════════════════════
`.trim();
}

export function Candidate() {
  const { candidates, setCandidates, updateCandidateStatus, deleteCandidate, candidatesLoading, candidatesError } = useSharedContext();
  const [viewMode, setViewMode] = useState<"table" | "kanban" | "ranking">("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [draggedCandidate, setDraggedCandidate] = useState<CandidateData | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<CandidateData | null>(null);

  // Email modal state
  const [emailCandidate, setEmailCandidate] = useState<CandidateData | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [showAITemplates, setShowAITemplates] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [isInterviewInvite, setIsInterviewInvite] = useState(false);
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");
  const [meetingLink, setMeetingLink] = useState("https://meet.google.com/xyz-abcd-xyz");
  const [emailDeliveryFallback, setEmailDeliveryFallback] = useState<{
    reason: string;
    isOpen: boolean;
  } | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const { addInterview } = useSharedContext();

  const filteredCandidates = candidates.filter(
    (candidate) =>
      candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const rankedCandidates = [...filteredCandidates].sort((a, b) => b.aiScore - a.aiScore);

  const getScoreColor = (score: number) => {
    if (score >= 90) return "#10B981";
    if (score >= 80) return "#3B82F6";
    if (score >= 70) return "#F59E0B";
    return "#6B7280";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent Match";
    if (score >= 80) return "Good Match";
    if (score >= 70) return "Fair Match";
    return "Low Match";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved": return "bg-green-100 text-green-700 border border-green-300";
      case "Hired":    return "bg-green-100 text-green-700";
      case "Offer":    return "bg-yellow-100 text-yellow-700";
      case "Interview":return "bg-purple-100 text-purple-700";
      case "Screened": return "bg-blue-100 text-blue-700";
      case "Rejected": return "bg-red-100 text-red-700 border border-red-300";
      default:         return "bg-gray-100 text-gray-700";
    }
  };

  const handleDragStart = (candidate: CandidateData) => {
    setDraggedCandidate(candidate);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: CandidateData["status"]) => {
    e.preventDefault();
    if (draggedCandidate) {
      // updateCandidateStatus does optimistic local update + backend sync
      updateCandidateStatus(draggedCandidate.id, status);
      setDraggedCandidate(null);
    }
  };

  const currentStepIndex = (status: string) => statusSteps.indexOf(status);

  // Open email modal
  const openEmailModal = (candidate: CandidateData) => {
    setEmailCandidate(candidate);
    setEmailSubject("");
    setEmailBody("");
    setShowAITemplates(false);
    setEmailSending(false);
    setEmailDeliveryFallback(null);
  };

  // AI generate email
  const handleAIGenerate = (templateType: string) => {
    if (!emailCandidate) return;
    setIsGeneratingEmail(true);
    setShowAITemplates(false);
    
    if (templateType === "interview_invite") {
      setIsInterviewInvite(true);
      if (!interviewDate) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setInterviewDate(tomorrow.toISOString().split("T")[0]);
      }
      if (!interviewTime) {
        setInterviewTime("11:00");
      }
    } else {
      setIsInterviewInvite(false);
    }
    
    setTimeout(() => {
      const { subject, body } = generateAIEmail(emailCandidate, templateType);
      setEmailSubject(subject);
      setEmailBody(body);
      setIsGeneratingEmail(false);
      toast.success("AI email generated successfully!");
    }, 1200);
  };

  // Send email via automated server
  const handleSendEmail = async () => {
    if (!emailCandidate || !emailSubject.trim() || !emailBody.trim()) {
      toast.error("Please fill in subject and body");
      return;
    }
    
    if (isInterviewInvite && (!interviewDate || !interviewTime)) {
      toast.error("Please provide interview date and time for scheduling.");
      return;
    }
    
    setEmailSending(true);
    
    try {
      const response = await emailApi.send({
        to_email: emailCandidate.email,
        to_name: emailCandidate.name,
        subject: emailSubject,
        body: emailBody,
        is_interview: isInterviewInvite,
        interview_date: interviewDate,
        interview_time: interviewTime,
        meeting_link: meetingLink,
        candidate_id: emailCandidate.id,
      });

      if (response && response.success) {
        if (isInterviewInvite) {
          await addInterview({
            id: Date.now(),
            candidate: emailCandidate.name,
            candidateEmail: emailCandidate.email,
            position: emailCandidate.position,
            date: interviewDate,
            time: interviewTime,
            duration: "45m",
            type: "Video",
            interviewer: "HR Team",
            meetingLink: meetingLink,
            avatar: emailCandidate.avatar,
          });
          toast.success(`Interview scheduled and email delivered to ${emailCandidate.name}!`);
        } else {
          toast.success(`Email successfully delivered to ${emailCandidate.name} (${emailCandidate.email})`);
        }

        setEmailCandidate(null);
        setIsInterviewInvite(false);
        setInterviewDate("");
        setInterviewTime("");
        setEmailDeliveryFallback(null);
      } else {
        // Backend SMTP unconfigured or encountered issue — offer seamless client fallback
        setEmailDeliveryFallback({
          reason: response?.message || "Automated SMTP server is not configured on the backend.",
          isOpen: true,
        });
      }
    } catch (err: any) {
      console.warn("Backend email dispatch error:", err);
      setEmailDeliveryFallback({
        reason: err?.message || "Automated SMTP server is not configured on the backend.",
        isOpen: true,
      });
    } finally {
      setEmailSending(false);
    }
  };

  // Direct client send handler (Gmail, Outlook, Mailto)
  const handleSendViaClient = async (clientType: "gmail" | "outlook" | "mailto") => {
    if (!emailCandidate || !emailSubject.trim() || !emailBody.trim()) {
      toast.error("Please fill in subject and body");
      return;
    }

    let fullBody = emailBody;
    if (isInterviewInvite && (interviewDate || meetingLink)) {
      fullBody += `\n\n--- Scheduled Interview Details ---\nDate: ${interviewDate || "TBD"}\nTime: ${interviewTime || "TBD"}\nMeeting Link: ${meetingLink || "TBD"}`;
    }

    let url = "";
    let clientName = "Default Mail";

    if (clientType === "gmail") {
      url = createGmailComposeUrl(emailCandidate.email, emailSubject, fullBody);
      clientName = "Gmail";
    } else if (clientType === "outlook") {
      url = createOutlookComposeUrl(emailCandidate.email, emailSubject, fullBody);
      clientName = "Outlook";
    } else {
      url = createMailtoUrl(emailCandidate.email, emailSubject, fullBody);
    }

    // Schedule interview if invite
    if (isInterviewInvite && interviewDate && interviewTime) {
      await addInterview({
        id: Date.now(),
        candidate: emailCandidate.name,
        candidateEmail: emailCandidate.email,
        position: emailCandidate.position,
        date: interviewDate,
        time: interviewTime,
        duration: "45m",
        type: "Video",
        interviewer: "HR Team",
        meetingLink: meetingLink,
        avatar: emailCandidate.avatar,
      });
    }

    if (clientType === "mailto") {
      window.location.href = url;
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }

    toast.success(`Opening ${clientName} to send email to ${emailCandidate.name}!`);
    setEmailCandidate(null);
    setIsInterviewInvite(false);
    setInterviewDate("");
    setInterviewTime("");
    setEmailDeliveryFallback(null);
  };

  const handleCopyEmail = () => {
    let fullText = `Subject: ${emailSubject}\n\nTo: ${emailCandidate?.name} <${emailCandidate?.email}>\n\n${emailBody}`;
    if (isInterviewInvite && (interviewDate || meetingLink)) {
      fullText += `\n\n--- Scheduled Interview Details ---\nDate: ${interviewDate}\nTime: ${interviewTime}\nMeeting Link: ${meetingLink}`;
    }
    navigator.clipboard.writeText(fullText);
    setCopiedEmail(true);
    toast.success("Email content copied to clipboard!");
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  // Download resume
  const handleDownloadResume = (candidate: CandidateData) => {
    const resumeText = generateResumeText(candidate);
    const blob = new Blob([resumeText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${candidate.name.replace(/\s+/g, "_")}_Resume.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Resume downloaded for ${candidate.name}`);
  };

  if (candidatesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading candidates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* API Error Banner */}
      {candidatesError && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          ⚠️ Could not connect to backend: {candidatesError}. Showing empty state.
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Candidate Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and track candidates with AI-powered insights
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("table")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
              viewMode === "table"
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "bg-card text-foreground border border-border hover:bg-accent"
            }`}
          >
            Table View
          </button>
          <button
            onClick={() => setViewMode("kanban")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
              viewMode === "kanban"
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "bg-card text-foreground border border-border hover:bg-accent"
            }`}
          >
            Kanban View
          </button>
          <button
            onClick={() => setViewMode("ranking")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all flex items-center gap-2 ${
              viewMode === "ranking"
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "bg-card text-foreground border border-border hover:bg-accent"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            AI Ranking
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search candidates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-input bg-input-background pl-9 pr-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <button className="flex items-center gap-2 rounded-xl border border-input bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-all">
          <Filter className="h-4 w-4" />
          Filter
        </button>
      </div>

      {/* AI Ranking View */}
      {viewMode === "ranking" && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-blue-50 p-6 border border-purple-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-lg bg-primary p-2">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-foreground">AI-Powered Candidate Ranking</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Candidates ranked by AI match score based on skills, experience, and job requirements
            </p>
          </div>

          {rankedCandidates.map((candidate, index) => (
            <div
              key={candidate.id}
              className="rounded-2xl bg-card p-6 shadow-sm border border-border hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-6">
                {/* Rank Badge */}
                <div className="flex-shrink-0">
                  <div
                    className={`h-16 w-16 rounded-xl flex items-center justify-center text-2xl font-bold ${
                      index === 0
                        ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white"
                        : index === 1
                        ? "bg-gradient-to-br from-gray-300 to-gray-500 text-white"
                        : index === 2
                        ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {index === 0 ? "\u{1F947}" : index === 1 ? "\u{1F948}" : index === 2 ? "\u{1F949}" : `#${index + 1}`}
                  </div>
                </div>

                {/* Candidate Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <InitialsAvatar name={candidate.name} src={candidate.avatar} size="lg" />
                      <div>
                        <h3 className="text-lg font-bold text-foreground">{candidate.name}</h3>
                        <p className="text-sm text-muted-foreground">{candidate.position}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {candidate.experience} experience
                        </p>
                      </div>
                    </div>

                    {/* AI Score with Radial Chart */}
                    <div className="flex flex-col items-center">
                      <div className="relative h-24 w-24">
                        <RadialBarChart
                          width={96}
                          height={96}
                          cx="50%"
                          cy="50%"
                          innerRadius="70%"
                          outerRadius="100%"
                          barSize={8}
                          data={[{ value: candidate.aiScore, fill: getScoreColor(candidate.aiScore) }]}
                          startAngle={90}
                          endAngle={-270}
                        >
                          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                          <RadialBar
                            background={{ fill: "#E5E7EB" }}
                            dataKey="value"
                            cornerRadius={10}
                          />
                        </RadialBarChart>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-xl font-bold text-foreground">
                            {candidate.aiScore}
                          </span>
                          <span className="text-[10px] text-muted-foreground">Score</span>
                        </div>
                      </div>
                      <span
                        className="text-xs font-semibold mt-1"
                        style={{ color: getScoreColor(candidate.aiScore) }}
                      >
                        {getScoreLabel(candidate.aiScore)}
                      </span>
                    </div>
                  </div>

                  {/* Match Reasons */}
                  {candidate.matchReasons && candidate.matchReasons.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold text-foreground">Why This Match:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {candidate.matchReasons.map((reason, idx) => (
                          <span
                            key={idx}
                            className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                          >
                            {reason}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  <div className="mb-4">
                    <span className="text-sm font-semibold text-foreground mr-2">Skills:</span>
                    <div className="inline-flex flex-wrap gap-2 mt-1">
                      {candidate.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="rounded-lg bg-muted px-3 py-1 text-xs font-medium text-foreground"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setSelectedProfile(candidate)}
                      className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
                    >
                      <Eye className="h-4 w-4" />
                      View Profile
                    </button>
                    <button
                      onClick={() => openEmailModal(candidate)}
                      className="flex items-center gap-2 rounded-lg border border-input bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-all"
                    >
                      <Mail className="h-4 w-4" />
                      Contact
                    </button>
                    <button
                      onClick={() => handleDownloadResume(candidate)}
                      className="flex items-center gap-2 rounded-lg border border-input bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-all"
                    >
                      <Download className="h-4 w-4" />
                      Resume
                    </button>
                    {/* ── HR Decision Buttons ── */}
                    {candidate.status !== "Approved" && candidate.status !== "Rejected" && (
                      <>
                        <button
                          onClick={() => { updateCandidateStatus(candidate.id, "Approved"); toast.success(`✅ ${candidate.name} approved!`); }}
                          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-all shadow-sm"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => { updateCandidateStatus(candidate.id, "Rejected"); toast.error(`❌ ${candidate.name} rejected.`); }}
                          className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition-all shadow-sm"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </button>
                      </>
                    )}
                    {candidate.status === "Approved" && (
                      <span className="flex items-center gap-1 rounded-lg bg-green-50 border border-green-300 px-4 py-2 text-sm font-semibold text-green-700">
                        <CheckCircle2 className="h-4 w-4" /> Approved
                      </span>
                    )}
                    {candidate.status === "Rejected" && (
                      <span className="flex items-center gap-1 rounded-lg bg-red-50 border border-red-300 px-4 py-2 text-sm font-semibold text-red-700">
                        <XCircle className="h-4 w-4" /> Rejected
                      </span>
                    )}
                    <button
                      onClick={() => { if (window.confirm(`Delete ${candidate.name}? This cannot be undone.`)) { deleteCandidate(candidate.id); toast.success(`${candidate.name} deleted`); } }}
                      className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Kanban View */}
      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {kanbanColumns.map((column) => {
            const columnCandidates = filteredCandidates.filter(
              (c) => c.status === column.id
            );
            return (
              <div key={column.id} className="flex flex-col gap-3">
                <div className={`rounded-xl ${column.color} border ${column.borderColor} p-4`}>
                  <h3 className="text-sm font-bold text-foreground">
                    {column.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {columnCandidates.length} candidate{columnCandidates.length !== 1 ? "s" : ""}
                  </p>
                </div>

                <div
                  className="flex-1 space-y-3 min-h-[500px] rounded-xl border-2 border-dashed border-border bg-muted/20 p-3"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, column.id as CandidateData["status"])}
                >
                  {columnCandidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      draggable
                      onDragStart={() => handleDragStart(candidate)}
                      className="rounded-xl bg-card p-4 shadow-sm border border-border cursor-move hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <InitialsAvatar name={candidate.name} src={candidate.avatar} size="md" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">
                            {candidate.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {candidate.position}
                          </p>
                        </div>
                      </div>

                      {/* AI Score Bar */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-foreground">AI Match</span>
                          <span
                            className="text-xs font-bold"
                            style={{ color: getScoreColor(candidate.aiScore) }}
                          >
                            {candidate.aiScore}%
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${candidate.aiScore}%`,
                              backgroundColor: getScoreColor(candidate.aiScore),
                            }}
                          />
                        </div>
                      </div>

                      {/* Skills */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {candidate.skills.slice(0, 2).map((skill, idx) => (
                          <span
                            key={idx}
                            className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                          >
                            {skill}
                          </span>
                        ))}
                        {candidate.skills.length > 2 && (
                          <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                            +{candidate.skills.length - 2}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedProfile(candidate)}
                          className="flex-1 rounded-lg bg-primary/10 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-all"
                        >
                          View
                        </button>
                        <button
                          onClick={() => openEmailModal(candidate)}
                          className="rounded-lg bg-muted p-1.5 hover:bg-accent transition-all"
                          title="Send Email"
                        >
                          <Mail className="h-3.5 w-3.5 text-foreground" />
                        </button>
                        <button
                          onClick={() => handleDownloadResume(candidate)}
                          className="rounded-lg bg-muted p-1.5 hover:bg-accent transition-all"
                          title="Download Resume"
                        >
                          <Download className="h-3.5 w-3.5 text-foreground" />
                        </button>
                      </div>
                      {/* ── HR Decision Buttons (Kanban) ── */}
                      {candidate.status !== "Approved" && candidate.status !== "Rejected" && (
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => { updateCandidateStatus(candidate.id, "Approved"); toast.success(`✅ ${candidate.name} approved!`); }}
                            className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-green-600 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition-all"
                          >
                            <CheckCircle2 className="h-3 w-3" /> Approve
                          </button>
                          <button
                            onClick={() => { updateCandidateStatus(candidate.id, "Rejected"); toast.error(`❌ ${candidate.name} rejected.`); }}
                            className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-red-500 py-1.5 text-xs font-semibold text-white hover:bg-red-600 transition-all"
                          >
                            <XCircle className="h-3 w-3" /> Reject
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => { if (window.confirm(`Delete ${candidate.name}?`)) { deleteCandidate(candidate.id); toast.success(`${candidate.name} deleted`); } }}
                        className="w-full flex items-center justify-center gap-1 rounded-lg border border-red-200 bg-red-50 py-1.5 mt-1 text-xs font-medium text-red-600 hover:bg-red-100 transition-all"
                      >
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <div className="rounded-2xl bg-card shadow-sm border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground">
                    Candidate
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground">
                    Position
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground">
                    AI Match Score
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground">
                    Experience
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.map((candidate) => (
                  <tr key={candidate.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <InitialsAvatar name={candidate.name} src={candidate.avatar} size="md" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {candidate.name}
                          </p>
                          <p className="text-xs text-muted-foreground">{candidate.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-foreground">{candidate.position}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12">
                          <RadialBarChart
                            width={48}
                            height={48}
                            cx="50%"
                            cy="50%"
                            innerRadius="70%"
                            outerRadius="100%"
                            barSize={6}
                            data={[{ value: candidate.aiScore, fill: getScoreColor(candidate.aiScore) }]}
                            startAngle={90}
                            endAngle={-270}
                          >
                            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                            <RadialBar
                              background={{ fill: "#E5E7EB" }}
                              dataKey="value"
                              cornerRadius={10}
                            />
                          </RadialBarChart>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-bold text-foreground">
                              {candidate.aiScore}
                            </span>
                          </div>
                        </div>
                        <span
                          className="text-sm font-semibold"
                          style={{ color: getScoreColor(candidate.aiScore) }}
                        >
                          {getScoreLabel(candidate.aiScore)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-foreground">{candidate.experience}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(candidate.status)}`}
                      >
                        {candidate.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedProfile(candidate)}
                          className="rounded-lg bg-primary/10 p-2 hover:bg-primary/20 transition-all"
                          title="View Profile"
                        >
                          <Eye className="h-4 w-4 text-primary" />
                        </button>
                        <button
                          onClick={() => openEmailModal(candidate)}
                          className="rounded-lg bg-muted p-2 hover:bg-accent transition-all"
                          title="Send Email"
                        >
                          <Mail className="h-4 w-4 text-foreground" />
                        </button>
                        <button
                          onClick={() => handleDownloadResume(candidate)}
                          className="rounded-lg bg-muted p-2 hover:bg-accent transition-all"
                          title="Download Resume"
                        >
                          <Download className="h-4 w-4 text-foreground" />
                        </button>
                        {/* ── HR Decision Buttons (Table) ── */}
                        {candidate.status !== "Approved" && candidate.status !== "Rejected" ? (
                          <>
                            <button
                              onClick={() => { updateCandidateStatus(candidate.id, "Approved"); toast.success(`✅ ${candidate.name} approved!`); }}
                              className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 transition-all shadow-sm"
                              title="Approve Candidate"
                            >
                              <CheckCircle2 className="h-4 w-4" /> Approve
                            </button>
                            <button
                              onClick={() => { updateCandidateStatus(candidate.id, "Rejected"); toast.error(`❌ ${candidate.name} rejected.`); }}
                              className="flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white hover:bg-red-600 transition-all shadow-sm"
                              title="Reject Candidate"
                            >
                              <XCircle className="h-4 w-4" /> Reject
                            </button>
                          </>
                        ) : candidate.status === "Approved" ? (
                          <span className="flex items-center gap-1 rounded-lg bg-green-50 border border-green-300 px-3 py-2 text-xs font-semibold text-green-700">
                            <CheckCircle2 className="h-4 w-4" /> Approved
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 rounded-lg bg-red-50 border border-red-300 px-3 py-2 text-xs font-semibold text-red-700">
                            <XCircle className="h-4 w-4" /> Rejected
                          </span>
                        )}
                        <button
                          onClick={() => { if (window.confirm(`Delete ${candidate.name}?`)) { deleteCandidate(candidate.id); toast.success(`${candidate.name} deleted`); } }}
                          className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 hover:bg-red-100 transition-all"
                          title="Delete Candidate"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Candidate Profile Modal */}
      {selectedProfile && !emailCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedProfile(null)}>
          <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>
            {/* Profile Header */}
            <div className="relative">
              <div className="h-32 rounded-t-2xl bg-gradient-to-r from-primary via-purple-500 to-blue-500" />
              <button
                onClick={() => setSelectedProfile(null)}
                className="absolute top-4 right-4 rounded-full bg-white/20 backdrop-blur-sm p-2 text-white hover:bg-white/30 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="absolute -bottom-12 left-6 flex items-end gap-4">
                <InitialsAvatar
                  name={selectedProfile.name}
                  src={selectedProfile.avatar}
                  size="lg"
                  className="rounded-2xl border-4 border-card shadow-lg !h-24 !w-24"
                />
              </div>
            </div>

            <div className="pt-16 px-6 pb-6">
              {/* Name & Title */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{selectedProfile.name}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{selectedProfile.position}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(selectedProfile.status)}`}>
                      {selectedProfile.status}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Applied {new Date(selectedProfile.appliedDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                </div>

                {/* AI Score */}
                <div className="flex flex-col items-center">
                  <div className="relative h-28 w-28">
                    <RadialBarChart
                      width={112}
                      height={112}
                      cx="50%"
                      cy="50%"
                      innerRadius="70%"
                      outerRadius="100%"
                      barSize={10}
                      data={[{ value: selectedProfile.aiScore, fill: getScoreColor(selectedProfile.aiScore) }]}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                      <RadialBar
                        background={{ fill: "#E5E7EB" }}
                        dataKey="value"
                        cornerRadius={10}
                      />
                    </RadialBarChart>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-foreground">{selectedProfile.aiScore}</span>
                      <span className="text-[10px] text-muted-foreground">AI Score</span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold mt-1" style={{ color: getScoreColor(selectedProfile.aiScore) }}>
                    {getScoreLabel(selectedProfile.aiScore)}
                  </span>
                </div>
              </div>

              {/* Contact & Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="rounded-xl border border-border p-4 space-y-3">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    Contact Information
                  </h4>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Mail className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="text-sm font-medium text-foreground">{selectedProfile.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Phone className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="text-sm font-medium text-foreground">{selectedProfile.phone}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border p-4 space-y-3">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-primary" />
                    Professional Details
                  </h4>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Briefcase className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Position Applied</p>
                        <p className="text-sm font-medium text-foreground">{selectedProfile.position}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Clock className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Experience</p>
                        <p className="text-sm font-medium text-foreground">{selectedProfile.experience}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pipeline Progress */}
              <div className="rounded-xl border border-border p-4 mb-6">
                <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Pipeline Progress
                </h4>
                <div className="flex items-center gap-1">
                  {statusSteps.map((step, idx) => {
                    const stepIdx = currentStepIndex(selectedProfile.status);
                    const isCompleted = idx <= stepIdx;
                    const isCurrent = idx === stepIdx;
                    return (
                      <div key={step} className="flex-1 flex flex-col items-center">
                        <div className="flex items-center w-full">
                          {idx > 0 && (
                            <div className={`flex-1 h-1 rounded-full ${isCompleted ? "bg-primary" : "bg-gray-200"}`} />
                          )}
                          <div
                            className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                              isCurrent
                                ? "border-primary bg-primary text-white scale-110 shadow-lg shadow-primary/30"
                                : isCompleted
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-gray-200 bg-gray-50 text-gray-400"
                            }`}
                          >
                            {isCompleted && !isCurrent ? (
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              idx + 1
                            )}
                          </div>
                          {idx < statusSteps.length - 1 && (
                            <div className={`flex-1 h-1 rounded-full ${idx < stepIdx ? "bg-primary" : "bg-gray-200"}`} />
                          )}
                        </div>
                        <span className={`text-xs mt-2 ${isCurrent ? "font-bold text-primary" : isCompleted ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Skills */}
              <div className="rounded-xl border border-border p-4 mb-6">
                <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  Skills & Expertise
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProfile.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="rounded-xl bg-primary/10 px-4 py-2 text-sm font-medium text-primary"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* AI Match Reasons */}
              {selectedProfile.matchReasons && selectedProfile.matchReasons.length > 0 && (
                <div className="rounded-xl border border-border p-4 mb-6">
                  <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    AI Match Analysis
                  </h4>
                  <div className="space-y-2">
                    {selectedProfile.matchReasons.map((reason, idx) => (
                      <div key={idx} className="flex items-center gap-3 rounded-lg bg-green-50 border border-green-200 px-4 py-3">
                        <div className="shrink-0 h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
                          <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-green-800">{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => openEmailModal(selectedProfile)}
                  className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/25"
                >
                  <Mail className="h-4 w-4" />
                  Send Email
                </button>
                <button
                  onClick={() => {
                    window.open(`tel:${selectedProfile.phone}`, "_self");
                    toast.success(`Calling ${selectedProfile.name}...`);
                  }}
                  className="flex items-center gap-2 rounded-xl border border-input bg-card px-6 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-all"
                >
                  <Phone className="h-4 w-4" />
                  Call
                </button>
                <button
                  onClick={() => handleDownloadResume(selectedProfile)}
                  className="flex items-center gap-2 rounded-xl border border-input bg-card px-6 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-all"
                >
                  <Download className="h-4 w-4" />
                  Download Resume
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Compose Modal */}
      {emailCandidate && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={() => setEmailCandidate(null)}>
          <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>
            {/* Email Header */}
            <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary p-2">
                    <Mail className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Compose Email</h3>
                    <p className="text-xs text-muted-foreground">To: {emailCandidate.name} &lt;{emailCandidate.email}&gt;</p>
                  </div>
                </div>
                <button onClick={() => setEmailCandidate(null)} className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-all">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Recipient Card */}
              <div className="flex items-center gap-3 rounded-xl bg-accent/50 border border-border p-3">
                <img src={emailCandidate.avatar} alt={emailCandidate.name} className="h-10 w-10 rounded-full object-cover" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{emailCandidate.name}</p>
                  <p className="text-xs text-muted-foreground">{emailCandidate.position} &middot; {emailCandidate.experience} experience</p>
                </div>
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(emailCandidate.status)}`}>
                  {emailCandidate.status}
                </span>
              </div>

              {/* AI Generate Section */}
              <div className="relative">
                <button
                  onClick={() => setShowAITemplates(!showAITemplates)}
                  disabled={isGeneratingEmail}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary hover:bg-primary/10 hover:border-primary/50 transition-all disabled:opacity-50"
                >
                  {isGeneratingEmail ? (
                    <>
                      <Sparkles className="h-4 w-4 animate-spin" />
                      Generating with AI...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4" />
                      Generate with AI
                      <ChevronRight className={`h-4 w-4 transition-transform ${showAITemplates ? "rotate-90" : ""}`} />
                    </>
                  )}
                </button>

                {showAITemplates && (
                  <div className="mt-2 rounded-xl border border-border bg-card p-3 shadow-lg space-y-1.5">
                    <p className="text-xs font-semibold text-muted-foreground px-2 pb-1">Choose a template:</p>
                    {[
                      { key: "interview_invite", label: "Interview Invitation", desc: "Invite candidate for an interview", icon: "text-blue-600 bg-blue-100" },
                      { key: "follow_up", label: "Follow Up", desc: "Check in on application status", icon: "text-purple-600 bg-purple-100" },
                      { key: "offer_letter", label: "Offer Letter", desc: "Extend a job offer", icon: "text-green-600 bg-green-100" },
                      { key: "rejection", label: "Rejection Notice", desc: "Politely decline the candidate", icon: "text-red-600 bg-red-100" },
                    ].map((template) => (
                      <button
                        key={template.key}
                        onClick={() => handleAIGenerate(template.key)}
                        className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-accent transition-all text-left"
                      >
                        <div className={`rounded-lg p-2 ${template.icon}`}>
                          <Sparkles className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{template.label}</p>
                          <p className="text-xs text-muted-foreground">{template.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Calendar Sync Inputs */}
              {isInterviewInvite && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-primary/5 p-4 rounded-xl border border-primary/20">
                  <div className="col-span-1 sm:col-span-3">
                    <p className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4" /> Schedule Interview (Sync to Calendar)
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1.5 block">Date</label>
                    <input
                      type="date"
                      value={interviewDate}
                      onChange={(e) => setInterviewDate(e.target.value)}
                      className="w-full rounded-lg border border-input bg-input-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1.5 block">Time</label>
                    <input
                      type="time"
                      value={interviewTime}
                      onChange={(e) => setInterviewTime(e.target.value)}
                      className="w-full rounded-lg border border-input bg-input-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1.5 block">Meeting Link</label>
                    <input
                      type="url"
                      value={meetingLink}
                      onChange={(e) => setMeetingLink(e.target.value)}
                      className="w-full rounded-lg border border-input bg-input-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              )}

              {/* Subject */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Subject</label>
                <input
                  type="text"
                  placeholder="Enter email subject..."
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full rounded-xl border border-input bg-input-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              {/* Body */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Message</label>
                <textarea
                  placeholder="Write your email message here..."
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={12}
                  className="w-full rounded-xl border border-input bg-input-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                />
              </div>

              {/* Fallback Notice if Automated SMTP is Unconfigured */}
              {emailDeliveryFallback?.isOpen && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        Email Service Notice
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {emailDeliveryFallback.reason} You can instantly send this email directly from your email client below:
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleSendViaClient("gmail")}
                      className="flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-all"
                    >
                      <Mail className="h-3.5 w-3.5" /> Send via Gmail
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendViaClient("outlook")}
                      className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-all"
                    >
                      <Mail className="h-3.5 w-3.5" /> Send via Outlook
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendViaClient("mailto")}
                      className="flex items-center gap-1.5 rounded-lg border border-input bg-card hover:bg-accent text-foreground px-3.5 py-1.5 text-xs font-semibold transition-all"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Default Mail App
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      className="flex items-center gap-1.5 rounded-lg border border-input bg-card hover:bg-accent text-foreground px-3 py-1.5 text-xs font-medium transition-all"
                    >
                      {copiedEmail ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedEmail ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">Quick send:</span>
                  <button
                    type="button"
                    onClick={() => handleSendViaClient("gmail")}
                    title="Open in Gmail Web"
                    className="flex items-center gap-1 rounded-lg border border-input bg-card px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-accent hover:border-red-400/50 transition-all"
                  >
                    <span className="h-2 w-2 rounded-full bg-red-500" /> Gmail
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendViaClient("outlook")}
                    title="Open in Outlook Web"
                    className="flex items-center gap-1 rounded-lg border border-input bg-card px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-accent hover:border-blue-400/50 transition-all"
                  >
                    <span className="h-2 w-2 rounded-full bg-blue-500" /> Outlook
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    title="Copy message to clipboard"
                    className="flex items-center gap-1 rounded-lg border border-input bg-card px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-all"
                  >
                    {copiedEmail ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedEmail ? "Copied" : "Copy"}
                  </button>
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setEmailCandidate(null);
                      setIsInterviewInvite(false);
                      setInterviewDate("");
                      setInterviewTime("");
                      setEmailDeliveryFallback(null);
                    }}
                    className="rounded-xl border-2 border-input px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-accent transition-all"
                  >
                    Discard
                  </button>
                  <button
                    onClick={handleSendEmail}
                    disabled={emailSending || !emailSubject.trim() || !emailBody.trim()}
                    className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {emailSending ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send Email
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}