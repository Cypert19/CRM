"use client";

import { useState } from "react";
import { Button } from "@/components/ui/gradient-button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { createCompany } from "@/actions/companies";
import { toast } from "sonner";

export function CompanyForm({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const result = await createCompany({
      company_name: fd.get("company_name") as string,
      domain: (fd.get("domain") as string) || undefined,
      industry: (fd.get("industry") as string) || undefined,
    });
    setLoading(false);
    if (result.success) { toast.success("Company created"); onOpenChange(false); }
    else toast.error(result.error || "Failed");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>New Company</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input name="company_name" label="Company Name" required autoFocus />
          <Input name="domain" label="Domain" placeholder="acme.com" />
          <Input name="industry" label="Industry" />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Company"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
