"use client";

import { useEffect, useState, useCallback } from "react";
import { Mail, Plus } from "lucide-react";
import { Button } from "@/components/ui/gradient-button";
import { EmailList } from "@/components/email/email-list";
import { EmailComposeDialog } from "@/components/email/email-compose-dialog";
import { getEmails, type EmailLogWithRelations } from "@/actions/emails";
import { toast } from "sonner";

type Props = {
  dealId: string;
  contactEmail?: string | null;
  contactId?: string | null;
};

export function DealEmailsTab({ dealId, contactEmail, contactId }: Props) {
  const [emails, setEmails] = useState<EmailLogWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [composeOpen, setComposeOpen] = useState(false);

  const fetchEmails = useCallback(async () => {
    const result = await getEmails({ deal_id: dealId });
    if (result.success && result.data) {
      setEmails(result.data);
    } else {
      toast.error(result.error || "Failed to load emails");
    }
    setLoading(false);
  }, [dealId]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">
          Emails ({emails.length})
        </h3>
        <Button size="sm" onClick={() => setComposeOpen(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Compose Email
        </Button>
      </div>

      <EmailList emails={emails} />

      <EmailComposeDialog
        open={composeOpen}
        onOpenChange={setComposeOpen}
        defaultTo={contactEmail || undefined}
        dealId={dealId}
        contactId={contactId}
        onSent={fetchEmails}
      />
    </div>
  );
}
