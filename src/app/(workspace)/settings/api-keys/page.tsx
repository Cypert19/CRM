import { PageHeader } from "@/components/layout/page-header";
import { getApiKeys } from "@/actions/api-keys";
import { getWorkspaceContext } from "@/lib/workspace";
import { ApiKeysSettingsView } from "@/components/settings/api-keys-settings-view";

export const metadata = { title: "API Keys" };

export default async function ApiKeysSettingsPage() {
  const [result, ctx] = await Promise.all([getApiKeys(), getWorkspaceContext()]);
  const keys = result.success ? result.data ?? [] : [];
  const isAdmin = ctx?.role === "Admin";

  return (
    <>
      <PageHeader
        title="API Keys"
        description="Manage API keys for external integrations and agents"
      />
      <div className="mt-6">
        <ApiKeysSettingsView apiKeys={keys} isAdmin={isAdmin} />
      </div>
    </>
  );
}
