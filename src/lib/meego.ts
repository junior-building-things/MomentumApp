import { FeatureDefinition, FeatureStatus } from "@/lib/types";

interface MeegoField {
  field_alias?: string;
  field_key?: string;
  field_value?: string;
  field_internal_value?: string;
}

interface MeegoIssueResponse {
  data?: {
    fields?: MeegoField[];
    issue_detail?: {
      fields?: MeegoField[];
    };
    issue?: {
      fields?: MeegoField[];
    };
  };
  fields?: MeegoField[];
}

interface MeegoStatusResult {
  status: FeatureStatus;
  meegoState: string | null;
  meegoUrl: string | null;
  lastSyncedAt: string | null;
  isLive: boolean;
}

const MEEGO_STATUS_FIELD = "work_item_status";

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
  const baseUrl =
    process.env.MEEGO_BASE_URL?.replace(/\/$/, "") ??
    "https://meego.bytedance.net/open-api/v1";
  const authHeader = process.env.MEEGO_AUTH_HEADER ?? "Authorization";
  const authScheme = process.env.MEEGO_AUTH_SCHEME ?? "Bearer";
  const appBaseUrl =
    process.env.MEEGO_APP_BASE_URL?.replace(/\/$/, "") ?? "https://meego.bytedance.net";

  return {
    baseUrl,
    appBaseUrl,
    authHeader,
    authScheme,
    token: process.env.MEEGO_OPEN_API_TOKEN,
    projectKey: process.env.MEEGO_PROJECT_KEY,
  };
}

function extractFields(payload: MeegoIssueResponse): MeegoField[] {
  if (payload.data?.fields) {
    return payload.data.fields;
  }

  if (payload.data?.issue_detail?.fields) {
    return payload.data.issue_detail.fields;
  }

  if (payload.data?.issue?.fields) {
    return payload.data.issue.fields;
  }

  return payload.fields ?? [];
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

export async function getFeatureStatusFromMeego(
  feature: FeatureDefinition,
): Promise<MeegoStatusResult> {
  const { baseUrl, appBaseUrl, authHeader, authScheme, token, projectKey } = getEnv();

  if (!token || !projectKey || !feature.meegoIssueId) {
    return {
      status: feature.defaultStatus,
      meegoState: null,
      meegoUrl: null,
      lastSyncedAt: null,
      isLive: false,
    };
  }

  const authValue = authScheme ? `${authScheme} ${token}` : token;
  const requestUrl = `${baseUrl}/project/${projectKey}/issues/${feature.meegoIssueId}`;

  try {
    const response = await fetch(requestUrl, {
      headers: {
        Accept: "application/json",
        [authHeader]: authValue,
      },
      cache: "no-store",
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return {
        status: feature.defaultStatus,
        meegoState: `HTTP_${response.status}`,
        meegoUrl: `${appBaseUrl}/${projectKey}/issue/${feature.meegoIssueId}`,
        lastSyncedAt: null,
        isLive: false,
      };
    }

    const payload = (await response.json()) as MeegoIssueResponse;
    const fields = extractFields(payload);
    const statusField = fields.find(
      (field) => field.field_alias === MEEGO_STATUS_FIELD || field.field_key === MEEGO_STATUS_FIELD,
    );

    const meegoState = statusField?.field_value ?? null;

    return {
      status: mapStateToStatus(meegoState ?? undefined, feature.defaultStatus),
      meegoState,
      meegoUrl: `${appBaseUrl}/${projectKey}/issue/${feature.meegoIssueId}`,
      lastSyncedAt: new Date().toISOString(),
      isLive: true,
    };
  } catch {
    return {
      status: feature.defaultStatus,
      meegoState: null,
      meegoUrl: `${appBaseUrl}/${projectKey}/issue/${feature.meegoIssueId}`,
      lastSyncedAt: null,
      isLive: false,
    };
  }
}
