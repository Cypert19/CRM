"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  Pencil,
  X,
  Check,
  Trash2,
  Briefcase,
  MapPin,
  Linkedin,
  Twitter,
  Tag,
  Clock,
  Globe,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/gradient-button";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { ContactEmailsSection } from "./contact-emails-section";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatRelativeTime } from "@/lib/utils";
import { updateContact, deleteContact } from "@/actions/contacts";
import { useWorkspace } from "@/hooks/use-workspace";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import type { Tables } from "@/types/database";

const LIFECYCLE_STAGES = ["Lead", "Marketing Qualified", "Sales Qualified", "Opportunity", "Customer", "Evangelist", "Other"] as const;
const SOURCES = ["Inbound", "Outbound", "Referral", "Partner", "Event", "Website", "Other"] as const;

export function ContactDetail({ contact: initialContact }: { contact: Tables<"contacts"> }) {
  const router = useRouter();
  const { role } = useWorkspace();
  const { userId } = useUser();
  const [contact, setContact] = useState(initialContact);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const canDelete = role === "Admin" || (contact.owner_id != null && userId === contact.owner_id);

  const handleDelete = async () => {
    const result = await deleteContact(contact.id);
    if (result.success) {
      toast.success("Contact deleted successfully");
      router.push("/contacts");
    } else {
      toast.error(result.error || "Failed to delete contact");
    }
  };

  const [firstName, setFirstName] = useState(contact.first_name);
  const [lastName, setLastName] = useState(contact.last_name);
  const [email, setEmail] = useState(contact.email || "");
  const [phone, setPhone] = useState(contact.phone || "");
  const [jobTitle, setJobTitle] = useState(contact.job_title || "");
  const [lifecycleStage, setLifecycleStage] = useState(contact.lifecycle_stage || "");
  const [source, setSource] = useState(contact.source || "");
  const [street, setStreet] = useState((contact.address as Record<string, string>)?.street || "");
  const [city, setCity] = useState((contact.address as Record<string, string>)?.city || "");
  const [addrState, setAddrState] = useState((contact.address as Record<string, string>)?.state || "");
  const [zip, setZip] = useState((contact.address as Record<string, string>)?.zip || "");
  const [country, setCountry] = useState((contact.address as Record<string, string>)?.country || "");
  const [linkedin, setLinkedin] = useState((contact.social_profiles as Record<string, string>)?.linkedin || "");
  const [twitter, setTwitter] = useState((contact.social_profiles as Record<string, string>)?.twitter || "");

  const startEdit = () => {
    setFirstName(contact.first_name);
    setLastName(contact.last_name);
    setEmail(contact.email || "");
    setPhone(contact.phone || "");
    setJobTitle(contact.job_title || "");
    setLifecycleStage(contact.lifecycle_stage || "");
    setSource(contact.source || "");
    const addr = contact.address as Record<string, string> | null;
    setStreet(addr?.street || "");
    setCity(addr?.city || "");
    setAddrState(addr?.state || "");
    setZip(addr?.zip || "");
    setCountry(addr?.country || "");
    const social = contact.social_profiles as Record<string, string> | null;
    setLinkedin(social?.linkedin || "");
    setTwitter(social?.twitter || "");
    setEditing(true);
  };

  const cancelEdit = () => setEditing(false);

  const saveEdit = async () => {
    if (!firstName.trim() || !lastName.trim()) { toast.error("First and last name are required"); return; }
    setSaving(true);

    const hasAddress = street || city || addrState || zip || country;
    const result = await updateContact({
      id: contact.id,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      job_title: jobTitle.trim() || null,
      lifecycle_stage: lifecycleStage || null,
      source: source || null,
      address: hasAddress ? { street, city, state: addrState, zip, country } : null,
      social_profiles: { linkedin: linkedin || undefined, twitter: twitter || undefined },
    });

    setSaving(false);
    if (result.success && result.data) {
      setContact({ ...contact, ...result.data });
      setEditing(false);
      toast.success("Contact updated");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to update contact");
    }
  };

  const addr = contact.address as Record<string, string> | null;
  const social = contact.social_profiles as Record<string, string> | null;
  const addressStr = [addr?.street, addr?.city, addr?.state, addr?.zip, addr?.country].filter(Boolean).join(", ");

  const stageVariant = (s: string | null) => {
    switch (s) {
      case "Customer": return "success" as const;
      case "Evangelist": return "cyan" as const;
      case "Opportunity": return "warning" as const;
      case "Sales Qualified": return "info" as const;
      default: return "secondary" as const;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <Link href="/contacts" className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary">
          <ArrowLeft className="h-4 w-4" />Back to Contacts
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
              <Pencil className="h-3.5 w-3.5" />Edit Contact
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
                <div className="grid grid-cols-2 gap-4">
                  <Input label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                  <Input label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
                  <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
                </div>
                <Input label="Job Title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. VP of Sales" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-text-secondary">Lifecycle Stage</label>
                    <Select value={lifecycleStage} onValueChange={setLifecycleStage}>
                      <SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger>
                      <SelectContent>{LIFECYCLE_STAGES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-text-secondary">Source</label>
                    <Select value={source} onValueChange={setSource}>
                      <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                      <SelectContent>{SOURCES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
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
                <div className="grid grid-cols-2 gap-4">
                  <Input label="LinkedIn URL" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." />
                  <Input label="Twitter URL" value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="https://twitter.com/..." />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Avatar name={`${contact.first_name} ${contact.last_name}`} src={contact.avatar_url} size="lg" />
                <div>
                  <h1 className="text-2xl font-bold text-text-primary">{contact.first_name} {contact.last_name}</h1>
                  {contact.job_title && <p className="text-sm text-text-secondary">{contact.job_title}</p>}
                  {contact.lifecycle_stage && <Badge variant={stageVariant(contact.lifecycle_stage)} className="mt-1">{contact.lifecycle_stage}</Badge>}
                </div>
              </div>
            )}
          </GlassCard>

          <GlassCard>
            <h3 className="mb-4 text-sm font-semibold text-text-primary">Contact Information</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Mail, color: "text-accent-primary", label: "Email", val: contact.email || "Not set" },
                { icon: Phone, color: "text-signal-success", label: "Phone", val: contact.phone || "Not set" },
                { icon: Briefcase, color: "text-signal-warning", label: "Job Title", val: contact.job_title || "Not set" },
                { icon: Tag, color: "text-accent-cyan", label: "Source", val: contact.source || "Not set" },
                { icon: MapPin, color: "text-signal-info", label: "Address", val: addressStr || "Not set" },
                { icon: Clock, color: "text-text-tertiary", label: "Created", val: formatRelativeTime(contact.created_at) },
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

          {/* Email History */}
          <ContactEmailsSection contactId={contact.id} contactEmail={contact.email} />
        </div>

        <div className="space-y-6">
          {(social?.linkedin || social?.twitter) && (
            <GlassCard>
              <h3 className="mb-4 text-sm font-semibold text-text-primary">Social Profiles</h3>
              <div className="space-y-3">
                {social?.linkedin && (
                  <a href={social.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-text-secondary hover:text-accent-primary transition-colors">
                    <Linkedin className="h-4 w-4" />LinkedIn<Globe className="ml-auto h-3 w-3 text-text-tertiary" />
                  </a>
                )}
                {social?.twitter && (
                  <a href={social.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-text-secondary hover:text-accent-primary transition-colors">
                    <Twitter className="h-4 w-4" />Twitter<Globe className="ml-auto h-3 w-3 text-text-tertiary" />
                  </a>
                )}
              </div>
            </GlassCard>
          )}

          <GlassCard>
            <h3 className="mb-2 text-sm font-semibold text-text-primary">Lifecycle Stage</h3>
            <Badge variant={stageVariant(contact.lifecycle_stage)} className="text-sm">{contact.lifecycle_stage || "Not set"}</Badge>
          </GlassCard>

          {contact.last_contacted_at && (
            <GlassCard>
              <h3 className="mb-2 text-sm font-semibold text-text-primary">Last Contacted</h3>
              <p className="text-sm text-text-secondary">{formatRelativeTime(contact.last_contacted_at)}</p>
            </GlassCard>
          )}
        </div>
      </div>

      <ConfirmDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Contact"
        description="Are you sure you want to delete this contact? Associated deals and notes will remain but will no longer be linked."
        entityName={`${contact.first_name} ${contact.last_name}`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
