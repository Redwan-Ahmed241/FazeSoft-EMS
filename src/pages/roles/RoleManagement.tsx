import React, { useEffect, useState, useMemo } from "react";
import {
  ShieldCheck,
  Search,
  Shield,
  Loader2,
  RefreshCw,
  UserCheck,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner@2.0.3";
import { useAuth } from "../../context/AuthContext";
import { authApi } from "../../api/auth";
import type { UserOut } from "../../types/auth";
import InitialsAvatar from "../../components/common/ui/InitialsAvatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/common/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/common/ui/select";

// AVAILABLE ROLES IN DB (CTO excluded from dropdown per business rules)
const AVAILABLE_ROLES = [
  { name: "Junior_Frontend", desc: "Junior Frontend Developer" },
  { name: "Junior_Backend", desc: "Junior Backend Developer" },
  { name: "Senior_Backend", desc: "Senior Backend Developer" },
  { name: "Head_of_Operations", desc: "Head of Operations" },
  { name: "Intern", desc: "General Intern" },
  { name: "HR_Manager", desc: "HR Manager" },
  { name: "Senior_Frontend", desc: "Senior Frontend Developer" },
  { name: "Backend_Intern", desc: "Backend Intern" },
  { name: "DBA", desc: "Database Administrator" },
  { name: "DBA_Intern", desc: "Database Administration Intern" },
  { name: "HR", desc: "Human Resources" },
  { name: "Frontend_Intern", desc: "Frontend Intern" },
  { name: "Candidate", desc: "Candidate" },
];

export function RoleManagement() {
  const { user: authUser } = useAuth();
  const [users, setUsers] = useState<UserOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [selectedUser, setSelectedUser] = useState<UserOut | null>(null);
  const [newRole, setNewRole] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await authApi.listUsers();
      setUsers(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load users.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users in real-time by name or current role
  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return users;
    return users.filter((u) => {
      const name = (u.full_name || u.email || "").toLowerCase();
      const roleName = (u.role_name || u.role || "").toLowerCase();
      const roleDesc = (u.role_desc || "").toLowerCase();
      return name.includes(q) || roleName.includes(q) || roleDesc.includes(q);
    });
  }, [users, searchQuery]);

  const handleOpenModal = (targetUser: UserOut) => {
    setSelectedUser(targetUser);
    setNewRole(targetUser.role_name || targetUser.role || "Candidate");
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setSelectedUser(null);
    setNewRole("");
  };

  const handleConfirmChange = async () => {
    if (!selectedUser || !newRole) return;
    setIsSubmitting(true);
    try {
      await authApi.changeRole(selectedUser.id, { role_name: newRole });
      toast.success("Role updated successfully");
      handleCloseModal();
      await fetchUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update role.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                Role Management
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Manage and assign roles to team members
              </p>
            </div>
          </div>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-muted/60 text-foreground border border-border font-medium text-sm hover:bg-muted transition cursor-pointer flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
            title="Refresh list"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or current role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-input-background border border-border rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Users Table Card */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
            <p className="text-sm text-muted-foreground font-medium">Loading users...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="p-3 bg-destructive/10 text-destructive rounded-full mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">Failed to load users</p>
            <p className="text-xs text-muted-foreground mb-4 max-w-sm">{error}</p>
            <button
              onClick={fetchUsers}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition shadow-xs cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="p-3 bg-muted rounded-full mb-3 text-muted-foreground">
              <UserCheck className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">No users found</p>
            <p className="text-xs text-muted-foreground">
              {searchQuery
                ? `No team members match "${searchQuery}"`
                : "No registered users found."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="py-3.5 px-6">Name</th>
                  <th className="py-3.5 px-6">Current Role</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredUsers.map((targetUser) => {
                  const displayName =
                    targetUser.full_name || targetUser.email.split("@")[0] || "User";
                  const roleName = targetUser.role_name || targetUser.role;
                  const roleDesc = targetUser.role_desc || roleName;
                  const isCTO = roleName?.trim().toUpperCase() === "CTO";
                  const isSelf =
                    authUser?.id &&
                    (String(targetUser.id) === String(authUser.id) ||
                      targetUser.email === authUser.email);
                  const canChangeThisUser = !isCTO && !isSelf;

                  return (
                    <tr
                      key={targetUser.id}
                      className="border-b border-border/60 hover:bg-muted/30 transition"
                    >
                      {/* Name Column */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <InitialsAvatar
                            name={displayName}
                            src={targetUser.avatar || undefined}
                            size="md"
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-foreground truncate flex items-center gap-2">
                              <span>{displayName}</span>
                              {isSelf && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {targetUser.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Current Role Column */}
                      <td className="py-4 px-6">
                        {roleName ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">
                              {roleDesc || roleName}
                            </span>
                            {roleDesc && roleDesc !== roleName && (
                              <span className="text-[11px] text-muted-foreground font-mono">
                                ({roleName})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">(No Role)</span>
                        )}
                      </td>

                      {/* Action Column */}
                      <td className="py-4 px-6 text-right">
                        {canChangeThisUser ? (
                          <button
                            onClick={() => handleOpenModal(targetUser)}
                            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground font-medium text-xs hover:bg-primary/90 transition shadow-xs cursor-pointer"
                          >
                            <Shield className="w-3.5 h-3.5" />
                            <span>Change Role</span>
                          </button>
                        ) : isCTO ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                            CTO Protected
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
                            Self
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Change Role Dialog Modal */}
      <Dialog open={Boolean(selectedUser)} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Change Role
            </DialogTitle>
            <DialogDescription>
              Select a new organizational role for this team member.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4 py-2">
              <div className="rounded-xl bg-card border border-border p-4 shadow-sm space-y-2">
                <div className="text-xs text-muted-foreground font-medium">User</div>
                <div className="text-sm font-semibold text-foreground">
                  {selectedUser.full_name || selectedUser.email}
                </div>
                <div className="text-xs text-muted-foreground">
                  Current Role:{" "}
                  <span className="font-medium text-foreground">
                    {selectedUser.role_desc || selectedUser.role_name || selectedUser.role || "(No Role)"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  New Role
                </label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className="w-full rounded-xl bg-input-background border border-border h-10 px-3 text-sm focus:border-primary">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    side="bottom"
                    sideOffset={4}
                    avoidCollisions={false}
                    className="max-h-60 overflow-y-auto bg-white text-foreground border border-border shadow-2xl z-[99999]"
                    style={{ backgroundColor: "#ffffff", maxHeight: "240px", zIndex: 99999 }}
                  >
                    {AVAILABLE_ROLES.map((role) => (
                      <SelectItem key={role.name} value={role.name}>
                        <div className="flex flex-col text-left py-0.5">
                          <span className="font-semibold text-foreground text-sm">{role.name}</span>
                          <span className="text-xs text-muted-foreground">{role.desc}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground italic">
                  Note: CTO role is restricted and excluded from reassignment.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <button
              type="button"
              onClick={handleCloseModal}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-muted/60 text-foreground border border-border font-medium text-sm hover:bg-muted transition cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmChange}
              disabled={isSubmitting || !newRole}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Confirm Change"
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default RoleManagement;
