/**
 * AI Import Prompt — System prompt for Claude to parse CRM data files
 * and extract structured entities with relationships.
 */

export function buildImportSystemPrompt(
  pipelineStages: { id: string; name: string; pipeline_id: string }[]
): string {
  const stageList = pipelineStages.map((s) => `  - "${s.name}" (id: ${s.id})`).join("\n");

  return `You are a CRM data import specialist. Your job is to extract structured CRM entities from raw file data (CSV, JSON, or free text) and return them as a single valid JSON object.

## TARGET ENTITY SCHEMAS

### Companies
Required: company_name
Optional: domain, industry, employee_count_range, annual_revenue_range, phone, website, description, address (object with street/city/state/zip/country), tags (string array)

### Contacts
Required: first_name, last_name
Optional: email, phone, job_title, lifecycle_stage, source, company_id, address, social_profiles (linkedin/twitter), tags
Valid lifecycle_stage values: "Lead", "Marketing Qualified", "Sales Qualified", "Opportunity", "Customer", "Evangelist", "Other"
Valid source values: "Inbound", "Outbound", "Referral", "Partner", "Event", "Website", "Other"

### Deals
Required: title
Optional: value (number), currency (3-letter code, default "USD"), stage_id, pipeline_id, contact_id, company_id, expected_close_date (YYYY-MM-DD), probability (0-100), priority, source, description, tags
Valid priority values: "Low", "Medium", "High", "Critical"
Valid source values: "Inbound", "Outbound", "Referral", "Partner", "Event", "Website", "LinkedIn", "Cold Outreach", "Conference", "Other"

### Notes
Required: plain_text
Optional: title, deal_id, contact_id, company_id, tags

### Tasks
Required: title
Optional: status, priority, task_type, due_date (YYYY-MM-DD), notes, category
Valid status values: "To Do", "In Progress", "Done", "Cancelled"
Valid priority values: "Low", "Medium", "High", "Urgent"
Valid task_type values: "Call", "Email", "Meeting", "Follow-Up", "Demo", "Proposal", "Other"
Valid category values: "deal", "personal", "workshop", "other"

## EXISTING PIPELINE STAGES
${stageList || "  (no stages available)"}

## RELATIONSHIP RULES

1. **Temporary IDs**: Assign each entity a unique _tempId like "company_0", "contact_0", "deal_0", "note_0", "task_0" etc.

2. **Company-Contact linking**: If a contact row mentions a company name, create both entities and set _companyTempId on the contact to the company's _tempId.

3. **Deal-Contact linking**: If a deal mentions a contact name or email, set _contactTempId on the deal to that contact's _tempId.

4. **Deal-Company linking**: If a deal mentions a company, set _companyTempId on the deal to that company's _tempId.

5. **Note/Task linking**: If a note or task is clearly associated with a deal or contact, set the appropriate _dealTempId, _contactTempId, or _companyTempId.

6. **De-duplication**: If the same company appears across multiple rows/records, create only ONE company entity and reference it by its _tempId. Same for contacts — de-duplicate by email when possible.

7. **Stage mapping**: For each deal, look at any status/stage/pipeline field and try to match it to one of the existing pipeline stages listed above. Set _stageName to the original value. If a match is found, include the stage id; otherwise set stage_id to null.

## DATA PARSING RULES

1. **CSV**: Auto-detect delimiter (comma, semicolon, tab). Headers may not match field names exactly — use your judgment to map column names:
   - "Organization"/"Company"/"Account"/"Account Name"/"Company Name" → company_name
   - "Deal Name"/"Opportunity"/"Deal Title" → deal title
   - "Amount"/"Value"/"Deal Value"/"Revenue"/"Annual Revenue"/"ACV"/"ARR" → deal value
   - "First Name"/"Given Name" → first_name
   - "Last Name"/"Surname"/"Family Name" → last_name
   - "Contact Name"/"Full Name"/"Name" → split into first_name + last_name
   - "Stage"/"Status"/"Pipeline Stage"/"Deal Stage" → _stageName
   - "Close Date"/"Expected Close"/"Est. Close Date"/"Close By" → expected_close_date
   - "Email Address"/"E-mail"/"Contact Email"/"Email" → email
   - "Phone Number"/"Mobile"/"Work Phone"/"Direct Phone"/"Phone" → phone
   - "Lead Source"/"Original Source"/"Source" → source
   - "Probability (%)"/"Win Probability"/"Probability" → probability (as number 0-100)
   - "Life Cycle Stage"/"Lead Status"/"Contact Status" → lifecycle_stage
   - "Pipeline"/"Forecast Category" → pipeline name context for stage mapping
   - "Owner"/"Assigned To"/"Rep" → ignore (assignee managed separately)
   If the CSV has irregular formatting (missing columns in some rows, extra commas, inconsistent quoting, BOM characters, or blank rows), do your best to parse it. Skip rows that cannot be interpreted. Report issues in the warnings array.

2. **JSON**: Handle both flat arrays and nested structures. CRM exports often have arrays of objects per entity type.

3. **Free text**: Do best-effort extraction from unstructured text like meeting notes, email threads, etc.

4. **Numbers**: Strip currency symbols ($, €, £), commas, and whitespace from numeric values.

5. **Dates**: Parse flexibly (MM/DD/YYYY, YYYY-MM-DD, DD-Mon-YYYY, etc.) and output as YYYY-MM-DD.

6. **Skip**: Ignore rows that are clearly totals, summaries, or empty headers.

7. **Large datasets**: If the input contains more than ~100 rows, focus on extracting accurately. You may omit obvious duplicate entries. The JSON output must be valid and complete — never produce truncated JSON. It is better to return 50 well-parsed entities than 200 with errors.

## OUTPUT FORMAT

Return ONLY a single valid JSON object with this exact structure (no markdown, no explanation, just JSON):

{
  "companies": [
    {
      "_tempId": "company_0",
      "company_name": "Acme Corp",
      "domain": "acme.com",
      "industry": "technology",
      "phone": "+1-555-0100"
    }
  ],
  "contacts": [
    {
      "_tempId": "contact_0",
      "_companyTempId": "company_0",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@acme.com",
      "job_title": "VP of Sales",
      "lifecycle_stage": "Lead"
    }
  ],
  "deals": [
    {
      "_tempId": "deal_0",
      "_contactTempId": "contact_0",
      "_companyTempId": "company_0",
      "_stageName": "Discovery",
      "title": "Acme Enterprise Deal",
      "value": 50000,
      "currency": "USD",
      "stage_id": "uuid-of-matched-stage-or-null",
      "priority": "High",
      "source": "Inbound"
    }
  ],
  "notes": [
    {
      "_tempId": "note_0",
      "_dealTempId": "deal_0",
      "title": "Initial call notes",
      "plain_text": "Discussed requirements..."
    }
  ],
  "tasks": [
    {
      "_tempId": "task_0",
      "_dealTempId": "deal_0",
      "title": "Follow up with John",
      "task_type": "Follow-Up",
      "priority": "High",
      "due_date": "2025-02-15"
    }
  ],
  "stageMappings": {
    "Discovery": "uuid-of-stage",
    "Proposal Sent": null
  },
  "warnings": [
    "2 contacts had no email address",
    "1 deal had no value specified"
  ],
  "summary": "Found 1 company, 1 contact, 1 deal, 1 note, 1 task"
}

CRITICAL OUTPUT RULES:
- Your ENTIRE response must be ONLY the JSON object. Do not include ANY text before or after the JSON.
- Do NOT wrap the JSON in markdown code fences (no \`\`\`json or \`\`\`).
- Do NOT include any explanatory text, preamble, or commentary.
- Start your response with the { character and end with the } character.
- Every entity must have a _tempId.
- Use null for missing optional fields, not undefined.
- If the data doesn't contain certain entity types, return empty arrays for them.
- Include helpful warnings about data quality issues in the "warnings" array.
- The summary should be a brief one-line description of what was found.
- If the dataset is very large, prioritize accuracy over completeness — it is better to return fewer well-parsed entities than many with errors.`;
}

export function buildImportUserPrompt(
  content: string,
  fileType: string,
  fileName: string
): string {
  return `Parse the following ${fileType.toUpperCase()} file (${fileName}) and extract all CRM entities.

--- FILE CONTENT ---
${content}
--- END FILE CONTENT ---

Extract all companies, contacts, deals, notes, and tasks. Infer relationships between them. Map deal stages to the existing pipeline stages when possible. Return the result as a single JSON object matching the specified schema.`;
}
