import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { DashboardFeature, FeatureSeed, FeatureStatus, FeatureTask } from "@/lib/types";

interface McpTextContent {
  type: "text";
  text: string;
}

interface McpToolResult {
  content?: McpTextContent[];
  isError?: boolean;
}

interface MeegoFetchResult {
  feature: DashboardFeature | null;
  error?: string | null;
}

interface MeegoCollectionResult {
  features: DashboardFeature[];
  error: string | null;
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

const ENGLISH_LABEL_MAP: Record<string, string> = {
  "待评估&排优": "Evaluation & Prioritization",
  "待开始": "Not Started",
  "待排期": "Pending Scheduling",
  "技术评估&排优": "Technical Evaluation & Prioritization",
  "iOS审核风险排查": "iOS Review Risk Check",
  "AB实验设计": "A/B Test Design",
  "合规评估": "Compliance Review",
  "埋点设计": "Tracking Design",
  "内容设计&Starling提交": "Content Design & Starling Submission",
  "进行中": "In Progress",
  "开发中": "In Development",
  "处理中": "In Progress",
  "评估中": "Under Evaluation",
};

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

function extractString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function translateDisplayLabel(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return ENGLISH_LABEL_MAP[value] ?? value;
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

function parseInProgressTasks(markdown: string): FeatureTask[] {
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

function createFeatureFromMarkdown(markdown: string, seed: FeatureSeed): DashboardFeature | null {
  const title = extractMarkdownTableValue(markdown, "工作项名称");
  const meegoState = extractMarkdownTableValue(markdown, "工作项状态");
  const rawProject = extractMarkdownTableValue(markdown, "所属空间");
  const rawRoles = extractMarkdownTableValue(markdown, "角色成员");
  const updatedAt =
    extractMarkdownTableValue(markdown, "更新时间") ?? extractMarkdownTableValue(markdown, "创建时间");

  if (!title || !updatedAt) {
    return null;
  }

  return {
    id: seed.id,
    title,
    description: "",
    team: parseTeamFromProject(rawProject) ?? "Unknown Team",
    owner: parseOwnerFromRoles(rawRoles) ?? "Unknown Owner",
    dueDate: updatedAt,
    priority: seed.priority,
    tasks: parseInProgressTasks(markdown),
    status: mapStateToStatus(meegoState ?? undefined, seed.defaultStatus),
    currentStatusLabel:
      translateDisplayLabel(parseInProgressTasks(markdown)[0]?.label) ??
      translateDisplayLabel(meegoState) ??
      "Unknown",
    meegoState: translateDisplayLabel(meegoState),
    meegoUrl: seed.meegoUrl ?? null,
    lastSyncedAt: new Date().toISOString(),
    isLive: true,
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

async function getFeatureWithClient(
  client: Client,
  seed: FeatureSeed,
  projectKey?: string,
): Promise<MeegoFetchResult> {
  if (!seed.meegoUrl && !seed.meegoIssueId) {
    return { feature: null, error: "Missing Meego reference." };
  }

  try {
    const args: Record<string, unknown> = {
      fields: ["work_item_status"],
    };

    if (seed.meegoUrl) {
      args.url = seed.meegoUrl;
    } else if (seed.meegoIssueId && projectKey) {
      args.project_key = projectKey;
      args.work_item_id = seed.meegoIssueId;
    } else {
      return { feature: null, error: "Missing project key for Meego lookup." };
    }

    const result = (await client.callTool({
      name: "get_workitem_brief",
      arguments: args,
    })) as McpToolResult;

    const blocks = getTextBlocks(result);
    const markdown = blocks.find((block) => block.includes("# 工作项属性"));

    if (!markdown) {
      return {
        feature: null,
        error: blocks.find((block) => block.toLowerCase().includes("error")) ?? "Empty Meego response.",
      };
    }

    const feature = createFeatureFromMarkdown(markdown, seed);

    if (!feature) {
      return { feature: null, error: "Unable to parse Meego story details." };
    }

    return { feature };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Meego MCP error.";
    return { feature: null, error: message };
  }
}

export async function getFeatureStatusesFromMeego(features: FeatureSeed[]): Promise<MeegoCollectionResult> {
  const { projectKey } = getEnv();
  const hasDirectUrls = features.some((feature) => Boolean(feature.meegoUrl));
  const connection = await createMcpClient();

  if (!connection || (!projectKey && !hasDirectUrls)) {
    return {
      features: [],
      error: "Meego MCP is not configured.",
    };
  }

  const { client, transport } = connection;

  try {
    const resolved: DashboardFeature[] = [];
    let firstError: string | null = null;

    for (const feature of features) {
      const result = await getFeatureWithClient(client, feature, projectKey);

      if (result.feature) {
        resolved.push(result.feature);
      } else if (!firstError) {
        firstError = result.error ?? "Unable to load Meego stories.";
      }
    }

    return {
      features: resolved,
      error: resolved.length > 0 ? null : firstError ?? "Unable to load Meego stories.",
    };
  } finally {
    await transport.close();
  }
}
