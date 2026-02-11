import { PageHeader } from "@/components/layout/page-header";
import { getWorkspace } from "@/actions/workspace";
import { WorkspaceSettingsForm } from "@/components/settings/workspace-settings-form";

export const metadata = { title: "Settings" };

export default async function GeneralSettingsPage() {
  const result = await getWorkspace();
  const workspace = result.success ? result.data : null;

  return (
    <>
      <PageHeader title="General Settings" description="Manage your workspace configuration" />
      <div className="mt-6 max-w-2xl">
        {workspace ? (
          <WorkspaceSettingsForm workspace={workspace} />
        ) : (
          <p className="text-text-secondary">Unable to load workspace settings.</p>
        )}
      </div>
    </>
  );
}
