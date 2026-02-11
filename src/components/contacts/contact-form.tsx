"use client";

import { useState } from "react";
import { Button } from "@/components/ui/gradient-button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { createContact } from "@/actions/contacts";
import { toast } from "sonner";

export function ContactForm({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const result = await createContact({
      first_name: fd.get("first_name") as string,
      last_name: fd.get("last_name") as string,
      email: (fd.get("email") as string) || undefined,
      phone: (fd.get("phone") as string) || undefined,
      job_title: (fd.get("job_title") as string) || undefined,
    });
    setLoading(false);
    if (result.success) { toast.success("Contact created"); onOpenChange(false); }
    else toast.error(result.error || "Failed");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>New Contact</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input name="first_name" label="First Name" required autoFocus />
            <Input name="last_name" label="Last Name" required />
          </div>
          <Input name="email" label="Email" type="email" />
          <Input name="phone" label="Phone" />
          <Input name="job_title" label="Job Title" />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Contact"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
