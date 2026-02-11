import type Anthropic from "@anthropic-ai/sdk";

export const AI_TOOLS: Anthropic.Tool[] = [
  {
    name: "search_deals",
    description:
      "Search for deals in the pipeline. Can filter by stage, value range, owner, or search by title.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Search query for deal title",
        },
        stage_name: {
          type: "string",
          description: "Filter by stage name (e.g., 'Qualified', 'Proposal')",
        },
        min_value: {
          type: "number",
          description: "Minimum deal value",
        },
        max_value: {
          type: "number",
          description: "Maximum deal value",
        },
      },
    },
  },
  {
    name: "get_pipeline_stats",
    description:
      "Get pipeline statistics including total value, deal counts per stage, win rate, and average cycle time.",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "search_contacts",
    description: "Search for contacts by name, email, company, or job title.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Search query",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_recent_activities",
    description: "Get recent activities and changes in the workspace.",
    input_schema: {
      type: "object" as const,
      properties: {
        limit: {
          type: "number",
          description: "Number of activities to return (default 20)",
        },
      },
    },
  },
];
