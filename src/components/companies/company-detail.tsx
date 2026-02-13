"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Globe,
  Phone,
  Pencil,
  X,
  Check,
  Trash2,
  Building2,
  Users,
  DollarSign,
  MapPin,
  Briefcase,
  Clock,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/gradient-button";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatRelativeTime } from "@/lib/utils";
import { updateCompany, deleteCompany } from "@/actions/companies";
import { useWorkspace } from "@/hooks/use-workspace";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import type { Tables } from "@/types/database";

const EMPLOYEE_RANGES = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5000+"] as const;
const REVENUE_RANGES = ["<$1M", "$1M-$10M", "$10M-$50M", "$50M-$100M", "$100M-$500M", "$500M+"] as const;

export function CompanyDetail({ company: initialCompany }: { company: Tables<"companies"> }) {
  const router = useRouter();
  const { role } = useWorkspace();
  const { userId } = useUser();
  const [company, setCompany] = useState(initialCompany);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const canDelete = role === "Admin" || (company.owner_id != null && userId === company.owner_id);

  const handleDelete = async () => {
    const result = await deleteCompany(company.id);
    if (result.success) {
      toast.success("Company deleted successfully");
      router.push("/companies");
    } else {
      toast.error(result.error || "Failed to delete company");
    }
  };

  const [companyName, setCompanyName] = useState(company.company_name);
  const [domain, setDomain] = useState(company.domain || "");
  const [industry, setIndustry] = useState(company.industry || "");
  const [phone, setPhone] = useState(company.phone || "");
  const [website, setWebsite] = useState(company.website || "");
  const [description, setDescription] = useState(company.description || "");
  const [employeeRange, setEmployeeRange] = useState(company.employee_count_range || "");
  const [revenueRange, setRevenueRange] = useState(company.annual_revenue_range || "");
  const [street, setStreet] = useState((company.address as Record<string, string>)?.street || "");
  const [city, setCity] = useState((company.address as Record<string, string>)?.city || "");
  const [addrState, setAddrState] = useState((company.address as Record<string, string>)?.state || "");
  const [zip, setZip] = useState((company.address as Record<string, string>)?.zip || "");
  const [country, setCountry] = useState((company.address as Record<string, string>)?.country || "");

  const startEdit = () => {
    setCompanyName(company.company_name);
    setDomain(company.domain || "");
    setIndustry(company.industry || "");
    setPhone(company.phone || "");
    setWebsite(company.website || "");
    setDescription(company.description || "");
    setEmployeeRange(company.employee_count_range || "");
    setRevenueRange(company.annual_revenue_range || "");
    const addr = company.address as Record<string, string> | null;
    setStreet(addr?.street || "");
    setCity(addr?.city || "");
    setAddrState(addr?.state || "");
    setZip(addr?.zip || "");
    setCountry(addr?.country || "");
    setEditing(true);
  };

  const cancelEdit = () => setEditing(false);

  const saveEdit = async () => {
    if (!companyName.trim()) { toast.error("Company name is required"); return; }
    setSaving(true);

    const hasAddress = street || city || addrState || zip || country;
    const result = await updateCompany({
      id: company.id,
      company_name: companyName.trim(),
      domain: domain.trim() || null,
      industry: industry.trim() || null,
      phone: phone.trim() || null,
      website: website.trim() || null,
      description: description.trim() || null,
      employee_count_range: employeeRange || null,
      annual_revenue_range: revenueRange || null,
      address: hasAddress ? { street, city, state: addrState, zip, country } : null,
    });

    setSaving(false);
    if (result.success && result.data) {
      setCompany({ ...company, ...result.data });
      setEditing(false);
      toast.success("Company updated");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to update company");
    }
  };

  const addr = company.address as Record<string, string> | null;
  const addressStr = [addr?.street, addr?.city, addr?.state, addr?.zip, addr?.country].filter(Boolean).join(", ");

  return (
    <div>
      <div className="flex items-center justify-between">
        <Link href="/companies" className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary">
          <ArrowLeft className="h-4 w-4" />Back to Companies
        </Link>
        {!editing ? (
          <div className="flex items-center gap-2">
            {canDelete && (
              <Button
                onClick={() => setShowDeleteDialog(true)}
                variant="ghost"
                size="sm"
                className="text-signal-danger hover:bg-signal-danger/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            )}
            <Button onClick={startEdit} variant="secondary" size="sm">
              <Pencil className="h-3.5 w-3.5" />Edit Company
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button onClick={cancelEdit} variant="ghost" size="sm" disabled={saving}><X className="h-3.5 w-3.5" />Cancel</Button>
            <Button onClick={saveEdit} size="sm" disabled={saving}><Check className="h-3.5 w-3.5" />{saving ? "Saving..." : "Save Changes"}</Button>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <GlassCard>
            {editing ? (
              <div className="space-y-4">
                <Input label="Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Domain" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="example.com" />
                  <Input label="Industry" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. Technology" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
                  <Input label="Website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://example.com" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-text-secondary">Employees</label>
                    <Select value={employeeRange} onValueChange={setEmployeeRange}>
                      <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
                      <SelectContent>{EMPLOYEE_RANGES.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-text-secondary">Annual Revenue</label>
                    <Select value={revenueRange} onValueChange={setRevenueRange}>
                      <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
                      <SelectContent>{REVENUE_RANGES.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="block text-xs font-medium text-text-secondary">Address</label>
                  <Input label="" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Street address" />
                  <div className="grid grid-cols-3 gap-3">
                    <Input label="" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
                    <Input label="" value={addrState} onChange={(e) => setAddrState(e.target.value)} placeholder="State" />
                    <Input label="" value={zip} onChange={(e) => setZip(e.target.value)} placeholder="ZIP" />
                  </div>
                  <Input label="" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-text-secondary">Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="About this company..." rows={4} className="glass-panel-dense focus-ring w-full rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary resize-none" />
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-bg-elevated">
                    <Building2 className="h-7 w-7 text-accent-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-text-primary">{company.company_name}</h1>
                    <div className="mt-1 flex items-center gap-3 text-sm text-text-secondary">
                      {company.industry && <span>{company.industry}</span>}
                      {company.domain && <span className="flex items-center gap-1"><Globe className="h-3.5 w-3.5" />{company.domain}</span>}
                    </div>
                  </div>
                </div>
                {company.description && <p className="mt-4 text-sm text-text-secondary leading-relaxed">{company.description}</p>}
              </>
            )}
          </GlassCard>

          <GlassCard>
            <h3 className="mb-4 text-sm font-semibold text-text-primary">Company Information</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Globe, color: "text-accent-primary", label: "Domain", val: company.domain || "Not set" },
                { icon: Briefcase, color: "text-signal-warning", label: "Industry", val: company.industry || "Not set" },
                { icon: Phone, color: "text-signal-success", label: "Phone", val: company.phone || "Not set" },
                { icon: Globe, color: "text-accent-cyan", label: "Website", val: company.website || "Not set" },
                { icon: Users, color: "text-signal-info", label: "Employees", val: company.employee_count_range || "Not set" },
                { icon: DollarSign, color: "text-signal-warning", label: "Annual Revenue", val: company.annual_revenue_range || "Not set" },
                { icon: MapPin, color: "text-signal-danger", label: "Address", val: addressStr || "Not set" },
                { icon: Clock, color: "text-text-tertiary", label: "Created", val: formatRelativeTime(company.created_at) },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 rounded-lg bg-bg-elevated/30 px-4 py-3">
                  <item.icon className={`h-4 w-4 ${item.color} shrink-0`} />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-text-tertiary">{item.label}</p>
                    <p className="text-sm font-medium text-text-primary truncate">{item.val}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Sidebar - related entities placeholder */}
        <div className="space-y-6">
          <GlassCard>
            <h3 className="mb-4 text-sm font-semibold text-text-primary">Related Contacts</h3>
            <p className="text-sm text-text-tertiary">Associated contacts will appear here.</p>
          </GlassCard>

          <GlassCard>
            <h3 className="mb-4 text-sm font-semibold text-text-primary">Related Deals</h3>
            <p className="text-sm text-text-tertiary">Associated deals will appear here.</p>
          </GlassCard>
        </div>
      </div>

      <ConfirmDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Company"
        description="Are you sure you want to delete this company? Associated contacts and deals will remain but will no longer be linked."
        entityName={company.company_name}
        onConfirm={handleDelete}
      />
    </div>
  );
}
