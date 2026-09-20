// Turns the raw questionnaire `state` JSON (identical shape to the client-side
// app's in-memory state) into a flat list of generic, renderable Blocks.
// This is deliberately schema-agnostic: it walks whatever the client saved
// rather than hand-mapping every one of the ~90 questionnaire fields, so it
// stays correct even if fields are added to the questionnaire later.

export type Block =
  | { type: "h1"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "kv"; items: { label: string; value: string }[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "spacer" }
  | { type: "pagebreak" };

export type Cover = {
  title: string;
  subtitle: string;
  company: string;
  respondentName: string;
  respondentPosition: string;
  submissionRef: string;
  submissionDate: string;
};

export type ContentModel = { cover: Cover; blocks: Block[] };

const SKIP_KEYS = new Set([
  "currentStep",
  "sectionComments",
  "submitted",
  "submissionRef",
  "submissionDate",
]);

const PLAN_SUBSECTIONS: { key: string; title: string }[] = [
  { key: "eligibility", title: "Eligibility & Core HR" },
  { key: "calculation", title: "Calculation & Guidelines" },
  { key: "performance", title: "Performance" },
  { key: "compaRatio", title: "Compa-Ratio" },
  { key: "budget", title: "Budget" },
  { key: "approvals", title: "Approvals" },
  { key: "payroll", title: "Payroll & Salary Integration" },
  { key: "generationPayment", title: "Generation & Payment" },
  { key: "proration", title: "Proration" },
  { key: "managerWorksheetCfg", title: "Manager Worksheet" },
  { key: "payrollAuto", title: "Payroll Automation" },
  { key: "individualComp", title: "Individual Compensation Details" },
  { key: "employeeComm", title: "Employee Communication" },
];

function humanize(key: string): string {
  const withSpaces = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
  return withSpaces
    .replace(/\bId\b/g, "ID")
    .replace(/\bHr\b/g, "HR")
    .replace(/\bPct\b/g, "%");
}

function isEmpty(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === "string") return v.trim() === "";
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === "object") return Object.keys(v as object).length === 0;
  return false;
}

function formatPrimitive(v: unknown): string {
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}

/** A file-upload field the client's fileImportField() control stores as {name, dataUrl}. */
function isFileRef(v: unknown): v is { name: string } {
  return (
    typeof v === "object" &&
    v !== null &&
    "name" in (v as Record<string, unknown>) &&
    "dataUrl" in (v as Record<string, unknown>)
  );
}

function isRowArray(v: unknown): v is Record<string, unknown>[] {
  return (
    Array.isArray(v) &&
    v.length > 0 &&
    v.every((r) => typeof r === "object" && r !== null && !Array.isArray(r) && !isFileRef(r))
  );
}

/** Renders an array of similarly-shaped row objects (matrix rows, guideline rows, approval levels…) as a table. */
function rowsToTable(rows: Record<string, unknown>[]): Block {
  const keys: string[] = [];
  rows.forEach((r) =>
    Object.keys(r).forEach((k) => {
      if (!keys.includes(k)) keys.push(k);
    })
  );
  const headers = keys.map(humanize);
  const tableRows = rows.map((r) =>
    keys.map((k) => (isEmpty(r[k]) ? "" : formatPrimitive(r[k])))
  );
  return { type: "table", headers, rows: tableRows };
}

/** Renders a flat-ish object as a key/value block, recursing for nested objects/row-arrays. */
function objectToBlocks(obj: Record<string, unknown>, skipKeys: Set<string> = new Set()): Block[] {
  const blocks: Block[] = [];
  const kvItems: { label: string; value: string }[] = [];

  for (const [key, value] of Object.entries(obj)) {
    if (skipKeys.has(key) || key.endsWith("Other") || isEmpty(value)) continue;

    if (isFileRef(value)) {
      kvItems.push({ label: humanize(key), value: `Uploaded file: ${value.name}` });
    } else if (isRowArray(value)) {
      if (kvItems.length) {
        blocks.push({ type: "kv", items: [...kvItems] });
        kvItems.length = 0;
      }
      blocks.push({ type: "h3", text: humanize(key) });
      blocks.push(rowsToTable(value));
    } else if (Array.isArray(value)) {
      kvItems.push({ label: humanize(key), value: value.map(formatPrimitive).join(", ") });
    } else if (typeof value === "object") {
      const nested = objectToBlocks(value as Record<string, unknown>, skipKeys);
      if (nested.length) {
        if (kvItems.length) {
          blocks.push({ type: "kv", items: [...kvItems] });
          kvItems.length = 0;
        }
        blocks.push({ type: "h3", text: humanize(key) });
        blocks.push(...nested);
      }
    } else {
      let v = formatPrimitive(value);
      const otherKey = `${key}Other`;
      if (value === "Other" && typeof obj[otherKey] === "string" && obj[otherKey]) {
        v = `Other — ${obj[otherKey]}`;
      }
      kvItems.push({ label: humanize(key), value: v });
    }
  }
  if (kvItems.length) blocks.push({ type: "kv", items: kvItems });
  return blocks;
}

function planLabel(p: Record<string, unknown>, idx: number): string {
  const name = (p.name as string) || `Plan ${idx + 1}`;
  const id = (p.id as string) || "";
  const cls = (p.moduleClass as string) || "Not Yet Confirmed";
  return id ? `${name} (${id}) — ${cls}` : `${name} — ${cls}`;
}

export function buildContentModel(state: Record<string, unknown>): ContentModel {
  const blocks: Block[] = [];
  const respondent = (state.respondent as Record<string, unknown>) || {};

  const cover: Cover = {
    title: "Workforce Compensation — Requirements Questionnaire",
    subtitle: "Oracle Fusion HCM Cloud Implementation",
    company: String(respondent.company || ""),
    respondentName: String(respondent.name || ""),
    respondentPosition: String(respondent.position || ""),
    submissionRef: state.submissionRef ? String(state.submissionRef) : "",
    submissionDate: state.submissionDate ? String(state.submissionDate) : "",
  };

  // Respondent
  if (!isEmpty(state.respondent)) {
    blocks.push({ type: "h2", text: "Respondent Information" });
    blocks.push(...objectToBlocks(state.respondent as Record<string, unknown>));
    blocks.push({ type: "spacer" });
  }

  // Plan register — a short identity table (full config flags move to each
  // plan's own page below, rather than crowding 13 columns onto one row).
  const plans = (state.plans as Record<string, unknown>[]) || [];
  const PLAN_FLAG_KEYS = [
    "performanceLinked",
    "compaRatioLinked",
    "budgetRequired",
    "approvalRequired",
    "salaryUpdate",
    "payrollImpact",
    "prorationRequired",
    "managerWorksheetReq",
  ];
  if (plans.length) {
    blocks.push({ type: "h2", text: "Compensation Plan Register" });
    const summaryKeys = ["id", "name", "moduleClass", "compensationType", "frequency"].filter((k) =>
      plans.some((p) => !isEmpty(p[k]))
    );
    if (summaryKeys.length) {
      blocks.push({
        type: "table",
        headers: summaryKeys.map(humanize),
        rows: plans.map((p) => summaryKeys.map((k) => (isEmpty(p[k]) ? "" : formatPrimitive(p[k])))),
      });
    }
    blocks.push({ type: "spacer" });
  }

  // Calendar & scheduling
  const calendarKeys = ["calendars", "calendarApproach", "calendarOverride", "calendarReopen", "calendarExceptions"];
  const calendarObj: Record<string, unknown> = {};
  calendarKeys.forEach((k) => {
    if (!isEmpty(state[k])) calendarObj[k] = state[k];
  });
  if (Object.keys(calendarObj).length) {
    blocks.push({ type: "h2", text: "Calendar & Scheduling" });
    blocks.push(...objectToBlocks(calendarObj));
    blocks.push({ type: "spacer" });
  }

  // Shared requirements
  if (!isEmpty(state.shared)) {
    blocks.push({ type: "h2", text: "Shared Requirements" });
    blocks.push(...objectToBlocks(state.shared as Record<string, unknown>));
    blocks.push({ type: "spacer" });
  }

  // Per-plan detail — each plan starts on its own page
  if (plans.length) {
    blocks.push({ type: "pagebreak" });
    blocks.push({ type: "h1", text: "Plan-Specific Detail" });
    let first = true;
    plans.forEach((p, idx) => {
      const sectionBlocks: Block[] = [];

      const flagItems = PLAN_FLAG_KEYS.filter((k) => !isEmpty(p[k])).map((k) => ({
        label: humanize(k),
        value: formatPrimitive(p[k]),
      }));
      if (flagItems.length) {
        sectionBlocks.push({ type: "h3", text: "Plan Configuration" });
        sectionBlocks.push({ type: "kv", items: flagItems });
      }

      PLAN_SUBSECTIONS.forEach(({ key, title }) => {
        const sub = p[key];
        if (isEmpty(sub)) return;
        const cleaned = objectToBlocks(sub as Record<string, unknown>, new Set(["useCommon"]));
        if (cleaned.length) {
          sectionBlocks.push({ type: "h3", text: title });
          sectionBlocks.push(...cleaned);
        }
      });
      if (sectionBlocks.length) {
        if (!first) blocks.push({ type: "pagebreak" });
        first = false;
        blocks.push({ type: "h2", text: planLabel(p, idx) });
        blocks.push(...sectionBlocks);
        blocks.push({ type: "spacer" });
      }
    });
  }

  // Final processing, security, reporting, communication, other
  const wrapUp: [string, string][] = [
    ["finalProcessingCommon", "Final Processing"],
    ["finalProcessingPlans", "Final Processing — Plan Overrides"],
    ["security", "Security"],
    ["reportingCommon", "Reporting"],
    ["reportingPlans", "Reporting — Plan Overrides"],
    ["communication", "Communication"],
    ["communicationPlans", "Communication — Plan Overrides"],
  ];
  const wrapUpBlocks: Block[] = [];
  wrapUp.forEach(([key, title]) => {
    const value = state[key];
    if (isEmpty(value)) return;
    wrapUpBlocks.push({ type: "h2", text: title });
    if (isRowArray(value)) {
      wrapUpBlocks.push(rowsToTable(value as Record<string, unknown>[]));
    } else if (Array.isArray(value)) {
      wrapUpBlocks.push({ type: "p", text: value.map(formatPrimitive).join(", ") });
    } else {
      wrapUpBlocks.push(...objectToBlocks(value as Record<string, unknown>));
    }
    wrapUpBlocks.push({ type: "spacer" });
  });
  if (wrapUpBlocks.length) {
    blocks.push({ type: "pagebreak" });
    blocks.push({ type: "h1", text: "Final Processing, Security & Reporting" });
    blocks.push(...wrapUpBlocks);
  }

  if (!isEmpty(state.otherRequirements) || (state.otherText as string)) {
    blocks.push({ type: "h2", text: "Other Requirements" });
    if (state.otherText) blocks.push({ type: "p", text: String(state.otherText) });
    if (isRowArray(state.otherRequirements)) {
      blocks.push(rowsToTable(state.otherRequirements as Record<string, unknown>[]));
    }
    blocks.push({ type: "spacer" });
  }

  // Section-level free-text comments captured throughout the wizard
  const comments = state.sectionComments as Record<string, string> | undefined;
  if (comments && Object.values(comments).some((v) => v && v.trim())) {
    blocks.push({ type: "h2", text: "Additional Comments" });
    Object.entries(comments).forEach(([section, text]) => {
      if (text && text.trim()) {
        blocks.push({ type: "h3", text: humanize(section) });
        blocks.push({ type: "p", text });
      }
    });
  }

  return { cover, blocks };
}

export { SKIP_KEYS };
