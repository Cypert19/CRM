"use client";

import { useState } from "react";
import {
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  User,
  Eye,
  MousePointerClick,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";
import type { EmailLogWithRelations } from "@/actions/emails";

type Props = {
  emails: EmailLogWithRelations[];
};

const statusConfig: Record<string, { icon: typeof Mail; variant: "success" | "danger" | "warning" | "info" | "secondary"; label: string }> = {
  pending: { icon: Clock, variant: "secondary", label: "Pending" },
  sending: { icon: Clock, variant: "info", label: "Sending" },
  sent: { icon: Send, variant: "info", label: "Sent" },
  delivered: { icon: CheckCircle2, variant: "success", label: "Delivered" },
  bounced: { icon: AlertCircle, variant: "danger", label: "Bounced" },
  failed: { icon: AlertCircle, variant: "danger", label: "Failed" },
};

export function EmailList({ emails }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (emails.length === 0) {
    return (
      <GlassCard>
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Mail className="mb-3 h-10 w-10 text-text-tertiary" />
          <p className="text-sm font-medium text-text-secondary">No emails yet</p>
          <p className="mt-1 text-xs text-text-tertiary">
            Emails sent from the CRM will appear here.
          </p>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-2">
      {emails.map((email) => {
        const isExpanded = expandedId === email.id;
        const config = statusConfig[email.status] || statusConfig.pending;
        const StatusIcon = config.icon;
        const sender = email.sender as EmailLogWithRelations["sender"];

        return (
          <div key={email.id}>
            <GlassCard
              hover
              className="!p-4 cursor-pointer"
              onClick={() => setExpandedId(isExpanded ? null : email.id)}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  className="mt-0.5 shrink-0 text-text-tertiary"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {email.subject}
                    </p>
                    <Badge variant={config.variant}>{config.label}</Badge>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-text-tertiary">
                    <span>To: {email.to_emails.join(", ")}</span>
                    {email.sent_at && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(email.sent_at)}
                      </span>
                    )}
                    {sender && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {sender.full_name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Tracking indicators */}
                <div className="flex items-center gap-2 shrink-0">
                  {email.open_count > 0 && (
                    <div className="flex items-center gap-1 text-xs text-signal-success" title={`Opened ${email.open_count} time(s)`}>
                      <Eye className="h-3.5 w-3.5" />
                      <span>{email.open_count}</span>
                    </div>
                  )}
                  {email.click_count > 0 && (
                    <div className="flex items-center gap-1 text-xs text-accent-primary" title={`Clicked ${email.click_count} time(s)`}>
                      <MousePointerClick className="h-3.5 w-3.5" />
                      <span>{email.click_count}</span>
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>

            {/* Expanded email body */}
            {isExpanded && (
              <GlassCard className="ml-7 mt-2 !p-4">
                <div className="space-y-3">
                  {/* Email metadata */}
                  <div className="space-y-1 text-xs text-text-tertiary">
                    <p><span className="text-text-secondary">From:</span> {email.from_name} &lt;{email.from_email}&gt;</p>
                    <p><span className="text-text-secondary">To:</span> {email.to_emails.join(", ")}</p>
                    {email.cc_emails.length > 0 && (
                      <p><span className="text-text-secondary">CC:</span> {email.cc_emails.join(", ")}</p>
                    )}
                    {email.sent_at && (
                      <p><span className="text-text-secondary">Sent:</span> {new Date(email.sent_at).toLocaleString()}</p>
                    )}
                    {email.error_message && (
                      <p className="text-signal-danger">
                        <span className="font-medium">Error:</span> {email.error_message}
                      </p>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border-glass" />

                  {/* Email body */}
                  {email.body_text ? (
                    <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
                      {email.body_text}
                    </p>
                  ) : (
                    <div
                      className="prose prose-sm prose-invert max-w-none text-text-secondary"
                      dangerouslySetInnerHTML={{ __html: email.body_html }}
                    />
                  )}
                </div>
              </GlassCard>
            )}
          </div>
        );
      })}
    </div>
  );
}
