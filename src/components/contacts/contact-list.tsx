"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users, Mail, Building2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/gradient-button";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ContactForm } from "./contact-form";
import type { Tables } from "@/types/database";

type ContactRow = Tables<"contacts"> & {
  companies?: { id: string; company_name: string } | null;
};

export function ContactsList({ contacts }: { contacts: ContactRow[] }) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);

  const columns: Column<ContactRow>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={`${row.first_name} ${row.last_name}`} src={row.avatar_url} size="sm" />
          <div>
            <span className="font-medium text-text-primary">{row.first_name} {row.last_name}</span>
            {row.job_title && <p className="text-xs text-text-tertiary">{row.job_title}</p>}
          </div>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      render: (row) => row.email ? (
        <span className="flex items-center gap-1.5 text-text-secondary">
          <Mail className="h-3 w-3" />
          {row.email}
        </span>
      ) : <span className="text-text-tertiary">—</span>,
    },
    {
      key: "company",
      header: "Company",
      render: (row) => row.companies ? (
        <span className="flex items-center gap-1.5 text-text-secondary">
          <Building2 className="h-3 w-3" />
          {row.companies.company_name}
        </span>
      ) : <span className="text-text-tertiary">—</span>,
    },
    {
      key: "lifecycle_stage",
      header: "Stage",
      render: (row) => row.lifecycle_stage ? (
        <Badge variant="secondary">{row.lifecycle_stage}</Badge>
      ) : <span className="text-text-tertiary">—</span>,
    },
  ];

  if (contacts.length === 0) {
    return (
      <>
        <EmptyState
          icon={Users}
          title="No contacts yet"
          description="Add your first contact to start building relationships."
          action={<Button onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" />Add Contact</Button>}
        />
        <ContactForm open={formOpen} onOpenChange={setFormOpen} />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Contacts" description="Manage your relationships">
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Contact
        </Button>
      </PageHeader>
      <div className="mt-6">
        <DataTable
          data={contacts}
          columns={columns}
          keyExtractor={(row) => row.id}
          onRowClick={(row) => router.push(`/contacts/${row.id}`)}
        />
      </div>
      <ContactForm open={formOpen} onOpenChange={setFormOpen} />
    </>
  );
}
