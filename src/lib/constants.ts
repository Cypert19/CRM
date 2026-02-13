export const APP_NAME = "Nexus AI";
export const APP_DESCRIPTION = "AI-Powered Sales Intelligence Platform";

export const DEFAULT_CURRENCY = "USD";
export const DEFAULT_TIMEZONE = "America/New_York";

export const SIDEBAR_WIDTH = 260;
export const SIDEBAR_COLLAPSED_WIDTH = 72;

export const DEAL_PRIORITIES = ["Low", "Medium", "High", "Critical"] as const;
export type DealPriority = (typeof DEAL_PRIORITIES)[number];

export const DEAL_SOURCES = [
  "Inbound",
  "Outbound",
  "Referral",
  "Partner",
  "Event",
  "Website",
  "LinkedIn",
  "Cold Outreach",
  "Conference",
  "Other",
] as const;
export type DealSource = (typeof DEAL_SOURCES)[number];

export const DEAL_PAYMENT_TYPES = ["one_time", "retainer"] as const;
export type DealPaymentType = (typeof DEAL_PAYMENT_TYPES)[number];

export const DEAL_PAYMENT_TYPE_LABELS: Record<string, string> = {
  one_time: "One-Time",
  retainer: "Retainer",
};

export const DEAL_PAYMENT_FREQUENCIES = ["weekly", "biweekly", "monthly", "quarterly", "annually"] as const;
export type DealPaymentFrequency = (typeof DEAL_PAYMENT_FREQUENCIES)[number];

export const DEAL_PAYMENT_FREQUENCY_LABELS: Record<string, string> = {
  weekly: "Weekly",
  biweekly: "Bi-Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  annually: "Annually",
};

export const DEAL_INDUSTRIES = [
  "technology",
  "healthcare",
  "finance",
  "manufacturing",
  "retail",
  "education",
  "consulting",
  "real_estate",
  "other",
] as const;
export type DealIndustry = (typeof DEAL_INDUSTRIES)[number];

export const DEAL_INDUSTRY_LABELS: Record<string, string> = {
  technology: "Technology",
  healthcare: "Healthcare",
  finance: "Finance",
  manufacturing: "Manufacturing",
  retail: "Retail",
  education: "Education",
  consulting: "Consulting",
  real_estate: "Real Estate",
  other: "Other",
};

export const DEAL_COMPANY_SIZES = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1000+",
] as const;
export type DealCompanySize = (typeof DEAL_COMPANY_SIZES)[number];

export const DEAL_EVENT_TYPES = [
  "meeting",
  "call",
  "demo",
  "follow_up",
  "deadline",
  "other",
] as const;
export type DealEventType = (typeof DEAL_EVENT_TYPES)[number];

export const DEAL_EVENT_TYPE_LABELS: Record<string, string> = {
  meeting: "Meeting",
  call: "Call",
  demo: "Demo",
  follow_up: "Follow-Up",
  deadline: "Deadline",
  other: "Other",
};

export const LIFECYCLE_STAGES = [
  "Lead",
  "Marketing Qualified",
  "Sales Qualified",
  "Opportunity",
  "Customer",
  "Evangelist",
  "Other",
] as const;
export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number];

export const TASK_STATUSES = ["To Do", "In Progress", "Done", "Cancelled"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_TYPES = [
  "Call",
  "Email",
  "Meeting",
  "Follow-Up",
  "Demo",
  "Proposal",
  "Automations",
  "Website Development",
  "Custom Development",
  "Training",
  "Consulting",
  "Other",
] as const;
export type TaskType = (typeof TASK_TYPES)[number];

export const TASK_CATEGORIES = ["deal", "personal", "workshop", "other"] as const;
export type TaskCategory = (typeof TASK_CATEGORIES)[number];

export const USER_ROLES = ["Admin", "Manager", "Member"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const CONTACT_ROLES = [
  "Decision Maker",
  "Champion",
  "Influencer",
  "Blocker",
  "End User",
] as const;
export type ContactRole = (typeof CONTACT_ROLES)[number];

export const CUSTOM_FIELD_TYPES = [
  "Text",
  "Long Text",
  "Number",
  "Currency",
  "Date",
  "DateTime",
  "Single Select",
  "Multi Select",
  "Checkbox",
  "URL",
  "Email",
  "Phone",
  "User",
  "Rating",
] as const;
export type CustomFieldType = (typeof CUSTOM_FIELD_TYPES)[number];

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_WORKSPACE_STORAGE = 10 * 1024 * 1024 * 1024; // 10GB

export const AI_MAX_REQUESTS_PER_DAY = 100;

export const NAV_ITEMS = [
  { icon: "LayoutDashboard", label: "Dashboard", href: "/dashboard" },
  { icon: "Target", label: "Deals", href: "/deals" },
  { icon: "Users", label: "Contacts", href: "/contacts" },
  { icon: "Building2", label: "Companies", href: "/companies" },
  { icon: "CheckSquare", label: "Tasks", href: "/tasks" },
  { icon: "FileText", label: "Notes", href: "/notes" },
  { icon: "FolderOpen", label: "Files", href: "/files" },
  { icon: "BarChart3", label: "Reports", href: "/reports" },
  { icon: "Sparkles", label: "AI Assistant", href: "/ai" },
  { icon: "Settings", label: "Settings", href: "/settings" },
] as const;
