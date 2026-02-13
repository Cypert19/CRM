import { PageHeader } from "@/components/layout/page-header";
import { getWorkspaceMembers } from "@/actions/workspace";
import { getWorkspaceContext } from "@/lib/workspace";
import { MembersSettingsView } from "@/components/settings/members-settings-view";

export const metadata = { title: "Team Members" };

export default async function MembersSettingsPage() {
  const [result, ctx] = await Promise.all([getWorkspaceMembers(), getWorkspaceContext()]);
  const members = result.success ? result.data ?? [] : [];
  const isAdmin = ctx?.role === "Admin";

  return (
    <>
      <PageHeader title="Team Members" description="Manage who has access to this workspace" />
      <div className="mt-6">
        <MembersSettingsView members={members} isAdmin={isAdmin} />
      </div>
    </>
  );
}
