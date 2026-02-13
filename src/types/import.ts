// ─── Import Feature Types ────────────────────────────────────────────────────

export type ImportPhase = "upload" | "parsing" | "review" | "importing" | "complete";

// ─── Parsed Entity Types (from AI) ──────────────────────────────────────────

export type ParsedCompany = {
  _tempId: string;
  company_name: string;
  domain?: string | null;
  industry?: string | null;
  employee_count_range?: string | null;
  annual_revenue_range?: string | null;
  phone?: string | null;
  website?: string | null;
  description?: string | null;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  } | null;
  tags?: string[];
};

export type ParsedContact = {
  _tempId: string;
  _companyTempId?: string | null;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  job_title?: string | null;
  lifecycle_stage?: string | null;
  source?: string | null;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  } | null;
  social_profiles?: {
    linkedin?: string;
    twitter?: string;
  };
  tags?: string[];
};

export type ParsedDeal = {
  _tempId: string;
  _contactTempId?: string | null;
  _companyTempId?: string | null;
  _stageName?: string | null; // Original stage name from import, to be mapped
  title: string;
  value?: number;
  currency?: string;
  stage_id?: string | null; // Resolved after stage mapping
  pipeline_id?: string | null;
  contact_id?: string | null;
  company_id?: string | null;
  expected_close_date?: string | null;
  probability?: number | null;
  priority?: string | null;
  source?: string | null;
  description?: string | null;
  tags?: string[];
};

export type ParsedNote = {
  _tempId: string;
  _dealTempId?: string | null;
  _contactTempId?: string | null;
  _companyTempId?: string | null;
  title?: string | null;
  plain_text: string;
  tags?: string[];
};

export type ParsedTask = {
  _tempId: string;
  _dealTempId?: string | null;
  _contactTempId?: string | null;
  title: string;
  status?: string;
  priority?: string;
  task_type?: string;
  due_date?: string | null;
  notes?: string | null;
  category?: string | null;
  tags?: string[];
};

// ─── Import Entity Wrapper (for review UI) ──────────────────────────────────

export type ImportEntityStatus = "ok" | "warning" | "error";

export type ImportEntity<T> = T & {
  _included: boolean;
  _status: ImportEntityStatus;
  _errors: string[];
  _warnings: string[];
};

// ─── Parsed Import Data (AI response) ───────────────────────────────────────

export type ParsedImportData = {
  companies: ImportEntity<ParsedCompany>[];
  contacts: ImportEntity<ParsedContact>[];
  deals: ImportEntity<ParsedDeal>[];
  notes: ImportEntity<ParsedNote>[];
  tasks: ImportEntity<ParsedTask>[];
  stageMappings: Record<string, string | null>; // stageName → stageId or null
  warnings: string[];
  summary: string;
};

// Raw AI response (before wrapping with ImportEntity)
export type RawAIParseResponse = {
  companies: ParsedCompany[];
  contacts: ParsedContact[];
  deals: ParsedDeal[];
  notes: ParsedNote[];
  tasks: ParsedTask[];
  stageMappings: Record<string, string | null>;
  warnings: string[];
  summary: string;
};

// ─── Import Payload (sent to server action) ─────────────────────────────────

export type ImportPayload = {
  companies: (ParsedCompany & { _tempId: string })[];
  contacts: (ParsedContact & { _tempId: string })[];
  deals: (ParsedDeal & { _tempId: string })[];
  notes: (ParsedNote & { _tempId: string })[];
  tasks: (ParsedTask & { _tempId: string })[];
};

// ─── Import Result ──────────────────────────────────────────────────────────

export type EntityImportCount = {
  success: number;
  failed: number;
};

export type ImportError = {
  entityType: string;
  tempId: string;
  error: string;
};

export type ImportResult = {
  counts: {
    companies: EntityImportCount;
    contacts: EntityImportCount;
    deals: EntityImportCount;
    notes: EntityImportCount;
    tasks: EntityImportCount;
  };
  errors: ImportError[];
  totalCreated: number;
  totalFailed: number;
};

// ─── Duplicate Detection ────────────────────────────────────────────────────

export type DuplicateMatch = {
  tempId: string;
  existingId: string;
  existingName: string;
  matchField: string; // e.g., "email", "company_name"
};

export type DuplicateReport = {
  contacts: DuplicateMatch[];
  companies: DuplicateMatch[];
};

// ─── Stage Mapping ──────────────────────────────────────────────────────────

export type PipelineStageOption = {
  id: string;
  name: string;
  pipeline_id: string;
  pipeline_name: string;
};
