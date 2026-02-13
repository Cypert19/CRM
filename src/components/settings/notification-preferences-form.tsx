"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  Target,
  GitBranch,
  CheckSquare,
  Clock,
  AlertTriangle,
  AtSign,
  FileText,
  Sparkles,
  BarChart3,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "@/actions/profile";
import { toast } from "sonner";
import type { Tables } from "@/types/database";

type NotificationField = keyof Omit<
  Tables<"notification_preferences">,
  "id" | "workspace_id" | "user_id" | "created_at" | "updated_at"
>;

type NotificationValue = "realtime" | "daily" | "weekly" | "off";

const NOTIFICATION_OPTIONS: { value: NotificationValue; label: string }[] = [
  { value: "realtime", label: "Realtime" },
  { value: "daily", label: "Daily Digest" },
  { value: "weekly", label: "Weekly Digest" },
  { value: "off", label: "Off" },
];

const NOTIFICATION_FIELDS: {
  key: NotificationField;
  label: string;
  description: string;
  icon: typeof Bell;
  category: "deals" | "tasks" | "notes" | "ai";
}[] = [
  {
    key: "deal_assigned",
    label: "Deal Assigned",
    description: "When a deal is assigned to you",
    icon: Target,
    category: "deals",
  },
  {
    key: "stage_changed",
    label: "Stage Changed",
    description: "When a deal you own changes stages",
    icon: GitBranch,
    category: "deals",
  },
  {
    key: "task_assigned",
    label: "Task Assigned",
    description: "When a task is assigned to you",
    icon: CheckSquare,
    category: "tasks",
  },
  {
    key: "task_due_soon",
    label: "Task Due Soon",
    description: "Reminder before a task is due",
    icon: Clock,
    category: "tasks",
  },
  {
    key: "task_overdue",
    label: "Task Overdue",
    description: "When a task passes its due date",
    icon: AlertTriangle,
    category: "tasks",
  },
  {
    key: "mention_in_note",
    label: "Mentions",
    description: "When someone mentions you in a note",
    icon: AtSign,
    category: "notes",
  },
  {
    key: "new_note_on_deal",
    label: "New Note on Deal",
    description: "When a note is added to your deal",
    icon: FileText,
    category: "notes",
  },
  {
    key: "ai_insight",
    label: "AI Insights",
    description: "AI-generated insights about your deals",
    icon: Sparkles,
    category: "ai",
  },
  {
    key: "weekly_summary",
    label: "Weekly Summary",
    description: "Weekly performance report",
    icon: BarChart3,
    category: "ai",
  },
];

const CATEGORIES = [
  { key: "deals", label: "Deals" },
  { key: "tasks", label: "Tasks" },
  { key: "notes", label: "Notes & Mentions" },
  { key: "ai", label: "AI & Reports" },
] as const;

export function NotificationPreferencesForm() {
  const [prefs, setPrefs] = useState<Tables<"notification_preferences"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const loadPrefs = useCallback(async () => {
    const result = await getNotificationPreferences();
    if (result.success && result.data) {
      setPrefs(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPrefs();
  }, [loadPrefs]);

  const handleChange = async (field: NotificationField, value: NotificationValue) => {
    if (!prefs) return;

    // Optimistic update
    setPrefs((prev) => (prev ? { ...prev, [field]: value } : prev));
    setUpdating(field);

    const result = await updateNotificationPreferences({ [field]: value });
    setUpdating(null);

    if (!result.success) {
      // Revert optimistic update
      setPrefs((prev) => (prev ? { ...prev, [field]: prefs[field] } : prev));
      toast.error(result.error || "Failed to update preference");
    }
  };

  if (loading) {
    return (
      <GlassCard>
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-48 rounded bg-bg-elevated" />
          <div className="h-3 w-72 rounded bg-bg-elevated" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between py-3">
              <div className="h-4 w-40 rounded bg-bg-elevated" />
              <div className="h-8 w-32 rounded bg-bg-elevated" />
            </div>
          ))}
        </div>
      </GlassCard>
    );
  }

  if (!prefs) return null;

  return (
    <GlassCard>
      <div className="flex items-center gap-2">
        <Bell className="h-4 w-4 text-accent-primary" />
        <h3 className="text-sm font-semibold text-text-primary">Notification Preferences</h3>
      </div>
      <p className="mt-1 text-xs text-text-tertiary">
        Choose how and when you want to be notified about CRM activity
      </p>

      <div className="mt-6 space-y-6">
        {CATEGORIES.map((category) => {
          const fields = NOTIFICATION_FIELDS.filter((f) => f.category === category.key);
          if (fields.length === 0) return null;

          return (
            <div key={category.key}>
              <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-text-tertiary">
                {category.label}
              </h4>
              <div className="space-y-1">
                {fields.map((field) => {
                  const Icon = field.icon;
                  const currentValue = prefs[field.key] as NotificationValue;
                  const isUpdating = updating === field.key;

                  return (
                    <div
                      key={field.key}
                      className="flex items-center justify-between rounded-xl px-3 py-3 transition-colors hover:bg-bg-card/30"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4 text-text-tertiary" />
                        <div>
                          <span className="text-sm text-text-primary">{field.label}</span>
                          <p className="text-[11px] text-text-tertiary">{field.description}</p>
                        </div>
                      </div>

                      <Select
                        value={currentValue}
                        onValueChange={(val) =>
                          handleChange(field.key, val as NotificationValue)
                        }
                        disabled={isUpdating}
                      >
                        <SelectTrigger className="h-8 w-[130px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {NOTIFICATION_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
