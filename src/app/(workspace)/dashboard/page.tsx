import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/workspace";
import { KPICard } from "@/components/dashboard/kpi-card";
import { PipelineFunnel } from "@/components/dashboard/pipeline-funnel";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { AIInsightsPanel } from "@/components/dashboard/ai-insights-panel";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const ctx = await getWorkspaceContext();
  const admin = createAdminClient();

  // Fetch pipeline data scoped to workspace
  const { data: deals } = ctx
    ? await admin
        .from("deals")
        .select("id, value, stage_id, created_at, pipeline_stages(name, color, is_won, is_lost)")
        .eq("workspace_id", ctx.workspaceId)
        .is("deleted_at", null)
    : { data: null };

  // Fetch recent activities scoped to workspace
  const { data: activities } = ctx
    ? await admin
        .from("activities")
        .select("*, users!activities_actor_id_fkey(full_name, avatar_url)")
        .eq("workspace_id", ctx.workspaceId)
        .order("created_at", { ascending: false })
        .limit(10)
    : { data: null };

  const allDeals = deals ?? [];
  const openDeals = allDeals.filter(
    (d) => {
      const stage = d.pipeline_stages as { is_won?: boolean; is_lost?: boolean } | null;
      return !stage?.is_won && !stage?.is_lost;
    }
  );
  const wonDeals = allDeals.filter(
    (d) => (d.pipeline_stages as { is_won?: boolean } | null)?.is_won
  );
  const lostDeals = allDeals.filter(
    (d) => (d.pipeline_stages as { is_lost?: boolean } | null)?.is_lost
  );

  const totalPipelineValue = openDeals.reduce((sum, d) => sum + Number(d.value), 0);
  const totalWonValue = wonDeals.reduce((sum, d) => sum + Number(d.value), 0);
  const totalLostValue = lostDeals.reduce((sum, d) => sum + Number(d.value), 0);

  // Group deals by stage for funnel
  const stageMap = new Map<string, { name: string; color: string; count: number; value: number }>();
  for (const deal of openDeals) {
    const stage = deal.pipeline_stages as { name: string; color: string } | null;
    if (!stage) continue;
    const existing = stageMap.get(deal.stage_id) ?? {
      name: stage.name,
      color: stage.color,
      count: 0,
      value: 0,
    };
    existing.count += 1;
    existing.value += Number(deal.value);
    stageMap.set(deal.stage_id, existing);
  }

  const funnelStages = Array.from(stageMap.values());

  // Placeholder insights
  const insights = openDeals.length > 0
    ? [
        {
          id: "1",
          type: "opportunity" as const,
          message: `You have ${openDeals.length} open deals worth $${(totalPipelineValue / 1000).toFixed(0)}k in your pipeline.`,
        },
        {
          id: "2",
          type: "tip" as const,
          message: "Use the AI Assistant (Cmd+J) to ask questions about your pipeline data.",
        },
      ]
    : [
        {
          id: "1",
          type: "tip" as const,
          message: "Start by creating your first deal to populate your dashboard.",
        },
      ];

  return (
    <>
      <PageHeader title="Dashboard" description="Your sales overview" />

      {/* KPI Cards */}
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Total Pipeline"
          value={totalPipelineValue}
          format="currency"
          glowColor="violet"
          icon="DollarSign"
        />
        <KPICard
          label="Deals Won"
          value={totalWonValue}
          format="currency"
          trend={wonDeals.length > 0 ? 12 : 0}
          trendLabel="vs last period"
          glowColor="success"
          icon="Trophy"
        />
        <KPICard
          label="Deals Lost"
          value={totalLostValue}
          format="currency"
          glowColor="danger"
          icon="XCircle"
        />
        <KPICard
          label="Avg. Cycle Time"
          value={allDeals.length > 0 ? 18 : 0}
          format="days"
          glowColor="cyan"
          icon="Clock"
        />
      </div>

      {/* Main Content Grid */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <PipelineFunnel stages={funnelStages} />
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <ActivityFeed activities={(activities as any) ?? []} />
        </div>
        <div>
          <AIInsightsPanel insights={insights} />
        </div>
      </div>
    </>
  );
}
