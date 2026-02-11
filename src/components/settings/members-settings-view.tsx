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
import { updateMemberRole } from "@/actions/workspace";
import { toast } from "sonner";
import type { Tables } from "@/types/database";
import { Users, Shield, Crown, User } from "lucide-react";

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

const roleBadgeColors: Record<string, string> = {
  Admin: "bg-accent-violet/20 text-accent-violet",
  Manager: "bg-accent-cyan/20 text-accent-cyan",
  Member: "bg-bg-elevated text-text-secondary",
};

const statusColors: Record<string, string> = {
  Active: "bg-signal-success/20 text-signal-success",
  Invited: "bg-signal-warning/20 text-signal-warning",
  Deactivated: "bg-signal-danger/20 text-signal-danger",
};

export function MembersSettingsView({ members: initialMembers }: { members: MemberWithUser[] }) {
  const [members, setMembers] = useState(initialMembers);
  const [loading, setLoading] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
      {/* Summary */}
      <GlassCard>
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-accent-violet" />
          <div>
            <h3 className="text-sm font-semibold text-text-primary">
              {members.length} {members.length === 1 ? "Member" : "Members"}
            </h3>
            <p className="mt-0.5 text-xs text-text-tertiary">
              {members.filter((m) => m.role === "Admin").length} Admin ·{" "}
              {members.filter((m) => m.role === "Manager").length} Managers ·{" "}
              {members.filter((m) => m.role === "Member").length} Members
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Member list */}
      <div className="space-y-2">
        {members.map((member) => {
          const RoleIcon = roleIcons[member.role] || User;
          const user = member.users;

          return (
            <GlassCard key={member.id}>
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
                      member.status === "Active" ? "bg-signal-success" : "bg-text-tertiary"
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
                </div>
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
    </div>
  );
}
