import { notFound } from "next/navigation";
import { getDeal, getDealWithRelations } from "@/actions/deals";
import { getPipelines } from "@/actions/pipelines";
import { DealDetail } from "@/components/deals/deal-detail";

export async function generateMetadata({ params }: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await params;
  const result = await getDeal(dealId);
  return { title: result.success ? result.data?.title : "Deal" };
}

export default async function DealDetailPage({ params }: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await params;
  const result = await getDealWithRelations(dealId);

  if (!result.success || !result.data) notFound();

  // Fetch all pipelines with stages for pipeline/stage editing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deal = result.data as any;
  const pipelinesResult = await getPipelines();
  const allPipelines = pipelinesResult.success ? pipelinesResult.data ?? [] : [];

  // Extract stages for the current pipeline (backward compat)
  const currentPipeline = allPipelines.find((p) => p.id === deal.pipeline_id);
  const pipelineStages = currentPipeline?.pipeline_stages ?? [];

  return <DealDetail deal={deal} pipelineStages={pipelineStages} allPipelines={allPipelines} />;
}
