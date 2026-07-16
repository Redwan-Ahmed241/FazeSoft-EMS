import { useState, useRef, useCallback } from "react";
import {
  Palette,
  Globe,
  Bell,
  Mail,
  Moon,
  Sun,
  Monitor,
  Zap,
  Upload,
  RotateCcw,
  Save,
  Shield,
  Trash2,
  Eye,
  EyeOff,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner@2.0.3";
import { useTheme } from "../context/ThemeContext";
import { useEffect } from "react";

interface SettingsState {
  theme: "light" | "dark" | "system";
  brandColor: string;
  logoPreview: string | null;
  language: string;
  timezone: string;
  dateFormat: string;
  notifications: {
    newApplication: boolean;
    interviewReminder: boolean;
    statusUpdate: boolean;
    teamActivity: boolean;
  };
  emailFrequency: "realtime" | "daily" | "weekly" | "never";
  performance: {
    enableAnimations: boolean;
    autoRefresh: boolean;
  };
  privacy: {
    showProfile: boolean;
    twoFactor: boolean;
  };
}

const defaultSettings: SettingsState = {
  theme: "light",
  brandColor: "#5932EA",
  logoPreview: null,
  language: "English (US)",
  timezone: "Eastern Time (ET)",
  dateFormat: "MM/DD/YYYY",
  notifications: {
    newApplication: true,
    interviewReminder: true,
    statusUpdate: true,
    teamActivity: false,
  },
  emailFrequency: "realtime",
  performance: {
    enableAnimations: true,
    autoRefresh: true,
  },
  privacy: {
    showProfile: true,
    twoFactor: false,
  },
};

const brandColors = [
  { name: "Purple", value: "#5932EA" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Green", value: "#10B981" },
  { name: "Red", value: "#EF4444" },
  { name: "Orange", value: "#F59E0B" },
  { name: "Pink", value: "#EC4899" },
];

const languages = [
  "English (US)",
  "English (UK)",
  "Spanish",
  "French",
  "German",
  "Portuguese",
  "Chinese (Simplified)",
  "Japanese",
  "Korean",
  "Arabic",
];

const timezones = [
  "Eastern Time (ET)",
  "Pacific Time (PT)",
  "Central Time (CT)",
  "Mountain Time (MT)",
  "GMT (London)",
  "CET (Berlin)",
  "IST (India)",
  "JST (Tokyo)",
  "AEST (Sydney)",
];

const dateFormats = ["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD", "DD-MMM-YYYY"];

export function Settings() {
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<SettingsState>({ ...defaultSettings, theme });
  const [savedSettings, setSavedSettings] = useState<SettingsState>({ ...defaultSettings, theme });
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("fazemate_settings");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings((prev) => ({ ...prev, ...parsed, theme }));
        setSavedSettings((prev) => ({ ...prev, ...parsed, theme }));
      } catch (e) {
        console.error("Failed to load settings:", e);
      }
    }
  }, []);

  // Sync state if theme changes globally
  useEffect(() => {
    setSettings((prev) => ({ ...prev, theme }));
    setSavedSettings((prev) => ({ ...prev, theme }));
  }, [theme]);
  const [changePasswordModal, setChangePasswordModal] = useState(false);
  const [passwordFields, setPasswordFields] = useState({
    current: "",
    newPass: "",
    confirm: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    newPass: false,
    confirm: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(savedSettings);

  const updateSetting = useCallback(
    <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const updateNotification = useCallback(
    (key: keyof SettingsState["notifications"], value: boolean) => {
      setSettings((prev) => ({
        ...prev,
        notifications: { ...prev.notifications, [key]: value },
      }));
    },
    []
  );

  const updatePerformance = useCallback(
    (key: keyof SettingsState["performance"], value: boolean) => {
      setSettings((prev) => ({
        ...prev,
        performance: { ...prev.performance, [key]: value },
      }));
    },
    []
  );

  const updatePrivacy = useCallback(
    (key: keyof SettingsState["privacy"], value: boolean) => {
      setSettings((prev) => ({
        ...prev,
        privacy: { ...prev.privacy, [key]: value },
      }));
    },
    []
  );

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 800));
    
    // Save to localStorage
    localStorage.setItem("fazemate_settings", JSON.stringify(settings));
    
    setSavedSettings({ ...settings });
    setIsSaving(false);
    toast.success("Settings saved successfully!", {
      description: "Your preferences have been updated.",
    });
  };

  const handleReset = () => {
    setSettings({ ...defaultSettings });
    setTheme(defaultSettings.theme);
    toast.info("Settings reset to defaults", {
      description: "Click Save to apply the default settings.",
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File too large", {
        description: "Please upload an image smaller than 2MB.",
      });
      return;
    }

    if (!["image/svg+xml", "image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast.error("Invalid file type", {
        description: "Please upload a SVG, PNG, JPG, or WebP file.",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      updateSetting("logoPreview", ev.target?.result as string);
      toast.success("Logo uploaded", {
        description: `${file.name} has been set as the new logo.`,
      });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveLogo = () => {
    updateSetting("logoPreview", null);
    toast.info("Logo removed");
  };

  const handleChangePassword = () => {
    if (!passwordFields.current) {
      toast.error("Please enter your current password");
      return;
    }
    if (passwordFields.newPass.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (passwordFields.newPass !== passwordFields.confirm) {
      toast.error("New passwords do not match");
      return;
    }
    setChangePasswordModal(false);
    setPasswordFields({ current: "", newPass: "", confirm: "" });
    toast.success("Password changed successfully!");
  };

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(false);
    toast.success("Account deletion requested", {
      description: "You will receive a confirmation email shortly.",
    });
  };

  // Toggle switch component
  const Toggle = ({
    checked,
    onChange,
  }: {
    checked: boolean;
    onChange: (val: boolean) => void;
  }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-4 focus:ring-primary/20 ${
        checked ? "bg-primary" : "bg-gray-200"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow border border-gray-200 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0.5"
        } mt-0.5`}
      />
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Customize your experience and system preferences
          </p>
        </div>
        {hasChanges && (
          <span className="inline-flex items-center gap-1.5 text-sm text-amber-600 bg-amber-50 rounded-full px-3 py-1 border border-amber-200">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            Unsaved changes
          </span>
        )}
      </div>

      {/* ========== Appearance ========== */}
      <div className="rounded-2xl bg-card p-6 shadow-sm border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-lg bg-primary/10 p-2">
            <Palette className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Appearance</h2>
            <p className="text-sm text-muted-foreground">
              Customize the look and feel of your dashboard
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Theme Selection */}
          <div>
            <label className="text-sm font-medium text-foreground mb-3 block">Theme Mode</label>
            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  { key: "light", icon: Sun, label: "Light" },
                  { key: "dark", icon: Moon, label: "Dark" },
                  { key: "system", icon: Monitor, label: "System" },
                ] as const
              ).map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setTheme(key)}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                    settings.theme === key
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Icon className="h-6 w-6 text-foreground" />
                  <span className="text-sm font-medium text-foreground">{label}</span>
                  {settings.theme === key && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Brand Color */}
          <div>
            <label className="text-sm font-medium text-foreground mb-3 block">Brand Color</label>
            <div className="grid grid-cols-6 gap-3">
              {brandColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => updateSetting("brandColor", color.value)}
                  className={`relative h-12 rounded-xl transition-all ${
                    settings.brandColor === color.value
                      ? "ring-2 ring-offset-2 ring-primary scale-110"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                >
                  {settings.brandColor === color.value && (
                    <Check className="absolute inset-0 m-auto h-6 w-6 text-white" />
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-4">
              <label className="text-xs text-muted-foreground">Custom:</label>
              <input
                type="color"
                value={settings.brandColor}
                onChange={(e) => updateSetting("brandColor", e.target.value)}
                className="h-8 w-14 rounded border border-input cursor-pointer"
              />
              <span className="text-xs font-mono text-muted-foreground">
                {settings.brandColor}
              </span>
            </div>
          </div>

          {/* Logo Upload */}
          <div>
            <label className="text-sm font-medium text-foreground mb-3 block">Company Logo</label>
            <div className="flex items-center gap-4">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-xl overflow-hidden"
                style={{ backgroundColor: settings.brandColor }}
              >
                {settings.logoPreview ? (
                  <img
                    src={settings.logoPreview}
                    alt="Logo preview"
                    className="h-full w-full object-contain p-1"
                  />
                ) : (
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" fillOpacity="0.9" />
                    <path
                      d="M2 17L12 22L22 17"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M2 12L12 17L22 12"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".svg,.png,.jpg,.jpeg,.webp"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 rounded-xl border-2 border-input px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent transition-all"
                  >
                    <Upload className="h-4 w-4" />
                    Upload New Logo
                  </button>
                  {settings.logoPreview && (
                    <button
                      onClick={handleRemoveLogo}
                      className="flex items-center gap-2 rounded-xl border-2 border-red-200 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 transition-all"
                    >
                      <X className="h-4 w-4" />
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  SVG, PNG, JPG, WebP (max. 2MB)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== Language & Region ========== */}
      <div className="rounded-2xl bg-card p-6 shadow-sm border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-lg bg-primary/10 p-2">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Language & Region</h2>
            <p className="text-sm text-muted-foreground">
              Set your preferred language and timezone
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Language</label>
            <select
              value={settings.language}
              onChange={(e) => updateSetting("language", e.target.value)}
              className="w-full rounded-lg border border-input bg-input-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Timezone</label>
            <select
              value={settings.timezone}
              onChange={(e) => updateSetting("timezone", e.target.value)}
              className="w-full rounded-lg border border-input bg-input-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {timezones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Date Format</label>
            <select
              value={settings.dateFormat}
              onChange={(e) => updateSetting("dateFormat", e.target.value)}
              className="w-full rounded-lg border border-input bg-input-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {dateFormats.map((fmt) => (
                <option key={fmt} value={fmt}>
                  {fmt}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-lg bg-muted/30 border border-border p-3 mt-2">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Preview:</span>{" "}
              {settings.dateFormat === "MM/DD/YYYY"
                ? "03/01/2026"
                : settings.dateFormat === "DD/MM/YYYY"
                ? "01/03/2026"
                : settings.dateFormat === "YYYY-MM-DD"
                ? "2026-03-01"
                : "01-Mar-2026"}{" "}
              &middot; {settings.language} &middot; {settings.timezone}
            </p>
          </div>
        </div>
      </div>

      {/* ========== Notification Preferences ========== */}
      <div className="rounded-2xl bg-card p-6 shadow-sm border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-lg bg-primary/10 p-2">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Notification Preferences</h2>
            <p className="text-sm text-muted-foreground">
              Choose what notifications you want to receive
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {(
            [
              {
                key: "newApplication" as const,
                title: "New Application",
                desc: "Get notified when someone applies to a job",
              },
              {
                key: "interviewReminder" as const,
                title: "Interview Reminder",
                desc: "Remind me before scheduled interviews",
              },
              {
                key: "statusUpdate" as const,
                title: "Status Update",
                desc: "Updates on candidate pipeline progress",
              },
              {
                key: "teamActivity" as const,
                title: "Team Activity",
                desc: "Updates from your recruitment team",
              },
            ] as const
          ).map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4"
            >
              <div>
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <Toggle
                checked={settings.notifications[item.key]}
                onChange={(val) => updateNotification(item.key, val)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ========== Email Notifications ========== */}
      <div className="rounded-2xl bg-card p-6 shadow-sm border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-lg bg-primary/10 p-2">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Email Notifications</h2>
            <p className="text-sm text-muted-foreground">
              Manage email notification frequency
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {(
            [
              {
                key: "realtime" as const,
                title: "Real-time",
                desc: "Get emails as events happen",
              },
              {
                key: "daily" as const,
                title: "Daily Digest",
                desc: "One email per day with all updates",
              },
              {
                key: "weekly" as const,
                title: "Weekly Summary",
                desc: "Weekly roundup of important activities",
              },
              {
                key: "never" as const,
                title: "Never",
                desc: "No email notifications",
              },
            ] as const
          ).map((item) => (
            <label
              key={item.key}
              className={`flex items-center gap-3 cursor-pointer rounded-lg border p-4 transition-all ${
                settings.emailFrequency === item.key
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <div
                className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  settings.emailFrequency === item.key
                    ? "border-primary"
                    : "border-gray-300"
                }`}
              >
                {settings.emailFrequency === item.key && (
                  <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                )}
              </div>
              <div className="flex-1" onClick={() => updateSetting("emailFrequency", item.key)}>
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              {settings.emailFrequency === item.key && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </label>
          ))}
        </div>
      </div>

      {/* ========== Performance ========== */}
      <div className="rounded-2xl bg-card p-6 shadow-sm border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-lg bg-primary/10 p-2">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Performance</h2>
            <p className="text-sm text-muted-foreground">
              Optimize your dashboard experience
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Enable Animations</p>
              <p className="text-xs text-muted-foreground">
                Show smooth transitions and effects
              </p>
            </div>
            <Toggle
              checked={settings.performance.enableAnimations}
              onChange={(val) => updatePerformance("enableAnimations", val)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Auto-refresh Data</p>
              <p className="text-xs text-muted-foreground">
                Automatically update dashboard metrics
              </p>
            </div>
            <Toggle
              checked={settings.performance.autoRefresh}
              onChange={(val) => updatePerformance("autoRefresh", val)}
            />
          </div>
        </div>
      </div>

      {/* ========== Privacy & Security ========== */}
      <div className="rounded-2xl bg-card p-6 shadow-sm border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-lg bg-primary/10 p-2">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Privacy & Security</h2>
            <p className="text-sm text-muted-foreground">
              Manage your account security settings
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Public Profile</p>
              <p className="text-xs text-muted-foreground">
                Allow others to see your profile information
              </p>
            </div>
            <Toggle
              checked={settings.privacy.showProfile}
              onChange={(val) => updatePrivacy("showProfile", val)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Two-Factor Authentication</p>
              <p className="text-xs text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
            <Toggle
              checked={settings.privacy.twoFactor}
              onChange={(val) => {
                updatePrivacy("twoFactor", val);
                toast[val ? "success" : "info"](
                  val
                    ? "Two-factor authentication enabled"
                    : "Two-factor authentication disabled"
                );
              }}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Change Password</p>
              <p className="text-xs text-muted-foreground">
                Update your account password
              </p>
            </div>
            <button
              onClick={() => setChangePasswordModal(true)}
              className="rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-all"
            >
              Change
            </button>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50/50 p-4">
            <div>
              <p className="text-sm font-semibold text-red-600">Delete Account</p>
              <p className="text-xs text-muted-foreground">
                Permanently delete your account and all data
              </p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-all"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* ========== Save / Reset Buttons ========== */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 pb-4">
        <button
          onClick={handleReset}
          className="flex items-center justify-center gap-2 rounded-xl border-2 border-input px-6 py-2.5 text-sm font-semibold text-foreground hover:bg-accent transition-all"
        >
          <RotateCcw className="h-4 w-4" />
          Reset to Defaults
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all ${
            isSaving
              ? "bg-primary/70 cursor-not-allowed"
              : hasChanges
              ? "bg-primary hover:bg-primary/90"
              : "bg-primary/50 cursor-default"
          }`}
        >
          {isSaving ? (
            <>
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save All Settings
            </>
          )}
        </button>
      </div>

      {/* ========== Change Password Modal ========== */}
      {changePasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-full bg-primary/10 p-3">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Change Password</h3>
                <p className="text-xs text-muted-foreground">
                  Enter your current and new password
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {(
                [
                  { key: "current" as const, label: "Current Password", placeholder: "Enter current password" },
                  { key: "newPass" as const, label: "New Password", placeholder: "Enter new password" },
                  { key: "confirm" as const, label: "Confirm New Password", placeholder: "Re-enter new password" },
                ] as const
              ).map((field) => (
                <div key={field.key}>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    {field.label}
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords[field.key] ? "text" : "password"}
                      value={passwordFields[field.key]}
                      onChange={(e) =>
                        setPasswordFields((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                      placeholder={field.placeholder}
                      className="w-full rounded-lg border border-input bg-input-background px-4 py-2.5 pr-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswords((prev) => ({
                          ...prev,
                          [field.key]: !prev[field.key],
                        }))
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPasswords[field.key] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}

              {passwordFields.newPass && passwordFields.newPass.length < 8 && (
                <p className="text-xs text-red-500">Password must be at least 8 characters</p>
              )}
              {passwordFields.confirm &&
                passwordFields.newPass !== passwordFields.confirm && (
                  <p className="text-xs text-red-500">Passwords do not match</p>
                )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setChangePasswordModal(false);
                  setPasswordFields({ current: "", newPass: "", confirm: "" });
                }}
                className="flex-1 rounded-xl border-2 border-input py-2.5 text-sm font-semibold text-foreground hover:bg-accent transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== Delete Account Confirmation Modal ========== */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-red-100 p-3">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Delete Account</h3>
                <p className="text-xs text-muted-foreground">This action cannot be undone</p>
              </div>
            </div>

            <div className="rounded-xl bg-red-50 border border-red-200 p-4 mb-6">
              <p className="text-sm text-red-700">
                Deleting your account will permanently remove:
              </p>
              <ul className="mt-2 space-y-1 text-xs text-red-600">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                  All your profile data and preferences
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                  All job postings you&apos;ve created
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                  Your entire interview history
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                  All candidate records and notes
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-xl border-2 border-input py-2.5 text-sm font-semibold text-foreground hover:bg-accent transition-all"
              >
                Keep Account
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-all"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
