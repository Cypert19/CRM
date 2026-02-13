import { PageHeader } from "@/components/layout/page-header";
import { getReportData } from "@/actions/reports";
import { ReportsPageTabs } from "@/components/reports/reports-page-tabs";

export const metadata = { title: "Reports" };

export default async function ReportsPage() {
  const result = await getReportData();

  if (!result.success) {
    console.error("[reports page] getReportData failed:", result.error);
  }

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

  return (
    <>
      <PageHeader title="Reports" description="Pipeline analytics and insights" />
      <div className="mt-6">
        <ReportsPageTabs data={data} />
      </div>
    </>
  );
}
