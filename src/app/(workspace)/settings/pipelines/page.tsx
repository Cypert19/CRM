import { PageHeader } from "@/components/layout/page-header";
import { getPipelines } from "@/actions/pipelines";
import { PipelineSettingsView } from "@/components/settings/pipeline-settings-view";

export const metadata = { title: "Pipeline Settings" };

export default async function PipelineSettingsPage() {
  const result = await getPipelines();
  const pipelines = result.success ? result.data ?? [] : [];

  return (
    <>
      <PageHeader title="Pipeline Settings" description="Configure your deal pipeline stages" />
      <div className="mt-6">
        <PipelineSettingsView pipelines={pipelines} />
      </div>
    </>
  );
}
