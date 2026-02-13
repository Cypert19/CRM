"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/gradient-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { updateMemberRole, inviteMember, removeMember } from "@/actions/workspace";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { toast } from "sonner";
import type { Tables } from "@/types/database";
import { Users, Shield, Crown, User, UserPlus, UserMinus } from "lucide-react";

type MemberWithUser = Tables<"workspace_members"> & {
  users: Tables<"users">;
};

const ROLES = ["Admin", "Manager", "Member"] as const;

const roleIcons: Record<string, typeof Shield> = {
  Admin: Crown,
  Manager: Shield,
  Member: User,
};

const roleColors: Record<string, string> = {
  Admin: "text-accent-violet",
  Manager: "text-accent-cyan",
  Member: "text-text-secondary",
};

const statusColors: Record<string, string> = {
  Active: "bg-signal-success/20 text-signal-success",
  Invited: "bg-signal-warning/20 text-signal-warning",
  Deactivated: "bg-signal-danger/20 text-signal-danger",
};

export function MembersSettingsView({ members: initialMembers, isAdmin = false }: { members: MemberWithUser[]; isAdmin?: boolean }) {
  const [members, setMembers] = useState(initialMembers);
  const [loading, setLoading] = useState<string | null>(null);

  // Invite dialog state
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"Admin" | "Manager" | "Member">("Member");
  const [inviting, setInviting] = useState(false);

  // Remove dialog state
  const [memberToRemove, setMemberToRemove] = useState<MemberWithUser | null>(null);

  const handleRoleChange = async (memberId: string, newRole: "Admin" | "Manager" | "Member") => {
    setLoading(memberId);

    const result = await updateMemberRole(memberId, newRole);

    setLoading(null);
    if (result.success) {
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      );
      toast.success("Role updated");
    } else {
      toast.error(result.error || "Failed to update role");
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setInviting(true);
    const result = await inviteMember({ email: inviteEmail.trim(), role: inviteRole });
    setInviting(false);

    if (result.success) {
      const status = result.data?.status;
      if (status === "Reactivated") {
        toast.success(`${inviteEmail} has been reactivated as ${inviteRole}`);
      } else if (status === "Active") {
        toast.success(`${inviteEmail} has been added as ${inviteRole}`);
      } else {
        toast.success(`Invitation sent to ${inviteEmail}`);
      }
      setShowInviteDialog(false);
      setInviteEmail("");
      setInviteRole("Member");
      // Refresh members list — server action revalidates the path,
      // but we need to refetch for the client state
      window.location.reload();
    } else {
      toast.error(result.error || "Failed to invite member");
    }
  };

  const handleRemove = async () => {
    if (!memberToRemove) return;

    const result = await removeMember(memberToRemove.id);
    if (result.success) {
      toast.success(`${memberToRemove.users?.full_name || "Member"} has been removed`);
      setMembers((prev) =>
        prev.map((m) =>
          m.id === memberToRemove.id ? { ...m, status: "Deactivated" } : m
        )
      );
    } else {
      toast.error(result.error || "Failed to remove member");
    }
    setMemberToRemove(null);
  };

  // Show active/invited first, then deactivated
  const sortedMembers = [...members].sort((a, b) => {
    const order: Record<string, number> = { Active: 0, Invited: 1, Deactivated: 2 };
    return (order[a.status] ?? 3) - (order[b.status] ?? 3);
  });

  return (
    <div className="space-y-6">
      {/* Summary + Invite Button */}
      <GlassCard>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-accent-violet" />
            <div>
              <h3 className="text-sm font-semibold text-text-primary">
                {members.filter((m) => m.status !== "Deactivated").length}{" "}
                {members.filter((m) => m.status !== "Deactivated").length === 1 ? "Member" : "Members"}
              </h3>
              <p className="mt-0.5 text-xs text-text-tertiary">
                {members.filter((m) => m.role === "Admin" && m.status !== "Deactivated").length} Admin ·{" "}
                {members.filter((m) => m.role === "Manager" && m.status !== "Deactivated").length} Managers ·{" "}
                {members.filter((m) => m.role === "Member" && m.status !== "Deactivated").length} Members
              </p>
            </div>
          </div>
          {isAdmin && (
            <Button onClick={() => setShowInviteDialog(true)} size="sm">
              <UserPlus className="h-3.5 w-3.5" />
              Invite Member
            </Button>
          )}
        </div>
      </GlassCard>

      {/* Member list */}
      <div className="space-y-2">
        {sortedMembers.map((member) => {
          const RoleIcon = roleIcons[member.role] || User;
          const user = member.users;
          const isDeactivated = member.status === "Deactivated";

          return (
            <GlassCard key={member.id} className={isDeactivated ? "opacity-50" : ""}>
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="relative shrink-0">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bg-elevated">
                      <span className="text-sm font-medium text-text-secondary">
                        {user?.full_name
                          ?.split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2) || "?"}
                      </span>
                    </div>
                  )}
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-bg-card ${
                      member.status === "Active" ? "bg-signal-success" : member.status === "Invited" ? "bg-signal-warning" : "bg-text-tertiary"
                    }`}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary truncate">
                      {user?.full_name || "Unknown User"}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[member.status] || ""}`}
                    >
                      {member.status}
                    </span>
                  </div>
                  <span className="text-xs text-text-tertiary truncate block">
                    {user?.email || "No email"}
                  </span>
                </div>

                {/* Role selector */}
                <div className="flex items-center gap-2 shrink-0">
                  <RoleIcon className={`h-4 w-4 ${roleColors[member.role] || ""}`} />
                  {isAdmin && !isDeactivated ? (
                    <Select
                      value={member.role}
                      onValueChange={(val) =>
                        handleRoleChange(member.id, val as "Admin" | "Manager" | "Member")
                      }
                      disabled={loading === member.id}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-sm text-text-secondary w-[120px]">{member.role}</span>
                  )}
                </div>

                {/* Remove button (admin only, can't remove self, not already deactivated) */}
                {isAdmin && !isDeactivated && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-signal-danger hover:bg-signal-danger/10 shrink-0"
                    onClick={() => setMemberToRemove(member)}
                  >
                    <UserMinus className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

              {/* Meta info */}
              <div className="mt-2 flex items-center gap-4 text-[10px] text-text-tertiary">
                <span>
                  Joined: {new Date(member.created_at).toLocaleDateString()}
                </span>
                {member.last_login_at && (
                  <span>
                    Last login: {new Date(member.last_login_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </GlassCard>
          );
        })}
      </div>

      {members.length === 0 && (
        <GlassCard>
          <div className="py-8 text-center">
            <Users className="mx-auto h-10 w-10 text-text-tertiary/50" />
            <p className="mt-3 text-sm text-text-secondary">No members found</p>
            <p className="mt-1 text-xs text-text-tertiary">
              Invite team members to collaborate in this workspace
            </p>
          </div>
        </GlassCard>
      )}

      {/* Invite Member Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join this workspace. They&apos;ll receive an email with a link to get started.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !inviting) handleInvite();
                }}
                autoFocus
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                Role
              </label>
              <Select
                value={inviteRole}
                onValueChange={(val) => setInviteRole(val as "Admin" | "Manager" | "Member")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">
                    Admin — Full access, manage settings & members
                  </SelectItem>
                  <SelectItem value="Manager">
                    Manager — Manage deals, contacts & team data
                  </SelectItem>
                  <SelectItem value="Member">
                    Member — View and manage own data
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInviteDialog(false)}
              disabled={inviting}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
              <UserPlus className="h-3.5 w-3.5" />
              {inviting ? "Sending..." : "Send Invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation */}
      <ConfirmDeleteDialog
        open={!!memberToRemove}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
        title="Remove Member"
        description={`Are you sure you want to remove ${memberToRemove?.users?.full_name || "this member"} from the workspace? They will lose access but their data will be preserved.`}
        entityName={memberToRemove?.users?.full_name || "Member"}
        onConfirm={handleRemove}
      />
    </div>
  );
}
