export type ActionResponse<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type PaginationParams = {
  page: number;
  pageSize: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type SortConfig = {
  column: string;
  direction: "asc" | "desc";
};

export type FilterCondition = {
  field: string;
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "like" | "ilike" | "in" | "is";
  value: string | number | boolean | string[] | null;
};

export type FilterGroup = {
  logic: "AND" | "OR";
  conditions: (FilterCondition | FilterGroup)[];
};

export type ViewMode = "kanban" | "table" | "list" | "grid";

export type EntityType = "Deal" | "Contact" | "Company" | "Note" | "Task" | "File" | "DealEvent";
