import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Video, Clock, User, Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { useSharedContext, type InterviewData } from "../../context/SharedContext";
import { useAuth } from "../../context/AuthContext";
import InitialsAvatar from "../../components/common/ui/InitialsAvatar";

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const now = new Date();
const TODAY_STR = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

export function CalendarPage() {
  const { interviews, addInterview, removeInterview, candidates } = useSharedContext();
  const { user } = useAuth();
  const isHR = user?.role === "hr";
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // Schedule form state
  const [formCandidate, setFormCandidate] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formType, setFormType] = useState("HR Round");
  const [formInterviewer, setFormInterviewer] = useState("");
  const [formDuration, setFormDuration] = useState("1 hour");

  const resetForm = () => {
    setFormCandidate("");
    setFormDate("");
    setFormTime("");
    setFormType("HR Round");
    setFormInterviewer("");
    setFormDuration("1 hour");
  };

  const formatTimeTo12Hr = (time24: string) => {
    const [h, m] = time24.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
  };

  const handleSchedule = () => {
    if (!formCandidate || !formDate || !formTime || !formInterviewer) {
      toast.error("Please fill in all required fields");
      return;
    }

    // formCandidate may be "Name (email)" or just "Name"
    const emailMatch = formCandidate.match(/\(([^)]+)\)$/);
    const extractedEmail = emailMatch ? emailMatch[1] : "";
    const nameOnly = formCandidate.includes("(") ? formCandidate.substring(0, formCandidate.lastIndexOf("(")).trim() : formCandidate;
    
    // Find candidate primarily by email, fallback to name
    const matchedCandidate = candidates.find((c) => 
      (extractedEmail && c.email === extractedEmail) || c.name === nameOnly
    );

    const newInterview: InterviewData = {
      id: Date.now(),
      candidate: matchedCandidate?.name || nameOnly,
      candidateEmail: matchedCandidate?.email || extractedEmail,
      position: matchedCandidate?.position || "Open Position",
      date: formDate,
      time: formatTimeTo12Hr(formTime),
      duration: formDuration,
      type: formType,
      interviewer: formInterviewer,
      meetingLink: `https://meet.google.com/${Math.random().toString(36).substr(2, 12)}`,
      avatar: matchedCandidate?.avatar || "",
    };

    addInterview(newInterview);
    setShowScheduleModal(false);
    resetForm();
    toast.success(`Interview scheduled with ${formCandidate} on ${new Date(formDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`);
  };

  const handleRemoveInterview = (id: number) => {
    const interview = interviews.find((i) => i.id === id);
    removeInterview(id);
    setConfirmDeleteId(null);
    toast.success(`Interview with ${interview?.candidate || "candidate"} has been cancelled`);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getInterviewsForDate = (day: number | null) => {
    if (!day) return [];
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return interviews.filter((interview) => interview.date === dateStr);
  };

  const isToday = (day: number | null) => {
    if (!day) return false;
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const todayInterviews = interviews.filter((i) => i.date === TODAY_STR);
  const upcomingInterviews = interviews.filter((i) => i.date > TODAY_STR);

  const days = getDaysInMonth(currentDate);

  const handleDayClick = (day: number) => {
    if (!isHR) return; // Candidates cannot schedule interviews
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(dateStr);
    setFormDate(dateStr);
    setShowScheduleModal(true);
  };

  // Unique candidate list for dropdown
  // mapping candidates to options later

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isHR ? "Interview Calendar" : "My Interview Schedule"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isHR
              ? "Automated interview scheduling and management"
              : "View your scheduled interviews and upcoming meetings"}
          </p>
        </div>
        {isHR && (
          <button
            onClick={() => {
              resetForm();
              setShowScheduleModal(true);
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all"
          >
            <Plus className="h-4 w-4" />
            Schedule Interview
          </button>
        )}
      </div>

      {/* Today's Interviews Card */}
      {todayInterviews.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-blue-50 p-6 shadow-sm border border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Today's Interviews</h2>
            <span className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {todayInterviews.map((interview) => (
              <div key={interview.id} className="rounded-xl bg-white p-4 shadow-sm border border-border">
                <div className="flex items-start gap-3 mb-3">
                  <img
                    src={interview.avatar}
                    alt={interview.candidate}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-foreground">{interview.candidate}</h3>
                    <p className="text-xs text-muted-foreground">{interview.position}</p>
                  </div>
                  {isHR && (
                    <button
                      onClick={() => setConfirmDeleteId(interview.id)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-all"
                      title="Cancel interview"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{interview.time} ({interview.duration})</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    <span>{interview.interviewer}</span>
                  </div>
                  <span className="inline-flex rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    {interview.type}
                  </span>
                </div>
                <button className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all">
                  <Video className="h-4 w-4" />
                  Start Meeting
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="rounded-2xl bg-card p-6 shadow-sm border border-border">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={goToPreviousMonth}
              className="rounded-lg border border-input p-2 hover:bg-accent transition-all"
            >
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </button>
            <button
              onClick={goToNextMonth}
              className="rounded-lg border border-input p-2 hover:bg-accent transition-all"
            >
              <ChevronRight className="h-5 w-5 text-foreground" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {daysOfWeek.map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {days.map((day, index) => {
            const dayInterviews = getInterviewsForDate(day);
            const today = isToday(day);
            return (
              <div
                key={index}
                className={`min-h-24 rounded-lg border p-2 transition-all ${
                  day
                    ? today
                      ? `border-primary bg-primary/5 ${isHR ? "cursor-pointer hover:border-primary hover:bg-primary/10" : ""}`
                      : `border-border bg-background ${isHR ? "cursor-pointer hover:border-primary hover:bg-accent" : ""}`
                    : "border-transparent bg-transparent"
                }`}
                onClick={() => day && isHR && handleDayClick(day)}
              >
                {day && (
                  <>
                    <div className={`text-sm font-semibold mb-1 ${today ? "text-primary" : "text-foreground"}`}>
                      {day}
                    </div>
                    <div className="space-y-1">
                      {dayInterviews.slice(0, 2).map((interview) => (
                        <div
                          key={interview.id}
                          className="rounded px-1.5 py-1 text-xs font-medium bg-primary/10 text-primary truncate"
                          title={`${interview.time} - ${interview.candidate}`}
                        >
                          {interview.time}
                        </div>
                      ))}
                      {dayInterviews.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayInterviews.length - 2} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Interviews */}
      {upcomingInterviews.length > 0 && (
        <div className="rounded-2xl bg-card p-6 shadow-sm border border-border">
          <h2 className="text-lg font-bold text-foreground mb-4">Upcoming Interviews</h2>
          <div className="space-y-3">
            {upcomingInterviews.map((interview) => (
              <div
                key={interview.id}
                className="flex items-center gap-4 rounded-xl border border-border p-4 hover:bg-accent transition-all"
              >
                <InitialsAvatar name={interview.candidate} src={interview.avatar} size="lg" />
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-foreground">{interview.candidate}</h3>
                  <p className="text-xs text-muted-foreground">{interview.position}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">
                    {new Date(interview.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                  <p className="text-xs text-muted-foreground">{interview.time}</p>
                </div>
                <span className="hidden sm:inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {interview.type}
                </span>
                <button className="rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-all">
                  View
                </button>
                {isHR && (
                  <button
                    onClick={() => setConfirmDeleteId(interview.id)}
                    className="rounded-lg bg-red-50 p-2 text-red-400 hover:bg-red-100 hover:text-red-600 transition-all"
                    title="Cancel interview"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl">
            <h3 className="text-xl font-bold text-foreground mb-6">Schedule New Interview</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Candidate *
                </label>
                <select
                  value={formCandidate}
                  onChange={(e) => setFormCandidate(e.target.value)}
                  className="w-full rounded-lg border border-input bg-input-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select candidate...</option>
                  {candidates.map((c) => {
                    const value = c.email ? `${c.name} (${c.email})` : c.name;
                    return (
                      <option key={c.id || c.email || c.name} value={value}>
                        {c.name} {c.email ? `(${c.email})` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Date *</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full rounded-lg border border-input bg-input-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Time *</label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full rounded-lg border border-input bg-input-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Interview Type
                </label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full rounded-lg border border-input bg-input-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option>HR Round</option>
                  <option>Technical Interview</option>
                  <option>Portfolio Review</option>
                  <option>Final Interview</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Interviewer *
                </label>
                <select
                  value={formInterviewer}
                  onChange={(e) => setFormInterviewer(e.target.value)}
                  className="w-full rounded-lg border border-input bg-input-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select interviewer...</option>
                  <option>Rahim Uddin</option>
                  <option>Karim Hossain</option>
                  <option>Jahid Hasan</option>
                  <option>Mehedi Hasan</option>
                  <option>Ariful Islam</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Duration
                </label>
                <select
                  value={formDuration}
                  onChange={(e) => setFormDuration(e.target.value)}
                  className="w-full rounded-lg border border-input bg-input-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option>30 minutes</option>
                  <option>45 minutes</option>
                  <option>1 hour</option>
                  <option>1.5 hours</option>
                  <option>2 hours</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowScheduleModal(false);
                    resetForm();
                  }}
                  className="flex-1 rounded-xl border-2 border-input py-2.5 text-sm font-semibold text-foreground hover:bg-accent transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSchedule}
                  className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
                >
                  Schedule & Send Invite
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId !== null && (() => {
        const interviewToDelete = interviews.find((i) => i.id === confirmDeleteId);
        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-red-100 p-3">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Cancel Interview</h3>
                <p className="text-xs text-muted-foreground">This action cannot be undone</p>
              </div>
            </div>

            {interviewToDelete && (
              <div className="rounded-xl bg-muted/30 border border-border p-4 mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <InitialsAvatar name={interviewToDelete.candidate} src={interviewToDelete.avatar} size="sm" />
                  <div>
                    <p className="text-sm font-bold text-foreground">{interviewToDelete.candidate}</p>
                    <p className="text-xs text-muted-foreground">{interviewToDelete.position}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {new Date(interviewToDelete.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {interviewToDelete.time}
                  </span>
                  <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {interviewToDelete.type}
                  </span>
                </div>
              </div>
            )}

            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to cancel this interview? The interviewer and candidate will need to be notified separately.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 rounded-xl border-2 border-input py-2.5 text-sm font-semibold text-foreground hover:bg-accent transition-all"
              >
                Keep Interview
              </button>
              <button
                onClick={() => handleRemoveInterview(confirmDeleteId)}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-all"
              >
                Cancel Interview
              </button>
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
}