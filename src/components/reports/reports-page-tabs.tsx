"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ReportsDashboard } from "./reports-dashboard";
import { CustomDashboardView } from "@/components/dashboard/custom-dashboard-view";
import { BarChart3, LayoutDashboard } from "lucide-react";
import type { ReportSummary } from "@/actions/reports";

type Props = {
  data: ReportSummary;
};

export function ReportsPageTabs({ data }: Props) {
  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview" className="gap-1.5">
          <BarChart3 className="h-3.5 w-3.5" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="custom" className="gap-1.5">
          <LayoutDashboard className="h-3.5 w-3.5" />
          Custom Dashboard
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <ReportsDashboard data={data} />
      </TabsContent>

      <TabsContent value="custom">
        <CustomDashboardView />
      </TabsContent>
    </Tabs>
  );
}
