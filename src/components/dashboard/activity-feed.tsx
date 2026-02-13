"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { formatRelativeTime } from "@/lib/utils";
import {
  Target,
  ArrowRightLeft,
  Trophy,
  XCircle,
  UserPlus,
  FileText,
  CheckCircle2,
  Upload,
  Mail,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const activityIcons: Record<string, LucideIcon> = {
  deal_created: Target,
  deal_stage_changed: ArrowRightLeft,
  deal_won: Trophy,
  deal_lost: XCircle,
  contact_created: UserPlus,
  note_created: FileText,
  task_completed: CheckCircle2,
  file_uploaded: Upload,
  email_logged: Mail,
};

const activityLabels: Record<string, string> = {
  deal_created: "created a deal",
  deal_stage_changed: "moved a deal",
  deal_won: "won a deal",
  deal_lost: "lost a deal",
  contact_created: "added a contact",
  note_created: "wrote a note",
  task_completed: "completed a task",
  file_uploaded: "uploaded a file",
  email_logged: "sent an email",
};

type Activity = {
  id: string;
  activity_type: string;
  actor_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
  users?: { full_name: string; avatar_url: string | null };
};

export function ActivityFeed({ activities }: { activities: Activity[] }) {
  return (
    <GlassCard>
      <h3 className="mb-4 text-sm font-semibold text-text-primary">
        Recent Activity
      </h3>
      <div className="space-y-4">
        {activities.length === 0 ? (
          <p className="text-sm text-text-tertiary">No recent activity</p>
        ) : (
          activities.slice(0, 10).map((activity) => {
            const Icon = activityIcons[activity.activity_type] || Target;
            const label = activityLabels[activity.activity_type] || activity.activity_type;
            const user = activity.users;
            return (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-elevated">
                  <Icon className="h-3.5 w-3.5 text-text-tertiary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-text-secondary">
                    <span className="font-medium text-text-primary">
                      {user?.full_name ?? "Someone"}
                    </span>{" "}
                    {label}
                    {activity.metadata?.title ? (
                      <span className="font-medium text-text-primary">
                        {" "}
                        &quot;{String(activity.metadata.title)}&quot;
                      </span>
                    ) : null}
                  </p>
                  <span className="text-xs text-text-tertiary">
                    {formatRelativeTime(activity.created_at)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </GlassCard>
  );
}
