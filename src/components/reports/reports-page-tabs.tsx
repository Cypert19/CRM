"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ReportsDashboard } from "./reports-dashboard";
import { CustomDashboardView } from "@/components/dashboard/custom-dashboard-view";
import { TeamProductivityView } from "./team-productivity-view";
import { ActiveClientsView } from "./active-clients-view";
import { BarChart3, LayoutDashboard, Briefcase, Users } from "lucide-react";
import type { ReportSummary, TeamProductivityData, ActiveClientsData } from "@/actions/reports";

type Props = {
  data: ReportSummary;
  isAdmin: boolean;
  productivityData: TeamProductivityData;
  activeClientsData: ActiveClientsData;
};

export function ReportsPageTabs({ data, isAdmin, productivityData, activeClientsData }: Props) {
  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview" className="gap-1.5">
          <BarChart3 className="h-3.5 w-3.5" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="active-clients" className="gap-1.5">
          <Briefcase className="h-3.5 w-3.5" />
          Active Clients
        </TabsTrigger>
        {isAdmin && (
          <TabsTrigger value="team-productivity" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Team Productivity
          </TabsTrigger>
        )}
        <TabsTrigger value="custom" className="gap-1.5">
          <LayoutDashboard className="h-3.5 w-3.5" />
          Custom Dashboard
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <ReportsDashboard data={data} />
      </TabsContent>

      <TabsContent value="active-clients">
        <ActiveClientsView data={activeClientsData} />
      </TabsContent>

      {isAdmin && (
        <TabsContent value="team-productivity">
          <TeamProductivityView data={productivityData} />
        </TabsContent>
      )}

      <TabsContent value="custom">
        <CustomDashboardView />
      </TabsContent>
    </Tabs>
  );
}
