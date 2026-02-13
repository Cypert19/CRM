"use client";

import { useEffect, useState, useCallback } from "react";
import { Mail, Plus } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/gradient-button";
import { EmailList } from "@/components/email/email-list";
import { EmailComposeDialog } from "@/components/email/email-compose-dialog";
import { getEmails, type EmailLogWithRelations } from "@/actions/emails";

type Props = {
  contactId: string;
  contactEmail?: string | null;
};

export function ContactEmailsSection({ contactId, contactEmail }: Props) {
  const [emails, setEmails] = useState<EmailLogWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [composeOpen, setComposeOpen] = useState(false);

  const fetchEmails = useCallback(async () => {
    const result = await getEmails({ contact_id: contactId });
    if (result.success && result.data) {
      setEmails(result.data);
    }
    setLoading(false);
  }, [contactId]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  if (loading) {
    return (
      <GlassCard>
        <div className="flex items-center justify-center py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">
          <Mail className="mr-1.5 inline h-4 w-4 text-text-tertiary" />
          Email History ({emails.length})
        </h3>
        <Button size="sm" onClick={() => setComposeOpen(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Send Email
        </Button>
      </div>

      <EmailList emails={emails} />

      <EmailComposeDialog
        open={composeOpen}
        onOpenChange={setComposeOpen}
        defaultTo={contactEmail || undefined}
        contactId={contactId}
        onSent={fetchEmails}
      />
    </div>
  );
}
