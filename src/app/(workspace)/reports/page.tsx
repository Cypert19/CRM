import { PageHeader } from "@/components/layout/page-header";
import { getReportData, getTeamProductivityData, getActiveClientsData } from "@/actions/reports";
import { getWorkspaceContext } from "@/lib/workspace";
import { ReportsPageTabs } from "@/components/reports/reports-page-tabs";

export const metadata = { title: "Reports" };

export default async function ReportsPage() {
  const [result, productivityResult, activeClientsResult, ctx] = await Promise.all([
    getReportData(),
    getTeamProductivityData(),
    getActiveClientsData(),
    getWorkspaceContext(),
  ]);

  if (!result.success) {
    console.error("[reports page] getReportData failed:", result.error);
  }

  const isAdmin = ctx?.role === "Admin";

  const emptyBreakdown = { audit_fee: 0, retainer_monthly: 0, custom_dev_fee: 0 };
  const emptyData = {
    pipeline_stages: [],
    deal_trends: [],
    win_loss: {
      total_deals: 0,
      won_deals: 0,
      lost_deals: 0,
      open_deals: 0,
      win_rate: 0,
      total_won_value: 0,
      total_lost_value: 0,
      avg_deal_size: 0,
      by_source: [],
    },
    velocity: {
      avg_days_to_close: 0,
      avg_days_by_stage: [],
      monthly_velocity: [],
    },
    total_pipeline_value: 0,
    total_won_value: 0,
    total_lost_value: 0,
    total_deals: 0,
    conversion_rate: 0,
    revenue_breakdown: emptyBreakdown,
    won_revenue_breakdown: emptyBreakdown,
    pipeline_revenue_breakdown: emptyBreakdown,
    monthly_revenue: [],
  };

  const data = result.success && result.data ? result.data : emptyData;

  const productivityData = productivityResult.success && productivityResult.data
    ? productivityResult.data
    : { members: [], team_totals: { total_overdue: 0, total_completed: 0, total_tasks: 0, avg_completion_rate: 0, avg_focus_minutes: 0 } };

  const activeClientsData = activeClientsResult.success && activeClientsResult.data
    ? activeClientsResult.data
    : { deals: [], stages: [], totals: { total_deals: 0, total_monthly_revenue: 0, total_value: 0, avg_days_active: 0 } };

  return (
    <>
      <PageHeader title="Reports" description="Pipeline analytics and insights" />
      <div className="mt-6">
        <ReportsPageTabs
          data={data}
          isAdmin={isAdmin}
          productivityData={productivityData}
          activeClientsData={activeClientsData}
        />
      </div>
    </>
  );
}
