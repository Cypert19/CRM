"use client";

import { useState } from "react";
import { Button } from "@/components/ui/gradient-button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { createDeal } from "@/actions/deals";
import { DEAL_PRIORITIES, DEAL_SOURCES, DEAL_PAYMENT_TYPES, DEAL_PAYMENT_TYPE_LABELS, DEAL_INDUSTRIES, DEAL_INDUSTRY_LABELS, DEAL_COMPANY_SIZES } from "@/lib/constants";
import type { Tables } from "@/types/database";
import { toast } from "sonner";

type DealFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stages: Tables<"pipeline_stages">[];
  pipelineId: string;
  defaultStageId?: string;
};

export function DealForm({
  open,
  onOpenChange,
  stages,
  pipelineId,
  defaultStageId,
}: DealFormProps) {
  const [loading, setLoading] = useState(false);
  const [stageId, setStageId] = useState(defaultStageId || stages[0]?.id || "");
  const [priority, setPriority] = useState("");
  const [source, setSource] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [dealIndustry, setDealIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await createDeal({
      title: formData.get("title") as string,
      value: Number(formData.get("value")) || 0,
      stage_id: stageId,
      pipeline_id: pipelineId,
      priority: priority || undefined,
      source: source || undefined,
      payment_type: paymentType || undefined,
      deal_industry: dealIndustry || undefined,
      company_size: companySize || undefined,
      expected_close_date: (formData.get("expected_close_date") as string) || undefined,
      description: (formData.get("description") as string) || undefined,
    });

    setLoading(false);
    if (result.success) {
      toast.success("Deal created");
      onOpenChange(false);
      // Reset form state
      setStageId(defaultStageId || stages[0]?.id || "");
      setPriority("");
      setSource("");
      setPaymentType("");
      setDealIndustry("");
      setCompanySize("");
    } else {
      toast.error(result.error || "Failed to create deal");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Deal</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            name="title"
            label="Deal Title"
            placeholder="e.g. Acme Corp - Enterprise License"
            required
            autoFocus
          />

          <Input
            name="value"
            label="Value"
            type="number"
            min={0}
            step={0.01}
            placeholder="0"
          />

          <div className="space-y-1.5">
            <label className="block text-xs text-text-secondary">Stage</label>
            <Select value={stageId} onValueChange={setStageId}>
              <SelectTrigger>
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                {stages
                  .sort((a, b) => a.display_order - b.display_order)
                  .map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: stage.color }}
                        />
                        {stage.name}
                      </span>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <Input
            name="expected_close_date"
            label="Expected Close Date"
            type="date"
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs text-text-secondary">Priority</label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {DEAL_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs text-text-secondary">Source</label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {DEAL_SOURCES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs text-text-secondary">Payment Type</label>
              <Select value={paymentType} onValueChange={setPaymentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {DEAL_PAYMENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {DEAL_PAYMENT_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs text-text-secondary">Industry</label>
              <Select value={dealIndustry} onValueChange={setDealIndustry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {DEAL_INDUSTRIES.map((i) => (
                    <SelectItem key={i} value={i}>
                      {DEAL_INDUSTRY_LABELS[i]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs text-text-secondary">Company Size</label>
              <Select value={companySize} onValueChange={setCompanySize}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {DEAL_COMPANY_SIZES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Deal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
