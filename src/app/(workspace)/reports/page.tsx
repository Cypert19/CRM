import { PageHeader } from "@/components/layout/page-header";
import { getReportData } from "@/actions/reports";
import { ReportsDashboard } from "@/components/reports/reports-dashboard";

export const metadata = { title: "Reports" };

export default async function ReportsPage() {
  const result = await getReportData();

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
  };

  const data = result.success && result.data ? result.data : emptyData;

  return (
    <>
      <PageHeader title="Reports" description="Pipeline analytics and insights" />
      <div className="mt-6">
        <ReportsDashboard data={data} />
      </div>
    </>
  );
}
