import type { EntitySource, EntityFieldMeta } from "@/types/dashboard";

export const ENTITY_FIELD_MAP: Record<EntitySource, EntityFieldMeta[]> = {
  deals: [
    { key: "value", label: "Total Value", type: "number", aggregatable: true, groupable: false, filterable: true },
    { key: "audit_fee", label: "Audit Fee", type: "number", aggregatable: true, groupable: false, filterable: true },
    { key: "retainer_monthly", label: "Monthly Retainer", type: "number", aggregatable: true, groupable: false, filterable: true },
    { key: "custom_dev_fee", label: "Custom Dev Fee", type: "number", aggregatable: true, groupable: false, filterable: true },
    { key: "probability", label: "Probability (%)", type: "number", aggregatable: true, groupable: false, filterable: true },
    { key: "source", label: "Source", type: "enum", enumValues: ["Inbound", "Outbound", "Referral", "Partner", "Event", "Website", "LinkedIn", "Cold Outreach", "Conference", "Other"], aggregatable: false, groupable: true, filterable: true },
    { key: "priority", label: "Priority", type: "enum", enumValues: ["Low", "Medium", "High", "Critical"], aggregatable: false, groupable: true, filterable: true },
    { key: "deal_industry", label: "Industry", type: "text", aggregatable: false, groupable: true, filterable: true },
    { key: "company_size", label: "Company Size", type: "text", aggregatable: false, groupable: true, filterable: true },
    { key: "currency", label: "Currency", type: "text", aggregatable: false, groupable: true, filterable: true },
    { key: "payment_type", label: "Payment Type", type: "enum", enumValues: ["one_time", "retainer"], aggregatable: false, groupable: true, filterable: true },
    { key: "title", label: "Title", type: "text", aggregatable: false, groupable: false, filterable: true },
    { key: "created_at", label: "Created Date", type: "date", aggregatable: false, groupable: true, filterable: true },
    { key: "closed_at", label: "Closed Date", type: "date", aggregatable: false, groupable: true, filterable: true },
    { key: "expected_close_date", label: "Expected Close", type: "date", aggregatable: false, groupable: true, filterable: true },
    { key: "revenue_start_date", label: "Revenue Start", type: "date", aggregatable: false, groupable: true, filterable: true },
    { key: "revenue_end_date", label: "Revenue End", type: "date", aggregatable: false, groupable: true, filterable: true },
  ],
  contacts: [
    { key: "lifecycle_stage", label: "Lifecycle Stage", type: "enum", enumValues: ["Lead", "Marketing Qualified", "Sales Qualified", "Opportunity", "Customer", "Evangelist", "Other"], aggregatable: false, groupable: true, filterable: true },
    { key: "source", label: "Source", type: "enum", enumValues: ["Inbound", "Outbound", "Referral", "Partner", "Event", "Website", "LinkedIn", "Cold Outreach", "Conference", "Other"], aggregatable: false, groupable: true, filterable: true },
    { key: "first_name", label: "First Name", type: "text", aggregatable: false, groupable: false, filterable: true },
    { key: "last_name", label: "Last Name", type: "text", aggregatable: false, groupable: false, filterable: true },
    { key: "email", label: "Email", type: "text", aggregatable: false, groupable: false, filterable: true },
    { key: "job_title", label: "Job Title", type: "text", aggregatable: false, groupable: true, filterable: true },
    { key: "created_at", label: "Created Date", type: "date", aggregatable: false, groupable: true, filterable: true },
    { key: "last_contacted_at", label: "Last Contacted", type: "date", aggregatable: false, groupable: false, filterable: true },
  ],
  companies: [
    { key: "industry", label: "Industry", type: "text", aggregatable: false, groupable: true, filterable: true },
    { key: "employee_count_range", label: "Employee Count", type: "enum", enumValues: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5001+"], aggregatable: false, groupable: true, filterable: true },
    { key: "annual_revenue_range", label: "Annual Revenue", type: "enum", enumValues: ["<$1M", "$1M-$10M", "$10M-$50M", "$50M-$100M", "$100M-$500M", "$500M+"], aggregatable: false, groupable: true, filterable: true },
    { key: "company_name", label: "Company Name", type: "text", aggregatable: false, groupable: false, filterable: true },
    { key: "domain", label: "Domain", type: "text", aggregatable: false, groupable: false, filterable: true },
    { key: "created_at", label: "Created Date", type: "date", aggregatable: false, groupable: true, filterable: true },
  ],
  tasks: [
    { key: "status", label: "Status", type: "enum", enumValues: ["To Do", "In Progress", "Done", "Cancelled"], aggregatable: false, groupable: true, filterable: true },
    { key: "priority", label: "Priority", type: "enum", enumValues: ["Low", "Medium", "High", "Urgent"], aggregatable: false, groupable: true, filterable: true },
    { key: "task_type", label: "Type", type: "enum", enumValues: ["Call", "Email", "Meeting", "Follow-Up", "Demo", "Proposal", "Other"], aggregatable: false, groupable: true, filterable: true },
    { key: "title", label: "Title", type: "text", aggregatable: false, groupable: false, filterable: true },
    { key: "estimated_minutes", label: "Estimated Minutes", type: "number", aggregatable: true, groupable: false, filterable: true },
    { key: "actual_minutes", label: "Actual Minutes", type: "number", aggregatable: true, groupable: false, filterable: true },
    { key: "due_date", label: "Due Date", type: "date", aggregatable: false, groupable: true, filterable: true },
    { key: "completed_at", label: "Completed Date", type: "date", aggregatable: false, groupable: true, filterable: true },
    { key: "created_at", label: "Created Date", type: "date", aggregatable: false, groupable: true, filterable: true },
    { key: "category", label: "Category", type: "enum", enumValues: ["deal", "personal", "workshop", "other"], aggregatable: false, groupable: true, filterable: true },
  ],
  activities: [
    { key: "activity_type", label: "Activity Type", type: "enum", enumValues: ["deal_created", "deal_updated", "deal_stage_changed", "deal_won", "deal_lost", "contact_created", "contact_updated", "company_created", "company_updated", "note_created", "task_created", "task_completed", "file_uploaded", "file_deleted", "email_logged", "call_logged", "meeting_logged"], aggregatable: false, groupable: true, filterable: true },
    { key: "created_at", label: "Created Date", type: "date", aggregatable: false, groupable: true, filterable: true },
  ],
};

/** Get fields for an entity that can be used as aggregation targets (numeric) */
export function getAggregatableFields(entity: EntitySource): EntityFieldMeta[] {
  return ENTITY_FIELD_MAP[entity].filter((f) => f.aggregatable);
}

/** Get fields for an entity that can be used as group-by targets */
export function getGroupableFields(entity: EntitySource): EntityFieldMeta[] {
  return ENTITY_FIELD_MAP[entity].filter((f) => f.groupable);
}

/** Get fields for an entity that can be used as filter targets */
export function getFilterableFields(entity: EntitySource): EntityFieldMeta[] {
  return ENTITY_FIELD_MAP[entity].filter((f) => f.filterable);
}

/** Validate that a field name exists for the given entity */
export function isValidField(entity: EntitySource, fieldKey: string): boolean {
  return ENTITY_FIELD_MAP[entity].some((f) => f.key === fieldKey);
}

/** Get field metadata by key */
export function getFieldMeta(entity: EntitySource, fieldKey: string): EntityFieldMeta | undefined {
  return ENTITY_FIELD_MAP[entity].find((f) => f.key === fieldKey);
}
