"use client";

import { useState } from "react";
import { Send, Loader2, X, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/gradient-button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { sendCrmEmail } from "@/actions/emails";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTo?: string;
  contactId?: string | null;
  dealId?: string | null;
  companyId?: string | null;
  onSent?: () => void;
};

export function EmailComposeDialog({
  open,
  onOpenChange,
  defaultTo,
  contactId,
  dealId,
  companyId,
  onSent,
}: Props) {
  const [to, setTo] = useState(defaultTo || "");
  const [toList, setToList] = useState<string[]>(defaultTo ? [defaultTo] : []);
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const resetForm = () => {
    setTo("");
    setToList(defaultTo ? [defaultTo] : []);
    setCc("");
    setBcc("");
    setShowCcBcc(false);
    setSubject("");
    setBody("");
  };

  const addToRecipient = () => {
    const email = to.trim().toLowerCase();
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !toList.includes(email)) {
      setToList((prev) => [...prev, email]);
      setTo("");
    }
  };

  const removeToRecipient = (email: string) => {
    setToList((prev) => prev.filter((e) => e !== email));
  };

  const handleToKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
      e.preventDefault();
      addToRecipient();
    }
  };

  const parseEmailList = (value: string): string[] => {
    return value
      .split(/[,;\s]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
  };

  const handleSend = async () => {
    // Add any pending email in the "to" input
    const finalToList = [...toList];
    const pendingTo = to.trim().toLowerCase();
    if (pendingTo && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pendingTo) && !finalToList.includes(pendingTo)) {
      finalToList.push(pendingTo);
    }

    if (finalToList.length === 0) {
      toast.error("Please add at least one recipient");
      return;
    }
    if (!subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }
    if (!body.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setSending(true);

    // Convert plain text body to simple HTML
    const bodyHtml = body
      .split("\n")
      .map((line) => (line.trim() === "" ? "<br>" : `<p>${escapeHtml(line)}</p>`))
      .join("");

    const result = await sendCrmEmail({
      to_emails: finalToList,
      cc_emails: parseEmailList(cc),
      bcc_emails: parseEmailList(bcc),
      subject: subject.trim(),
      body_html: bodyHtml,
      body_text: body,
      contact_id: contactId || null,
      deal_id: dealId || null,
      company_id: companyId || null,
    });

    setSending(false);

    if (result.success) {
      toast.success("Email sent successfully!");
      resetForm();
      onOpenChange(false);
      onSent?.();
    } else {
      toast.error(result.error || "Failed to send email");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compose Email</DialogTitle>
          <DialogDescription>
            Send an email from the CRM. It will be logged and tracked automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* To Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs text-text-secondary">To</label>
              {!showCcBcc && (
                <button
                  type="button"
                  onClick={() => setShowCcBcc(true)}
                  className="text-[11px] text-accent-primary hover:underline"
                >
                  CC / BCC
                </button>
              )}
            </div>
            <div className="glass-panel-dense flex flex-wrap items-center gap-1.5 rounded-lg px-3 py-2 min-h-[42px]">
              {toList.map((email) => (
                <Badge key={email} variant="default" className="gap-1 py-0.5 pl-2 pr-1">
                  {email}
                  <button
                    type="button"
                    onClick={() => removeToRecipient(email)}
                    className="rounded-full p-0.5 hover:bg-bg-elevated"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                onKeyDown={handleToKeyDown}
                onBlur={addToRecipient}
                placeholder={toList.length === 0 ? "recipient@example.com" : "Add another..."}
                className="min-w-[180px] flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none"
              />
            </div>
          </div>

          {/* CC / BCC Fields */}
          {showCcBcc && (
            <>
              <Input
                label="CC"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="Separate multiple emails with commas"
              />
              <Input
                label="BCC"
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                placeholder="Separate multiple emails with commas"
              />
            </>
          )}

          {/* Subject */}
          <Input
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject"
          />

          {/* Body */}
          <div className="space-y-1.5">
            <label className="block text-xs text-text-secondary">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your email..."
              rows={10}
              className="glass-panel-dense focus-ring w-full rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary resize-y"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={sending}
          >
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending}>
            {sending ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-1.5 h-4 w-4" />
                Send Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
