import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { DashboardFeature, FeatureDefinition, FeatureStatus } from "@/lib/types";

interface McpTextContent {
  type: "text";
  text: string;
}

interface McpToolResult {
  content?: McpTextContent[];
  isError?: boolean;
}

interface MeegoStatusResult {
  title?: string;
  description?: string;
  team?: string;
  owner?: string;
  dueDate?: string;
  tasks?: FeatureDefinition["tasks"];
  status: FeatureStatus;
  meegoState: string | null;
  meegoUrl: string | null;
  lastSyncedAt: string | null;
  isLive: boolean;
}

const LAUNCHED_STATES = new Set(["CLOSED", "DONE", "RESOLVED", "RELEASED", "LAUNCHED"]);
const IN_PROGRESS_STATES = new Set([
  "IN_PROGRESS",
  "INPROGRESS",
  "进行中",
  "开发中",
  "处理中",
  "评估中",
  "DOING",
  "DEVELOPING",
  "TESTING",
  "REVIEW",
  "REVIEWING",
  "VERIFYING",
]);
const AT_RISK_STATES = new Set(["BLOCKED", "RISK", "AT_RISK", "ON_HOLD", "DELAYED"]);
const PLANNED_STATES = new Set([
  "OPEN",
  "TODO",
  "BACKLOG",
  "PLANNED",
  "INIT",
  "待评估&排优",
  "待开始",
  "待排期",
]);

function getEnv() {
  return {
    url: process.env.MEEGO_MCP_URL ?? "https://meego.larkoffice.com/mcp_server/v1",
    token: process.env.MEEGO_MCP_TOKEN,
    projectKey: process.env.MEEGO_PROJECT_KEY,
  };
}

function mapStateToStatus(rawState: string | undefined, fallback: FeatureStatus): FeatureStatus {
  if (!rawState) {
    return fallback;
  }

  const normalized = rawState.trim().toUpperCase().replace(/\s+/g, "_");

  if (LAUNCHED_STATES.has(normalized)) {
    return "launched";
  }

  if (AT_RISK_STATES.has(normalized)) {
    return "at_risk";
  }

  if (IN_PROGRESS_STATES.has(normalized)) {
    return "in_progress";
  }

  if (PLANNED_STATES.has(normalized)) {
    return "planned";
  }

  return fallback;
}

function getTextBlocks(result: McpToolResult): string[] {
  return (result.content ?? [])
    .filter((item): item is McpTextContent => item.type === "text")
    .map((item) => item.text);
}

function parseFirstJsonBlock(blocks: string[]): Record<string, unknown> | null {
  for (const block of blocks) {
    const trimmed = block.trim();

    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
      continue;
    }

    try {
      const parsed = JSON.parse(trimmed) as unknown;

      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function extractString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractMarkdownTableValue(markdown: string, key: string): string | null {
  const pattern = new RegExp(`\\|\\s*${escapeRegExp(key)}\\s*\\|\\s*(.*?)\\s*\\|`);
  const match = markdown.match(pattern);
  return match?.[1]?.trim() ?? null;
}

function extractDisplayName(value: string): string {
  return value.split("(")[0]?.trim() || value.trim();
}

function parseOwnerFromRoles(rawRoles: string | null): string | null {
  if (!rawRoles) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawRoles) as Array<Record<string, string>>;
    const pmRole = parsed.find((entry) => typeof entry.PM === "string");
    const pmValue = pmRole?.PM;

    if (pmValue && pmValue !== "未填写") {
      return extractDisplayName(pmValue);
    }
  } catch {
    return null;
  }

  return null;
}

function parseTeamFromProject(rawProject: string | null): string | null {
  if (!rawProject) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawProject) as { name?: string };
    return extractString(parsed.name);
  } catch {
    return null;
  }
}

function parseInProgressTasks(markdown: string): FeatureDefinition["tasks"] {
  const marker = "# 进行中的节点";
  const start = markdown.indexOf(marker);

  if (start === -1) {
    return [];
  }

  const section = markdown.slice(start + marker.length).trim();
  const lines = section.split("\n").map((line) => line.trim());
  const taskNames: string[] = [];

  for (const line of lines) {
    if (!line.startsWith("|") || line.includes("---") || line.includes("节点 ID")) {
      continue;
    }

    const parts = line.split("|").map((part) => part.trim());
    const nodeName = parts[2];

    if (nodeName) {
      taskNames.push(nodeName);
    }
  }

  return taskNames.map((label, index) => ({
    id: `${label}-${index}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    label,
    done: false,
  }));
}

function findStatusInMarkdown(markdown: string, fallback: FeatureDefinition): MeegoStatusResult {
  const title = extractMarkdownTableValue(markdown, "工作项名称") ?? fallback.title;
  const meegoState = extractMarkdownTableValue(markdown, "工作项状态");
  const rawProject = extractMarkdownTableValue(markdown, "所属空间");
  const rawRoles = extractMarkdownTableValue(markdown, "角色成员");
  const updatedAt =
    extractMarkdownTableValue(markdown, "更新时间") ??
    extractMarkdownTableValue(markdown, "创建时间") ??
    fallback.dueDate;
  const tasks = parseInProgressTasks(markdown);

  return {
    title,
    description: fallback.description,
    team: parseTeamFromProject(rawProject) ?? fallback.team,
    owner: parseOwnerFromRoles(rawRoles) ?? fallback.owner,
    dueDate: updatedAt,
    tasks: tasks.length > 0 ? tasks : fallback.tasks,
    status: mapStateToStatus(meegoState ?? undefined, fallback.defaultStatus),
    meegoState,
    meegoUrl: fallback.meegoUrl ?? null,
    lastSyncedAt: new Date().toISOString(),
    isLive: true,
  };
}

function findStatusInObject(
  payload: Record<string, unknown>,
  fallback: FeatureDefinition,
): MeegoStatusResult {
  const directCandidates = [
    payload.work_item_status,
    payload.status,
    payload.state,
    payload.state_key,
  ];

  for (const candidate of directCandidates) {
    const meegoState = extractString(candidate);

    if (meegoState) {
      return {
        title: fallback.title,
        description: fallback.description,
        team: fallback.team,
        owner: fallback.owner,
        dueDate: fallback.dueDate,
        tasks: fallback.tasks,
        status: mapStateToStatus(meegoState, fallback.defaultStatus),
        meegoState,
        meegoUrl: fallback.meegoUrl ?? null,
        lastSyncedAt: new Date().toISOString(),
        isLive: true,
      };
    }
  }

  const fields = payload.fields;

  if (Array.isArray(fields)) {
    for (const field of fields) {
      if (!field || typeof field !== "object") {
        continue;
      }

      const candidate = field as Record<string, unknown>;
      const alias = extractString(candidate.field_alias) ?? extractString(candidate.field_key);

      if (alias !== "work_item_status") {
        continue;
      }

      const meegoState = extractString(candidate.field_value) ?? extractString(candidate.state_key);

      if (meegoState) {
        return {
          title: fallback.title,
          description: fallback.description,
          team: fallback.team,
          owner: fallback.owner,
          dueDate: fallback.dueDate,
          tasks: fallback.tasks,
          status: mapStateToStatus(meegoState, fallback.defaultStatus),
          meegoState,
          meegoUrl: fallback.meegoUrl ?? null,
          lastSyncedAt: new Date().toISOString(),
          isLive: true,
        };
      }
    }
  }

  return fallbackStatus(fallback);
}

function fallbackStatus(feature: FeatureDefinition, override?: string | null): MeegoStatusResult {
  return {
    title: feature.title,
    description: feature.description,
    team: feature.team,
    owner: feature.owner,
    dueDate: feature.dueDate,
    tasks: feature.tasks,
    status: feature.defaultStatus,
    meegoState: override ?? null,
    meegoUrl: feature.meegoUrl ?? null,
    lastSyncedAt: null,
    isLive: false,
  };
}

async function createMcpClient() {
  const { url, token } = getEnv();

  if (!token) {
    return null;
  }

  const client = new Client({ name: "momentum-app", version: "0.1.0" });
  const transport = new StreamableHTTPClientTransport(new URL(url), {
    requestInit: {
      headers: {
        "X-Mcp-Token": token,
      },
    },
  });

  await client.connect(transport);

  return { client, transport };
}

async function getFeatureStatusWithClient(
  client: Client,
  feature: FeatureDefinition,
  projectKey?: string,
): Promise<MeegoStatusResult> {
  if (!feature.meegoUrl && !feature.meegoIssueId) {
    return fallbackStatus(feature);
  }

  try {
    const args: Record<string, unknown> = {
      fields: ["work_item_status"],
    };

    if (feature.meegoUrl) {
      args.url = feature.meegoUrl;
    } else if (feature.meegoIssueId && projectKey) {
      args.project_key = projectKey;
      args.work_item_id = feature.meegoIssueId;
    } else {
      return fallbackStatus(feature);
    }

    const result = (await client.callTool({
      name: "get_workitem_brief",
      arguments: args,
    })) as McpToolResult;

    const blocks = getTextBlocks(result);
    const payload = parseFirstJsonBlock(blocks);

    if (payload) {
      return findStatusInObject(payload, feature);
    }

    const markdown = blocks.find((block) => block.includes("# 工作项属性"));

    if (markdown) {
      return findStatusInMarkdown(markdown, feature);
    }

    const errorText = blocks.find((block) => block.toLowerCase().includes("error")) ?? null;
    return fallbackStatus(feature, errorText);
  } catch (error) {
    const message = error instanceof Error ? error.message : null;
    return fallbackStatus(feature, message);
  }
}

export async function getFeatureStatusesFromMeego(
  features: FeatureDefinition[],
): Promise<DashboardFeature[]> {
  const { projectKey } = getEnv();
  const hasDirectUrls = features.some((feature) => Boolean(feature.meegoUrl));

  const connection = await createMcpClient();

  if (!connection || (!projectKey && !hasDirectUrls)) {
    return features.map((feature) => ({
      ...feature,
      status: feature.defaultStatus,
      meegoState: null,
      meegoUrl: feature.meegoUrl ?? null,
      lastSyncedAt: null,
      isLive: false,
    }));
  }

  const { client, transport } = connection;

  try {
    const enriched: DashboardFeature[] = [];

    for (const feature of features) {
      const meego = await getFeatureStatusWithClient(client, feature, projectKey);

      enriched.push({
        ...feature,
        title: meego.title ?? feature.title,
        description: meego.description ?? feature.description,
        team: meego.team ?? feature.team,
        owner: meego.owner ?? feature.owner,
        dueDate: meego.dueDate ?? feature.dueDate,
        tasks: meego.tasks ?? feature.tasks,
        status: meego.status,
        meegoState: meego.meegoState,
        meegoUrl: meego.meegoUrl,
        lastSyncedAt: meego.lastSyncedAt,
        isLive: meego.isLive,
      });
    }

    return enriched;
  } finally {
    await transport.close();
  }
}
