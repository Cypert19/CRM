import { getDeals } from "@/actions/deals";
import { getPipelines } from "@/actions/pipelines";
import { DealsView } from "@/components/deals/deals-view";
import type { Tables } from "@/types/database";

export const metadata = { title: "Deals" };

type PipelineWithStages = Tables<"pipelines"> & {
  pipeline_stages: Tables<"pipeline_stages">[];
};

export default async function DealsPage() {
  const [dealsRes, pipelinesRes] = await Promise.all([
    getDeals(),
    getPipelines(),
  ]);

  const deals = dealsRes.success ? dealsRes.data ?? [] : [];
  const pipelines = (pipelinesRes.success ? pipelinesRes.data ?? [] : []) as PipelineWithStages[];
  const defaultPipeline = pipelines.find((p) => p.is_default) ?? pipelines[0];
  const stages = defaultPipeline?.pipeline_stages ?? [];

  return (
    <DealsView
      deals={deals}
      stages={stages}
      pipelineId={defaultPipeline?.id ?? ""}
    />
  );
}
