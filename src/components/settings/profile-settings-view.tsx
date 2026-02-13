"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Camera,
  Trash2,
  Save,
  Lock,
  Eye,
  EyeOff,
  Mail,
  Shield,
  Calendar,
  Building2,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/gradient-button";
import { Avatar } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  getProfile,
  updateProfile,
  changePassword,
  uploadAvatar,
  removeAvatar,
  type UserProfile,
} from "@/actions/profile";
import { NotificationPreferencesForm } from "./notification-preferences-form";

export function ProfileSettingsView() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile form state
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);

  // Avatar state
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Load profile
  const loadProfile = useCallback(async () => {
    const result = await getProfile();
    if (result.success && result.data) {
      setProfile(result.data);
      setFullName(result.data.full_name);
    } else {
      toast.error(result.error || "Failed to load profile");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // ── Save Profile ────────────────────────────────────────────────────────
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    const result = await updateProfile({ full_name: fullName.trim() });
    setSaving(false);
    if (result.success && result.data) {
      setProfile((prev) => (prev ? { ...prev, ...result.data } : prev));
      toast.success("Profile updated");
    } else {
      toast.error(result.error || "Failed to update profile");
    }
  };

  // ── Avatar Upload ───────────────────────────────────────────────────────
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    const formData = new FormData();
    formData.append("avatar", file);

    const result = await uploadAvatar(formData);
    setAvatarUploading(false);

    if (result.success && result.data) {
      setProfile((prev) =>
        prev ? { ...prev, avatar_url: result.data!.url } : prev
      );
      toast.success("Avatar updated");
    } else {
      toast.error(result.error || "Failed to upload avatar");
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveAvatar = async () => {
    setAvatarUploading(true);
    const result = await removeAvatar();
    setAvatarUploading(false);

    if (result.success) {
      setProfile((prev) => (prev ? { ...prev, avatar_url: null } : prev));
      toast.success("Avatar removed");
    } else {
      toast.error(result.error || "Failed to remove avatar");
    }
  };

  // ── Change Password ─────────────────────────────────────────────────────
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error("Current password is required");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setChangingPassword(true);
    const result = await changePassword({
      currentPassword,
      newPassword,
    });
    setChangingPassword(false);

    if (result.success) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed successfully");
    } else {
      toast.error(result.error || "Failed to change password");
    }
  };

  // ── Loading State ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <GlassCard key={i}>
            <div className="animate-pulse space-y-4">
              <div className="h-4 w-40 rounded bg-bg-elevated" />
              <div className="h-3 w-60 rounded bg-bg-elevated" />
              <div className="h-10 w-full rounded-lg bg-bg-elevated" />
            </div>
          </GlassCard>
        ))}
      </div>
    );
  }

  if (!profile) {
    return (
      <GlassCard>
        <div className="py-8 text-center">
          <User className="mx-auto h-10 w-10 text-text-tertiary/50" />
          <p className="mt-3 text-sm text-text-secondary">Unable to load profile</p>
          <Button variant="ghost" size="sm" onClick={loadProfile} className="mt-3">
            Try Again
          </Button>
        </div>
      </GlassCard>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* ── Profile Card (Avatar + Basic Info) ──────────────────────────── */}
      <GlassCard>
        <div className="flex items-start gap-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar
                src={profile.avatar_url}
                name={profile.full_name}
                size="lg"
                className="!h-20 !w-20 !text-xl"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-accent-primary text-white shadow-lg transition-transform hover:scale-110 disabled:opacity-50"
                aria-label="Upload avatar"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            {profile.avatar_url && (
              <button
                onClick={handleRemoveAvatar}
                disabled={avatarUploading}
                className="flex items-center gap-1 text-[10px] text-text-tertiary transition-colors hover:text-signal-danger disabled:opacity-50"
              >
                <Trash2 className="h-3 w-3" />
                Remove
              </button>
            )}
            {avatarUploading && (
              <span className="text-[10px] text-text-tertiary">Uploading...</span>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-text-primary">Your Profile</h3>
            <p className="mt-1 text-xs text-text-tertiary">
              Manage your personal information and avatar
            </p>

            <form onSubmit={handleSaveProfile} className="mt-4 space-y-4">
              <Input
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                required
              />

              {/* Read-only fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <Mail className="h-3 w-3" />
                    Email
                  </label>
                  <div className="glass-panel-dense flex h-10 items-center rounded-lg px-4 text-sm text-text-tertiary">
                    {profile.email}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <Shield className="h-3 w-3" />
                    Role
                  </label>
                  <div className="glass-panel-dense flex h-10 items-center rounded-lg px-4 text-sm text-text-tertiary">
                    {profile.role || "Member"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <Building2 className="h-3 w-3" />
                    Workspace
                  </label>
                  <div className="glass-panel-dense flex h-10 items-center rounded-lg px-4 text-sm text-text-tertiary">
                    {profile.workspace_name || "—"}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <Calendar className="h-3 w-3" />
                    Member Since
                  </label>
                  <div className="glass-panel-dense flex h-10 items-center rounded-lg px-4 text-sm text-text-tertiary">
                    {new Date(profile.created_at).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={saving || fullName === profile.full_name}>
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </GlassCard>

      {/* ── Change Password ─────────────────────────────────────────────── */}
      <GlassCard>
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-accent-primary" />
          <h3 className="text-sm font-semibold text-text-primary">Change Password</h3>
        </div>
        <p className="mt-1 text-xs text-text-tertiary">
          Update your password to keep your account secure
        </p>

        <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
          <div className="max-w-md">
            {/* Current Password */}
            <div className="space-y-1.5">
              <label className="block text-xs text-text-secondary">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="focus-ring glass-panel-dense w-full rounded-lg px-4 py-2.5 pr-10 text-sm text-text-primary placeholder:text-text-tertiary"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="grid max-w-md grid-cols-2 gap-4">
            {/* New Password */}
            <div className="space-y-1.5">
              <label className="block text-xs text-text-secondary">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="focus-ring glass-panel-dense w-full rounded-lg px-4 py-2.5 pr-10 text-sm text-text-primary placeholder:text-text-tertiary"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="block text-xs text-text-secondary">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="focus-ring glass-panel-dense w-full rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary"
                required
                minLength={8}
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-signal-danger">Passwords do not match</p>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="outline"
              disabled={changingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}
            >
              <Lock className="h-4 w-4" />
              {changingPassword ? "Changing..." : "Change Password"}
            </Button>
          </div>
        </form>
      </GlassCard>

      {/* ── Notification Preferences ────────────────────────────────────── */}
      <NotificationPreferencesForm />
    </motion.div>
  );
}
