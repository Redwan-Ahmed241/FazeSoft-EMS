import { useState, useEffect } from "react";
import { Camera, Mail, Phone, MapPin, Briefcase, Calendar, Shield, Key, Bell, Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useSharedContext } from "../../context/SharedContext";
import { toast } from "sonner";
import InitialsAvatar from "../../components/common/ui/InitialsAvatar";

export function Profile() {
  const { user, updateProfile } = useAuth();
  const { candidates, addCandidate } = useSharedContext();
  const [activeTab, setActiveTab] = useState<"personal" | "security">("personal");

  const nameParts = user?.name ? user.name.split(" ") : ["", ""];
  const initialFirstName = nameParts[0] || "";
  const initialLastName = nameParts.slice(1).join(" ") || "";

  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [phone, setPhone] = useState(user?.phone || "");
  const [location, setLocation] = useState(user?.location || "");
  const [jobTitle, setJobTitle] = useState(user?.job_title || "");
  const [bio, setBio] = useState(user?.bio || "");
  
  // Extended employee fields
  const [employeeId, setEmployeeId] = useState(user?.employee_id || "");
  const [dob, setDob] = useState(user?.dob || "");
  const [joiningDate, setJoiningDate] = useState(user?.joining_date || "");
  const [bloodGroup, setBloodGroup] = useState(user?.blood_group || "");
  const [permanentAddress, setPermanentAddress] = useState(user?.permanent_address || "");
  const [address, setAddress] = useState(user?.address || "");
  const [tin, setTin] = useState(user?.tin || "");
  const [bankAccountNo, setBankAccountNo] = useState(user?.bank_account_no || "");
  const [nidNo, setNidNo] = useState(user?.nid_no || "");
  const [fathersName, setFathersName] = useState(user?.fathers_name || "");
  const [mothersName, setMothersName] = useState(user?.mothers_name || "");
  const [emergencyContact, setEmergencyContact] = useState(user?.emergency_contact || "");
  const [dateOfExit, setDateOfExit] = useState(user?.date_of_exit || "");
  const [lastSalary, setLastSalary] = useState(user?.last_salary || "");
  const [isSaving, setIsSaving] = useState(false);

  // Sync state if user changes
  useEffect(() => {
    if (user) {
      const parts = user.name ? user.name.split(" ") : ["", ""];
      setFirstName(parts[0] || "");
      setLastName(parts.slice(1).join(" ") || "");
      setPhone(user.phone || "");
      setLocation(user.location || "");
      setJobTitle(user.job_title || "");
      setBio(user.bio || "");
      setEmployeeId(user.employee_id || "");
      setDob(user.dob || "");
      setJoiningDate(user.joining_date || "");
      setBloodGroup(user.blood_group || "");
      setPermanentAddress(user.permanent_address || "");
      setAddress(user.address || "");
      setTin(user.tin || "");
      setBankAccountNo(user.bank_account_no || "");
      setNidNo(user.nid_no || "");
      setFathersName(user.fathers_name || "");
      setMothersName(user.mothers_name || "");
      setEmergencyContact(user.emergency_contact || "");
      setDateOfExit(user.date_of_exit || "");
      setLastSalary(user.last_salary || "");
    }
  }, [user]);

  // Dynamic Tenure Calculation
  const calculateTenure = (startStr?: string, exitStr?: string) => {
    if (!startStr) return "N/A";
    try {
      const start = new Date(startStr);
      if (isNaN(start.getTime())) return "N/A";
      const end = exitStr ? new Date(exitStr) : new Date();
      if (isNaN(end.getTime())) return "N/A";
      
      let years = end.getFullYear() - start.getFullYear();
      let months = end.getMonth() - start.getMonth();
      
      if (months < 0) {
        years--;
        months += 12;
      }
      
      if (years === 0 && months === 0) {
        const diffDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return `${diffDays} days`;
      }
      
      const yearPart = years > 0 ? `${years} yr${years > 1 ? "s" : ""}` : "";
      const monthPart = months > 0 ? `${months} mo${months > 1 ? "s" : ""}` : "";
      
      return [yearPart, monthPart].filter(Boolean).join(" ");
    } catch (e) {
      return "N/A";
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const fullName = `${firstName} ${lastName}`.trim();
      await updateProfile({
        name: fullName,
        phone,
        location,
        job_title: jobTitle,
        bio,
        employee_id: employeeId,
        dob,
        joining_date: joiningDate,
        blood_group: bloodGroup,
        permanent_address: permanentAddress,
        address,
        tin,
        bank_account_no: bankAccountNo,
        nid_no: nidNo,
        fathers_name: fathersName,
        mothers_name: mothersName,
        emergency_contact: emergencyContact,
        date_of_exit: dateOfExit,
        last_salary: lastSalary,
      });

      if (user?.role === "candidate") {
        const matched = candidates.find((c) => c.email === user.email);
        await addCandidate({
          name: fullName,
          email: user.email,
          phone: phone,
          position: jobTitle || matched?.position || "Candidate",
          aiScore: matched?.aiScore ?? 85,
          experience: matched?.experience ?? "",
          skills: matched?.skills ?? [],
          education: matched?.education ?? [],
          certifications: matched?.certifications ?? [],
          status: matched?.status ?? "Applied",
          avatar: user.avatar || matched?.avatar || "",
          appliedDate: matched?.appliedDate ?? new Date().toISOString().split("T")[0],
          matchReasons: matched?.matchReasons ?? [],
        });
      }
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error("Failed to update profile: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your personal information and security settings
        </p>
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl bg-card p-6 shadow-sm border border-border">
        <div className="flex flex-col items-center gap-4 pb-6 border-b border-border md:flex-row">
          <div className="relative">
            <InitialsAvatar
              name={`${firstName} ${lastName}`.trim() || "User"}
              src={user?.avatar}
              size="lg"
              className="!h-24 !w-24 text-3xl font-bold"
            />
            <button className="absolute bottom-0 right-0 rounded-full bg-primary p-2 text-white shadow-lg hover:bg-primary/90 transition-all">
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-xl font-bold text-foreground">{firstName} {lastName}</h2>
            <p className="text-sm text-muted-foreground">{jobTitle || (user?.role === "hr" ? "HR Professional" : user?.role === "employee" ? "Employee" : user?.role === "admin" ? "Administrator" : "Candidate")}</p>
            <div className="mt-2 flex flex-wrap gap-2 justify-center md:justify-start">
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                <Shield className="h-3 w-3" />
                Verified Account
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
                {user?.role === "hr" ? "HR Manager" : user?.role === "employee" ? "Employee Portal" : user?.role === "admin" ? "Admin Portal" : "Candidate Portal"}
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                if (user) {
                  const parts = user.name ? user.name.split(" ") : ["", ""];
                  setFirstName(parts[0] || "");
                  setLastName(parts.slice(1).join(" ") || "");
                  setPhone(user.phone || "");
                  setLocation(user.location || "");
                  setJobTitle(user.job_title || "");
                  setBio(user.bio || "");
                  setEmployeeId(user.employee_id || "");
                  setDob(user.dob || "");
                  setJoiningDate(user.joining_date || "");
                  setBloodGroup(user.blood_group || "");
                  setPermanentAddress(user.permanent_address || "");
                  setAddress(user.address || "");
                  setTin(user.tin || "");
                  setBankAccountNo(user.bank_account_no || "");
                  setNidNo(user.nid_no || "");
                  setFathersName(user.fathers_name || "");
                  setMothersName(user.mothers_name || "");
                  setEmergencyContact(user.emergency_contact || "");
                  setDateOfExit(user.date_of_exit || "");
                  setLastSalary(user.last_salary || "");
                }
              }}
              className="rounded-xl border-2 border-input px-6 py-2 text-sm font-semibold text-foreground hover:bg-accent transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 border-b border-border">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("personal")}
              className={`pb-3 text-sm font-semibold transition-all ${
                activeTab === "personal"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Personal Information
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`pb-3 text-sm font-semibold transition-all ${
                activeTab === "security"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Security Settings
            </button>
          </div>
        </div>

        {/* Personal Information Tab */}
        {activeTab === "personal" && (
          <div className="mt-6 space-y-8">
            {/* Group 1: Identity & Position */}
            <div className="space-y-4">
              <h3 className="text-md font-bold text-foreground border-b border-border pb-2">Identity & Position</h3>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full rounded-lg border border-input bg-input-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full rounded-lg border border-input bg-input-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Employee ID</label>
                  <input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="EMP-1004"
                    className="w-full rounded-lg border border-input bg-input-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Designation / Position</label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="Senior Frontend Developer"
                    className="w-full rounded-lg border border-input bg-input-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            {/* Group 2: Contact & Personal Details */}
            <div className="space-y-4">
              <h3 className="text-md font-bold text-foreground border-b border-border pb-2">Personal Details</h3>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="w-full rounded-lg border border-input bg-muted px-4 py-2.5 text-sm outline-none cursor-not-allowed text-muted-foreground"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="w-full rounded-lg border border-input bg-input-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Date of Birth</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full rounded-lg border border-input bg-input-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full rounded-lg border border-input bg-input-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Group 3: Addresses */}
            <div className="space-y-4">
              <h3 className="text-md font-bold text-foreground border-b border-border pb-2">Address Details</h3>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    Present Address
                  </label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Present Street, City, Country"
                    className="w-full rounded-lg border border-input bg-input-background px-4 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    Permanent Address
                  </label>
                  <textarea
                    rows={2}
                    value={permanentAddress}
                    onChange={(e) => setPermanentAddress(e.target.value)}
                    placeholder="456 Permanent Road, District, Country"
                    className="w-full rounded-lg border border-input bg-input-background px-4 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            {/* Group 4: Identification & Finance */}
            <div className="space-y-4">
              <h3 className="text-md font-bold text-foreground border-b border-border pb-2">Identification & Finance</h3>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">TIN Number</label>
                  <input
                    type="text"
                    value={tin}
                    onChange={(e) => setTin(e.target.value)}
                    placeholder="1234567890"
                    className="w-full rounded-lg border border-input bg-input-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">NID / National ID Number</label>
                  <input
                    type="text"
                    value={nidNo}
                    onChange={(e) => setNidNo(e.target.value)}
                    placeholder="1995000000000000"
                    className="w-full rounded-lg border border-input bg-input-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Bank Account Number</label>
                  <input
                    type="text"
                    value={bankAccountNo}
                    onChange={(e) => setBankAccountNo(e.target.value)}
                    placeholder="0021-123456789-01"
                    className="w-full rounded-lg border border-input bg-input-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Last Salary Withdrawn</label>
                  <input
                    type="text"
                    value={lastSalary}
                    onChange={(e) => setLastSalary(e.target.value)}
                    placeholder="$4,500 / Month"
                    className="w-full rounded-lg border border-input bg-input-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            {/* Group 5: Family & Emergency */}
            <div className="space-y-4">
              <h3 className="text-md font-bold text-foreground border-b border-border pb-2">Family & Emergency Contacts</h3>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Father's Name</label>
                  <input
                    type="text"
                    value={fathersName}
                    onChange={(e) => setFathersName(e.target.value)}
                    className="w-full rounded-lg border border-input bg-input-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Mother's Name</label>
                  <input
                    type="text"
                    value={mothersName}
                    onChange={(e) => setMothersName(e.target.value)}
                    className="w-full rounded-lg border border-input bg-input-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Emergency Contact Name/Relation</label>
                  <input
                    type="text"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="Jane Doe (Spouse) - +1 (555) 987-6543"
                    className="w-full rounded-lg border border-input bg-input-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            {/* Group 6: Tenure & History */}
            <div className="space-y-4">
              <h3 className="text-md font-bold text-foreground border-b border-border pb-2">Job Tenure & History</h3>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Date of Joining (DOJ)</label>
                  <input
                    type="date"
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                    className="w-full rounded-lg border border-input bg-input-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Date of Exit</label>
                  <input
                    type="date"
                    value={dateOfExit}
                    onChange={(e) => setDateOfExit(e.target.value)}
                    className="w-full rounded-lg border border-input bg-input-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="md:col-span-2">
                  <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
                    <p className="text-sm font-semibold text-primary">Job Tenure Calculation</p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {calculateTenure(joiningDate, dateOfExit)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Computed dynamically based on Date of Joining and Date of Exit (or today's date if active).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Bio / Executive Summary
              </label>
              <textarea
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write a brief professional summary..."
                className="w-full rounded-lg border border-input bg-input-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        )}

        {/* Security Settings Tab */}
        {activeTab === "security" && (
          <div className="mt-6 space-y-6">
            {/* Change Password */}
            <div className="rounded-xl bg-muted/30 p-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Key className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Change Password</h3>
                  <p className="text-sm text-muted-foreground">
                    Update your password to keep your account secure
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Current Password
                </label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  className="w-full rounded-lg border border-input bg-card px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  className="w-full rounded-lg border border-input bg-card px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  className="w-full rounded-lg border border-input bg-card px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <button className="w-full rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all">
                Update Password
              </button>
            </div>

            {/* Two-Factor Authentication */}
            <div className="rounded-xl bg-muted/30 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-100 p-2">
                    <Shield className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      Two-Factor Authentication (2FA)
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" defaultChecked className="peer sr-only" />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20"></div>
                </label>
              </div>
              <p className="text-sm text-green-600 font-medium">
                ✓ Two-factor authentication is enabled
              </p>
            </div>

            {/* Session Management */}
            <div className="rounded-xl bg-muted/30 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Active Sessions</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage devices where you're currently logged in
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Chrome on Windows - Current
                    </p>
                    <p className="text-xs text-muted-foreground">New York, NY • Just now</p>
                  </div>
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                    Active
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Safari on iPhone</p>
                    <p className="text-xs text-muted-foreground">New York, NY • 2 hours ago</p>
                  </div>
                  <button className="text-sm font-medium text-red-500 hover:text-red-600">
                    Revoke
                  </button>
                </div>
              </div>
            </div>

            {/* Notifications Toggle */}
            <div className="rounded-xl bg-muted/30 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Security Notifications
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Get notified about important security events
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-medium text-foreground">
                    Login from new device
                  </span>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-medium text-foreground">
                    Password change attempts
                  </span>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-medium text-foreground">
                    Unusual account activity
                  </span>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
