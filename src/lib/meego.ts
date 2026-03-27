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
  "DOING",
  "DEVELOPING",
  "TESTING",
  "REVIEW",
  "REVIEWING",
  "VERIFYING",
]);
const AT_RISK_STATES = new Set(["BLOCKED", "RISK", "AT_RISK", "ON_HOLD", "DELAYED"]);
const PLANNED_STATES = new Set(["OPEN", "TODO", "BACKLOG", "PLANNED", "INIT"]);

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

function findStatusInObject(
  payload: Record<string, unknown>,
  fallback: FeatureStatus,
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
        status: mapStateToStatus(meegoState, fallback),
        meegoState,
        meegoUrl: null,
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
          status: mapStateToStatus(meegoState, fallback),
          meegoState,
          meegoUrl: null,
          lastSyncedAt: new Date().toISOString(),
          isLive: true,
        };
      }
    }
  }

  return {
    status: fallback,
    meegoState: null,
    meegoUrl: null,
    lastSyncedAt: null,
    isLive: false,
  };
}

function fallbackStatus(feature: FeatureDefinition, override?: string | null): MeegoStatusResult {
  return {
    status: feature.defaultStatus,
    meegoState: override ?? null,
    meegoUrl: null,
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
  projectKey: string,
): Promise<MeegoStatusResult> {
  if (!feature.meegoIssueId) {
    return fallbackStatus(feature);
  }

  try {
    const result = (await client.callTool({
      name: "get_workitem_brief",
      arguments: {
        project_key: projectKey,
        work_item_id: feature.meegoIssueId,
        fields: ["work_item_status"],
      },
    })) as McpToolResult;

    const blocks = getTextBlocks(result);
    const payload = parseFirstJsonBlock(blocks);

    if (payload) {
      return findStatusInObject(payload, feature.defaultStatus);
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

  if (!projectKey) {
    return features.map((feature) => ({
      ...feature,
      status: feature.defaultStatus,
      meegoState: null,
      meegoUrl: null,
      lastSyncedAt: null,
      isLive: false,
    }));
  }

  const connection = await createMcpClient();

  if (!connection) {
    return features.map((feature) => ({
      ...feature,
      status: feature.defaultStatus,
      meegoState: null,
      meegoUrl: null,
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
