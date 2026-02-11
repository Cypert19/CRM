"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/gradient-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateWorkspace } from "@/actions/workspace";
import { toast } from "sonner";
import type { Tables } from "@/types/database";
import { Save } from "lucide-react";

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "INR", "BRL"];
const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Australia/Sydney",
  "Pacific/Auckland",
];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function WorkspaceSettingsForm({ workspace }: { workspace: Tables<"workspaces"> }) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(workspace.name);
  const [currency, setCurrency] = useState(workspace.default_currency);
  const [timezone, setTimezone] = useState(workspace.default_timezone);
  const [fiscalMonth, setFiscalMonth] = useState(String(workspace.fiscal_year_start_month));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await updateWorkspace({
      name,
      default_currency: currency,
      default_timezone: timezone,
      fiscal_year_start_month: Number(fiscalMonth),
    });

    setLoading(false);
    if (result.success) {
      toast.success("Settings saved");
    } else {
      toast.error(result.error || "Failed to save settings");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <GlassCard>
        <h3 className="text-sm font-semibold text-text-primary">Workspace Details</h3>
        <p className="mt-1 text-xs text-text-tertiary">Basic information about your workspace</p>
        <div className="mt-4 space-y-4">
          <Input
            label="Workspace Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Workspace"
            required
          />
          <div className="grid grid-cols-2 gap-4 text-xs text-text-tertiary">
            <div>
              <span className="text-text-secondary">Slug:</span> {workspace.slug}
            </div>
            <div>
              <span className="text-text-secondary">Created:</span>{" "}
              {new Date(workspace.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="text-sm font-semibold text-text-primary">Regional Settings</h3>
        <p className="mt-1 text-xs text-text-tertiary">Currency, timezone, and fiscal year configuration</p>
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs text-text-secondary">Default Currency</label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs text-text-secondary">Timezone</label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs text-text-secondary">Fiscal Year Start Month</label>
            <Select value={fiscalMonth} onValueChange={setFiscalMonth}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </GlassCard>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          <Save className="h-4 w-4" />
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
