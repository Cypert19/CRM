"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Building2, Globe } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/gradient-button";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { CompanyForm } from "./company-form";
import type { Tables } from "@/types/database";

export function CompanyList({ companies }: { companies: Tables<"companies">[] }) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);

  const columns: Column<Tables<"companies">>[] = [
    { key: "company_name", header: "Company", sortable: true, render: (r) => <span className="font-medium text-text-primary">{r.company_name}</span> },
    { key: "industry", header: "Industry", render: (r) => r.industry ?? <span className="text-text-tertiary">—</span> },
    { key: "domain", header: "Website", render: (r) => r.domain ? <span className="flex items-center gap-1 text-text-secondary"><Globe className="h-3 w-3" />{r.domain}</span> : <span className="text-text-tertiary">—</span> },
    { key: "employee_count_range", header: "Size", render: (r) => r.employee_count_range ? <Badge variant="secondary">{r.employee_count_range}</Badge> : <span className="text-text-tertiary">—</span> },
  ];

  if (companies.length === 0) {
    return (
      <>
        <EmptyState icon={Building2} title="No companies yet" description="Add your first company." action={<Button onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" />Add Company</Button>} />
        <CompanyForm open={formOpen} onOpenChange={setFormOpen} />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Companies" description="Manage organizations">
        <Button onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" />Add Company</Button>
      </PageHeader>
      <div className="mt-6"><DataTable data={companies} columns={columns} keyExtractor={(r) => r.id} onRowClick={(r) => router.push(`/companies/${r.id}`)} /></div>
      <CompanyForm open={formOpen} onOpenChange={setFormOpen} />
    </>
  );
}
