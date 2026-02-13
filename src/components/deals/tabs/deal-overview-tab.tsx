"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  User,
  Calendar,
  DollarSign,
  Target,
  Tag,
  Percent,
  Clock,
  Briefcase,
  TrendingUp,
  Users,
  FileText,
  Repeat,
  Crosshair,
  Award,
  Shield,
} from "lucide-react";
import { DealContactsPanel } from "../deal-contacts-panel";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/gradient-button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { updateDeal, moveDealStage } from "@/actions/deals";
import {
  DEAL_PRIORITIES,
  DEAL_SOURCES,
  DEAL_PAYMENT_TYPES,
  DEAL_PAYMENT_TYPE_LABELS,
  DEAL_PAYMENT_FREQUENCIES,
  DEAL_PAYMENT_FREQUENCY_LABELS,
  DEAL_INDUSTRIES,
  DEAL_INDUSTRY_LABELS,
  DEAL_COMPANY_SIZES,
} from "@/lib/constants";
import { toast } from "sonner";
import type { Tables } from "@/types/database";

type DealWithRelations = Tables<"deals"> & {
  contacts?: { id: string; first_name: string; last_name: string; email: string | null } | null;
  companies?: { id: string; company_name: string } | null;
  users?: { id: string; full_name: string; avatar_url: string | null } | null;
  pipeline_stages?: { id: string; name: string; color: string; is_won: boolean; is_lost: boolean } | null;
};

type PipelineWithStages = Tables<"pipelines"> & { pipeline_stages: Tables<"pipeline_stages">[] };

type Props = {
  deal: DealWithRelations;
  editing: boolean;
  onDealUpdate: (deal: DealWithRelations) => void;
  pipelineStages?: Tables<"pipeline_stages">[];
  allPipelines?: PipelineWithStages[];
};

export function DealOverviewTab({ deal, editing, onDealUpdate, pipelineStages = [], allPipelines = [] }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // Edit state - all fields
  const [title, setTitle] = useState(deal.title);
  const [auditFee, setAuditFee] = useState(String(deal.audit_fee ?? 0));
  const [retainerMonthly, setRetainerMonthly] = useState(String(deal.retainer_monthly ?? 0));
  const [customDevFee, setCustomDevFee] = useState(String(deal.custom_dev_fee ?? 0));
  const [pipelineId, setPipelineId] = useState(deal.pipeline_id);
  const [stageId, setStageId] = useState(deal.stage_id);

  // Compute available stages based on selected pipeline
  const availableStages = (() => {
    if (allPipelines.length > 0) {
      const selectedPipeline = allPipelines.find((p) => p.id === pipelineId);
      return (selectedPipeline?.pipeline_stages ?? []).sort((a, b) => a.display_order - b.display_order);
    }
    return [...pipelineStages].sort((a, b) => a.display_order - b.display_order);
  })();
  const [description, setDescription] = useState(deal.description || "");
  const [priority, setPriority] = useState(deal.priority || "");
  const [source, setSource] = useState(deal.source || "");
  const [expectedCloseDate, setExpectedCloseDate] = useState(deal.expected_close_date || "");
  const [probability, setProbability] = useState(String(deal.probability ?? ""));
  // New PRD fields
  const [paymentType, setPaymentType] = useState(deal.payment_type || "");
  const [paymentFrequency, setPaymentFrequency] = useState(deal.payment_frequency || "");
  const [scope, setScope] = useState(deal.scope || "");
  const [servicesDescription, setServicesDescription] = useState(deal.services_description || "");
  const [nextStep, setNextStep] = useState(deal.next_step || "");
  const [competitor, setCompetitor] = useState(deal.competitor || "");
  const [dealIndustry, setDealIndustry] = useState(deal.deal_industry || "");
  const [companySize, setCompanySize] = useState(deal.company_size || "");
  const [revenueStartDate, setRevenueStartDate] = useState(deal.revenue_start_date || "");
  const [revenueEndDate, setRevenueEndDate] = useState(deal.revenue_end_date || "");
  const [winReason, setWinReason] = useState(deal.win_reason || "");
  const [lostReason, setLostReason] = useState(deal.lost_reason || "");

  // Contact & Company edit state
  const NONE_VALUE = "__none__";
  const [contactId, setContactId] = useState(deal.contact_id || NONE_VALUE);
  const [companyId, setCompanyId] = useState(deal.company_id || NONE_VALUE);
  const [contactsList, setContactsList] = useState<{ id: string; first_name: string; last_name: string; email: string | null }[]>([]);
  const [companiesList, setCompaniesList] = useState<{ id: string; company_name: string }[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);

  // Lazy-fetch contacts & companies when entering edit mode
  useEffect(() => {
    if (!editing) return;
    let cancelled = false;
    (async () => {
      setLoadingLists(true);
      try {
        const [{ getContacts }, { getCompanies }] = await Promise.all([
          import("@/actions/contacts"),
          import("@/actions/companies"),
        ]);
        const [contactsRes, companiesRes] = await Promise.all([getContacts(), getCompanies()]);
        if (cancelled) return;
        if (contactsRes.success && contactsRes.data) {
          setContactsList(
            (contactsRes.data as unknown as { id: string; first_name: string; last_name: string; email: string | null }[])
              .map((c) => ({ id: c.id, first_name: c.first_name, last_name: c.last_name, email: c.email }))
          );
        }
        if (companiesRes.success && companiesRes.data) {
          setCompaniesList(
            (companiesRes.data as unknown as { id: string; company_name: string }[])
              .map((c) => ({ id: c.id, company_name: c.company_name }))
          );
        }
      } catch {
        // Silently fail — selectors will just be empty
      }
      if (!cancelled) setLoadingLists(false);
    })();
    return () => { cancelled = true; };
  }, [editing]);

  // Reset edit state when starting edit
  const resetEditState = () => {
    setTitle(deal.title);
    setAuditFee(String(deal.audit_fee ?? 0));
    setRetainerMonthly(String(deal.retainer_monthly ?? 0));
    setCustomDevFee(String(deal.custom_dev_fee ?? 0));
    setPipelineId(deal.pipeline_id);
    setStageId(deal.stage_id);
    setDescription(deal.description || "");
    setPriority(deal.priority || "");
    setSource(deal.source || "");
    setExpectedCloseDate(deal.expected_close_date || "");
    setProbability(String(deal.probability ?? ""));
    setPaymentType(deal.payment_type || "");
    setPaymentFrequency(deal.payment_frequency || "");
    setScope(deal.scope || "");
    setServicesDescription(deal.services_description || "");
    setNextStep(deal.next_step || "");
    setCompetitor(deal.competitor || "");
    setDealIndustry(deal.deal_industry || "");
    setCompanySize(deal.company_size || "");
    setRevenueStartDate(deal.revenue_start_date || "");
    setRevenueEndDate(deal.revenue_end_date || "");
    setContactId(deal.contact_id || NONE_VALUE);
    setCompanyId(deal.company_id || NONE_VALUE);
    setWinReason(deal.win_reason || "");
    setLostReason(deal.lost_reason || "");
  };

  // Called when parent toggles editing on
  if (editing) {
    // We need a ref approach, but keep it simple for now
  }

  const saveEdit = async () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);

    // If stage changed, use moveDealStage (handles closed_at logic + activity logging)
    const stageChanged = stageId !== deal.stage_id;
    if (stageChanged) {
      const moveResult = await moveDealStage({
        id: deal.id,
        stage_id: stageId,
        lost_reason: lostReason.trim() || null,
      });
      if (!moveResult.success) {
        setSaving(false);
        toast.error(moveResult.error || "Failed to move deal stage");
        return;
      }
    }

    // Include pipeline_id if pipeline changed
    const pipelineChanged = pipelineId !== deal.pipeline_id;

    const af = Number(auditFee) || 0;
    const rm = Number(retainerMonthly) || 0;
    const cdf = Number(customDevFee) || 0;

    const result = await updateDeal({
      id: deal.id,
      title: title.trim(),
      value: af + rm + cdf,
      audit_fee: af,
      retainer_monthly: rm,
      custom_dev_fee: cdf,
      description: description.trim() || null,
      priority: priority || null,
      source: source || null,
      expected_close_date: expectedCloseDate || null,
      probability: probability ? Number(probability) : null,
      payment_type: paymentType || null,
      payment_frequency: paymentFrequency || null,
      scope: scope.trim() || null,
      services_description: servicesDescription.trim() || null,
      next_step: nextStep.trim() || null,
      competitor: competitor.trim() || null,
      deal_industry: dealIndustry || null,
      company_size: companySize || null,
      revenue_start_date: revenueStartDate || null,
      revenue_end_date: revenueEndDate || null,
      contact_id: contactId === NONE_VALUE ? null : contactId,
      company_id: companyId === NONE_VALUE ? null : companyId,
      win_reason: winReason.trim() || null,
      lost_reason: lostReason.trim() || null,
      ...(pipelineChanged ? { pipeline_id: pipelineId } : {}),
    });

    setSaving(false);
    if (result.success && result.data) {
      // Update the pipeline_stages relation if stage changed
      const updatedDeal = { ...deal, ...result.data };
      if (stageChanged || pipelineChanged) {
        const newStage = availableStages.find((s) => s.id === stageId);
        if (newStage) {
          updatedDeal.pipeline_stages = {
            id: newStage.id,
            name: newStage.name,
            color: newStage.color,
            is_won: newStage.is_won,
            is_lost: newStage.is_lost,
          };
        }
      }
      // Update contact/company relations for sidebar display
      const selectedContact = contactId !== NONE_VALUE ? contactsList.find((c) => c.id === contactId) : null;
      const selectedCompany = companyId !== NONE_VALUE ? companiesList.find((c) => c.id === companyId) : null;
      if (selectedContact) {
        updatedDeal.contacts = selectedContact;
      } else if (contactId === NONE_VALUE) {
        updatedDeal.contacts = null;
      }
      if (selectedCompany) {
        updatedDeal.companies = selectedCompany;
      } else if (companyId === NONE_VALUE) {
        updatedDeal.companies = null;
      }
      onDealUpdate(updatedDeal);
      toast.success("Deal updated");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to update deal");
    }
  };

  // Expose save for parent
  if (typeof window !== "undefined") {
    const w = window as unknown as Record<string, unknown>;
    w.__dealOverviewSave = saveEdit;
    w.__dealOverviewReset = resetEditState;
    w.__dealOverviewSaving = saving;
  }

  const priorityVariant = (p: string | null) => {
    switch (p) {
      case "Critical": return "danger" as const;
      case "High": return "warning" as const;
      case "Medium": return "info" as const;
      default: return "secondary" as const;
    }
  };

  // Use selected stage (when editing) or deal's current stage for won/lost checks
  const selectedStage = editing
    ? availableStages.find((s) => s.id === stageId)
    : null;
  const isWon = selectedStage ? selectedStage.is_won : deal.pipeline_stages?.is_won;
  const isLost = selectedStage ? selectedStage.is_lost : deal.pipeline_stages?.is_lost;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Header Card */}
        <GlassCard>
          {editing ? (
            <div className="space-y-4">
              <Input label="Deal Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Deal title" required />
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">Revenue Breakdown</label>
                <div className="grid grid-cols-3 gap-3">
                  <Input label="Audit Fee ($)" type="number" value={auditFee} onChange={(e) => setAuditFee(e.target.value)} placeholder="0" />
                  <Input label="Monthly Retainer ($)" type="number" value={retainerMonthly} onChange={(e) => setRetainerMonthly(e.target.value)} placeholder="0" />
                  <Input label="Custom Dev Fee ($)" type="number" value={customDevFee} onChange={(e) => setCustomDevFee(e.target.value)} placeholder="0" />
                </div>
                <p className="mt-1 text-[11px] text-text-tertiary">Total: {formatCurrency((Number(auditFee) || 0) + (Number(retainerMonthly) || 0) + (Number(customDevFee) || 0), deal.currency)}</p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">Revenue Tracking Period</label>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Start Date" type="date" value={revenueStartDate} onChange={(e) => setRevenueStartDate(e.target.value)} />
                  <Input label="End Date (optional)" type="date" value={revenueEndDate} onChange={(e) => setRevenueEndDate(e.target.value)} />
                </div>
                <p className="mt-1 text-[11px] text-text-tertiary">Set a start date to enable monthly revenue tracking. Leave end date blank for ongoing relationships — revenue will track to the current month automatically.</p>
              </div>
              <Input label="Probability %" type="number" value={probability} onChange={(e) => setProbability(e.target.value)} placeholder="0-100" />
              {/* Pipeline & Stage selectors */}
              {allPipelines.length > 1 && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-text-secondary">Pipeline</label>
                  <Select
                    value={pipelineId}
                    onValueChange={(newPipelineId) => {
                      setPipelineId(newPipelineId);
                      // Auto-select first non-terminal stage in the new pipeline, or first stage
                      const newPipeline = allPipelines.find((p) => p.id === newPipelineId);
                      const sorted = [...(newPipeline?.pipeline_stages ?? [])].sort((a, b) => a.display_order - b.display_order);
                      const firstOpen = sorted.find((s) => !s.is_won && !s.is_lost);
                      setStageId(firstOpen?.id ?? sorted[0]?.id ?? "");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select pipeline" />
                    </SelectTrigger>
                    <SelectContent>
                      {allPipelines.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          <span className="flex items-center gap-2">
                            {p.name}
                            {p.is_default && (
                              <span className="text-[10px] text-text-tertiary">(Default)</span>
                            )}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {availableStages.length > 0 && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-text-secondary">Stage</label>
                  <Select value={stageId} onValueChange={setStageId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStages.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            <span className="flex items-center gap-2">
                              <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                              {s.name}
                              {s.is_won && " (Won)"}
                              {s.is_lost && " (Lost)"}
                            </span>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-text-secondary">Priority</label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                    <SelectContent>
                      {DEAL_PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-text-secondary">Source</label>
                  <Select value={source} onValueChange={setSource}>
                    <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                    <SelectContent>
                      {DEAL_SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-text-secondary">Payment Type</label>
                  <Select value={paymentType} onValueChange={setPaymentType}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {DEAL_PAYMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{DEAL_PAYMENT_TYPE_LABELS[t]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {paymentType === "retainer" && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-text-secondary">Payment Frequency</label>
                    <Select value={paymentFrequency} onValueChange={setPaymentFrequency}>
                      <SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger>
                      <SelectContent>
                        {DEAL_PAYMENT_FREQUENCIES.map((f) => <SelectItem key={f} value={f}>{DEAL_PAYMENT_FREQUENCY_LABELS[f]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-text-secondary">Industry</label>
                  <Select value={dealIndustry} onValueChange={setDealIndustry}>
                    <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                    <SelectContent>
                      {DEAL_INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{DEAL_INDUSTRY_LABELS[i]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-text-secondary">Company Size</label>
                  <Select value={companySize} onValueChange={setCompanySize}>
                    <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                    <SelectContent>
                      {DEAL_COMPANY_SIZES.map((s) => <SelectItem key={s} value={s}>{s} employees</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Input label="Expected Close Date" type="date" value={expectedCloseDate} onChange={(e) => setExpectedCloseDate(e.target.value)} />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-text-secondary">Contact</label>
                  <Select value={contactId} onValueChange={setContactId} disabled={loadingLists}>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingLists ? "Loading..." : "Select contact"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>
                        <span className="text-text-tertiary">No contact</span>
                      </SelectItem>
                      {contactsList.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.first_name} {c.last_name}
                          {c.email && <span className="ml-1 text-text-tertiary">({c.email})</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-text-secondary">Company</label>
                  <Select value={companyId} onValueChange={setCompanyId} disabled={loadingLists}>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingLists ? "Loading..." : "Select company"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>
                        <span className="text-text-tertiary">No company</span>
                      </SelectItem>
                      {companiesList.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.company_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Input label="Next Step" value={nextStep} onChange={(e) => setNextStep(e.target.value)} placeholder="What's the next action?" />
              <Input label="Competitor" value={competitor} onChange={(e) => setCompetitor(e.target.value)} placeholder="Main competitor" />
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-text-secondary">Scope of Work</label>
                <textarea value={scope} onChange={(e) => setScope(e.target.value)} placeholder="Define the scope of work..." rows={3} className="glass-panel-dense focus-ring w-full rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary resize-none" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-text-secondary">Services Description</label>
                <textarea value={servicesDescription} onChange={(e) => setServicesDescription(e.target.value)} placeholder="Describe the services..." rows={3} className="glass-panel-dense focus-ring w-full rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary resize-none" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-text-secondary">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add notes about this deal..." rows={4} className="glass-panel-dense focus-ring w-full rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary resize-none" />
              </div>
              {isWon && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-signal-success">Win Reason</label>
                  <textarea value={winReason} onChange={(e) => setWinReason(e.target.value)} placeholder="Why was this deal won?" rows={2} className="glass-panel-dense focus-ring w-full rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary resize-none" />
                </div>
              )}
              {isLost && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-signal-danger">Lost Reason</label>
                  <textarea value={lostReason} onChange={(e) => setLostReason(e.target.value)} placeholder="Why was this deal lost?" rows={2} className="glass-panel-dense focus-ring w-full rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary resize-none" />
                </div>
              )}
              <div className="flex justify-end pt-2">
                <Button onClick={saveEdit} size="sm" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-text-primary">{deal.title}</h1>
                  <p className="mt-1 font-mono text-3xl font-bold text-text-primary">{formatCurrency(deal.value, deal.currency)}</p>
                  {(deal.audit_fee > 0 || deal.retainer_monthly > 0 || deal.custom_dev_fee > 0) && (
                    <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-text-secondary">
                      {deal.audit_fee > 0 && <span>Audit: {formatCurrency(deal.audit_fee, deal.currency)}</span>}
                      {deal.retainer_monthly > 0 && <span>Retainer/mo: {formatCurrency(deal.retainer_monthly, deal.currency)}</span>}
                      {deal.custom_dev_fee > 0 && <span>Custom Dev: {formatCurrency(deal.custom_dev_fee, deal.currency)}</span>}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {deal.pipeline_stages && (
                    <Badge variant={isWon ? "success" : isLost ? "danger" : "secondary"}>
                      <span className="mr-1.5 h-2 w-2 rounded-full inline-block" style={{ backgroundColor: deal.pipeline_stages.color }} />
                      {deal.pipeline_stages.name}
                    </Badge>
                  )}
                  {deal.priority && <Badge variant={priorityVariant(deal.priority)}>{deal.priority}</Badge>}
                </div>
              </div>
              {deal.description && <p className="mt-4 text-sm text-text-secondary leading-relaxed">{deal.description}</p>}
            </>
          )}
        </GlassCard>

        {/* Deal Information Grid */}
        {!editing && (
          <GlassCard>
            <h3 className="mb-4 text-sm font-semibold text-text-primary">Deal Information</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                { icon: DollarSign, color: "text-accent-primary", label: "Total Value", val: formatCurrency(deal.value, deal.currency) },
                { icon: DollarSign, color: "text-signal-warning", label: "Audit Fee", val: formatCurrency(deal.audit_fee, deal.currency) },
                { icon: Repeat, color: "text-signal-success", label: "Retainer/mo", val: formatCurrency(deal.retainer_monthly, deal.currency) },
                { icon: DollarSign, color: "text-accent-cyan", label: "Custom Dev", val: formatCurrency(deal.custom_dev_fee, deal.currency) },
                { icon: Percent, color: "text-accent-cyan", label: "Probability", val: `${deal.probability ?? 0}%` },
                { icon: Target, color: "text-signal-warning", label: "Priority", val: deal.priority || "—" },
                { icon: Tag, color: "text-signal-info", label: "Source", val: deal.source || "—" },
                { icon: Calendar, color: "text-signal-success", label: "Expected Close", val: deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString() : "—" },
                { icon: Calendar, color: "text-accent-primary", label: "Revenue Start", val: deal.revenue_start_date ? new Date(deal.revenue_start_date).toLocaleDateString() : "—" },
                { icon: Calendar, color: "text-signal-danger", label: "Revenue End", val: deal.revenue_end_date ? new Date(deal.revenue_end_date).toLocaleDateString() : deal.revenue_start_date ? "Ongoing" : "—" },
                { icon: Repeat, color: "text-accent-purple", label: "Payment Type", val: deal.payment_type ? DEAL_PAYMENT_TYPE_LABELS[deal.payment_type] : "—" },
                ...(deal.payment_type === "retainer" ? [{ icon: Clock, color: "text-accent-cyan", label: "Frequency", val: deal.payment_frequency ? DEAL_PAYMENT_FREQUENCY_LABELS[deal.payment_frequency] : "—" }] : []),
                { icon: Briefcase, color: "text-accent-primary", label: "Industry", val: deal.deal_industry ? DEAL_INDUSTRY_LABELS[deal.deal_industry] : "—" },
                { icon: Users, color: "text-signal-info", label: "Company Size", val: deal.company_size ? `${deal.company_size} employees` : "—" },
                { icon: Crosshair, color: "text-signal-danger", label: "Competitor", val: deal.competitor || "—" },
                { icon: TrendingUp, color: "text-signal-success", label: "Next Step", val: deal.next_step || "—" },
                { icon: Clock, color: "text-text-tertiary", label: "Created", val: formatRelativeTime(deal.created_at) },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 rounded-lg bg-bg-elevated/30 px-3 py-3">
                  <item.icon className={`h-4 w-4 ${item.color} shrink-0`} />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-text-tertiary">{item.label}</p>
                    <p className="text-sm font-medium text-text-primary truncate">{item.val}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Scope of Work */}
        {!editing && deal.scope && (
          <GlassCard>
            <h3 className="mb-3 text-sm font-semibold text-text-primary">
              <FileText className="mr-2 inline h-4 w-4 text-accent-primary" />
              Scope of Work
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{deal.scope}</p>
          </GlassCard>
        )}

        {/* Services Description */}
        {!editing && deal.services_description && (
          <GlassCard>
            <h3 className="mb-3 text-sm font-semibold text-text-primary">
              <Briefcase className="mr-2 inline h-4 w-4 text-accent-cyan" />
              Services Description
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{deal.services_description}</p>
          </GlassCard>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Owner */}
        {deal.users && (
          <GlassCard>
            <h3 className="mb-4 text-sm font-semibold text-text-primary">Deal Owner</h3>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-bg-elevated">
                {deal.users.avatar_url ? (
                  <img src={deal.users.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <User className="h-4 w-4 text-text-secondary" />
                )}
              </div>
              <p className="text-sm font-medium text-text-primary">{deal.users.full_name}</p>
            </div>
          </GlassCard>
        )}

        {/* Contact */}
        <GlassCard>
          <h3 className="mb-4 text-sm font-semibold text-text-primary">Contact</h3>
          {deal.contacts ? (
            <Link href={`/contacts/${deal.contacts.id}`} className="flex items-center gap-3 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-bg-elevated">
                <User className="h-4 w-4 text-text-secondary" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary group-hover:text-accent-primary transition-colors">{deal.contacts.first_name} {deal.contacts.last_name}</p>
                {deal.contacts.email && <p className="text-xs text-text-tertiary">{deal.contacts.email}</p>}
              </div>
            </Link>
          ) : (
            <p className="text-sm text-text-tertiary">No contact linked</p>
          )}
        </GlassCard>

        {/* Company */}
        <GlassCard>
          <h3 className="mb-4 text-sm font-semibold text-text-primary">Company</h3>
          {deal.companies ? (
            <Link href={`/companies/${deal.companies.id}`} className="flex items-center gap-3 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-bg-elevated">
                <Building2 className="h-4 w-4 text-text-secondary" />
              </div>
              <p className="text-sm font-medium text-text-primary group-hover:text-accent-primary transition-colors">{deal.companies.company_name}</p>
            </Link>
          ) : (
            <p className="text-sm text-text-tertiary">No company linked</p>
          )}
        </GlassCard>

        {/* Deal Contacts */}
        <DealContactsPanel dealId={deal.id} />

        {/* Win Reason */}
        {isWon && deal.win_reason && (
          <GlassCard glow="success">
            <h3 className="mb-2 text-sm font-semibold text-signal-success">
              <Award className="mr-2 inline h-4 w-4" />
              Win Reason
            </h3>
            <p className="text-sm text-text-secondary">{deal.win_reason}</p>
          </GlassCard>
        )}

        {/* Lost Reason */}
        {isLost && deal.lost_reason && (
          <GlassCard glow="danger">
            <h3 className="mb-2 text-sm font-semibold text-signal-danger">
              <Shield className="mr-2 inline h-4 w-4" />
              Lost Reason
            </h3>
            <p className="text-sm text-text-secondary">{deal.lost_reason}</p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
