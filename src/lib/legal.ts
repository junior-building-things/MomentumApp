import { createHash } from "node:crypto";
import { DashboardFeature, FeaturePriority } from "@/lib/types";

interface LegalApiResponse<T> {
  success: boolean;
  code: string;
  msg: string;
  data: T;
}

interface LegalLookupItem {
  legalId: number;
  detailUrl: string;
}

interface LegalLookupGroup {
  workItemId: string;
  items?: LegalLookupItem[];
}

interface CreateComplianceInput {
  title: string;
  priority: FeaturePriority;
  meegoUrl: string;
  prdUrl?: string | null;
}

interface CreateComplianceResult {
  legalId: number;
  detailUrl: string;
  reviewStatus: string | null;
}

interface LegalEnv {
  baseUrl: string;
  appId?: string;
  appSecret?: string;
  defaultEmployeeId?: string;
  departmentId?: string;
  productId?: string;
  reviewCategoryCode?: string;
  autoSubmitOnCreate: boolean;
}

const LEGAL_PRIORITY_MAP: Record<FeaturePriority, string> = {
  p0: "1",
  p1: "2",
  p2: "3",
  p3: "3",
  tbd: "3",
};

function getEnv(): LegalEnv {
  return {
    baseUrl: process.env.LEGAL_BASE_URL ?? "https://legal.bytedance.net",
    appId: process.env.LEGAL_APP_ID,
    appSecret: process.env.LEGAL_APP_SECRET,
    defaultEmployeeId: process.env.LEGAL_DEFAULT_EMPLOYEE_ID,
    departmentId: process.env.LEGAL_DEPARTMENT_ID,
    productId: process.env.LEGAL_PRODUCT_ID,
    reviewCategoryCode: process.env.LEGAL_REVIEW_CATEGORY_CODE,
    autoSubmitOnCreate: process.env.LEGAL_AUTO_SUBMIT_ON_CREATE === "true",
  };
}

function getSignedPayload(bizParams: Record<string, unknown>) {
  const { appSecret } = getEnv();

  if (!appSecret) {
    throw new Error("Legal Compliance API is not configured.");
  }

  const timestamp = Date.now().toString();
  const bizParamsString = JSON.stringify(bizParams);
  const sign = createHash("md5").update(`${appSecret}${timestamp}${bizParamsString}`).digest("hex");

  return {
    timestamp,
    sign,
    bizParams: bizParamsString,
  };
}

async function postToLegal<T>(path: string, bizParams: Record<string, unknown>): Promise<T> {
  const { appId, baseUrl } = getEnv();

  if (!appId) {
    throw new Error("Legal Compliance API is not configured.");
  }

  const payload = getSignedPayload(bizParams);
  const body = new URLSearchParams(payload);
  const response = await fetch(`${baseUrl}/compliance/api/external/v1/${appId}/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    cache: "no-store",
  });

  const json = (await response.json()) as LegalApiResponse<T>;

  if (!json.success) {
    throw new Error(json.msg || `Legal API request failed with code ${json.code}.`);
  }

  return json.data;
}

export function isLegalConfigured() {
  const { appId, appSecret, defaultEmployeeId } = getEnv();
  return Boolean(appId && appSecret && defaultEmployeeId);
}

export function getMeegoWorkItemId(meegoUrl: string | null | undefined) {
  if (!meegoUrl) {
    return null;
  }

  return meegoUrl.match(/\/detail\/(\d+)/)?.[1] ?? null;
}

function chooseComplianceLookupItem(items?: LegalLookupItem[]) {
  if (!items || items.length === 0) {
    return null;
  }

  return [...items].sort((left, right) => right.legalId - left.legalId)[0] ?? null;
}

export async function lookupComplianceByMeegoWorkItemIds(workItemIds: string[]) {
  if (!isLegalConfigured() || workItemIds.length === 0) {
    return new Map<string, { legalId: number; detailUrl: string }>();
  }

  const uniqueIds = [...new Set(workItemIds.filter(Boolean))];
  const data = await postToLegal<LegalLookupGroup[]>("getByMeegoWorkItemId", {
    workItemIds: uniqueIds,
  });

  const results = new Map<string, { legalId: number; detailUrl: string }>();

  for (const entry of data ?? []) {
    const item = chooseComplianceLookupItem(entry.items);

    if (item && entry.workItemId) {
      results.set(entry.workItemId, item);
    }
  }

  return results;
}

export async function enrichFeaturesWithCompliance(features: DashboardFeature[]) {
  const unresolvedWorkItemIds = features
    .filter((feature) => !feature.complianceUrl)
    .map((feature) => getMeegoWorkItemId(feature.meegoUrl))
    .filter((value): value is string => Boolean(value));

  if (unresolvedWorkItemIds.length === 0) {
    return features;
  }

  try {
    const lookup = await lookupComplianceByMeegoWorkItemIds(unresolvedWorkItemIds);

    return features.map((feature) => {
      if (feature.complianceUrl) {
        return feature;
      }

      const workItemId = getMeegoWorkItemId(feature.meegoUrl);
      const match = workItemId ? lookup.get(workItemId) : null;

      if (!match) {
        return feature;
      }

      return {
        ...feature,
        complianceUrl: match.detailUrl,
      };
    });
  } catch {
    return features;
  }
}

export async function createComplianceForFeature(
  input: CreateComplianceInput,
): Promise<CreateComplianceResult> {
  const { defaultEmployeeId, departmentId, productId, reviewCategoryCode, autoSubmitOnCreate } = getEnv();

  if (!isLegalConfigured() || !defaultEmployeeId) {
    throw new Error("Legal Compliance API is not configured.");
  }

  const workItemId = getMeegoWorkItemId(input.meegoUrl);

  if (!workItemId) {
    throw new Error("A valid Meego story URL is required to create a compliance ticket.");
  }

  const data = await postToLegal<{
    id: number;
    detailUrl: string;
    reviewStatus?: string | null;
  }>("save", {
    projectName: input.title.trim().slice(0, 50),
    projectLiaisonId: Number(defaultEmployeeId),
    sourceLink: input.meegoUrl,
    sourceBusinessId: workItemId,
    priority: LEGAL_PRIORITY_MAP[input.priority],
    businessEmpId: Number(defaultEmployeeId),
    requirementDocLink: input.prdUrl ? [input.prdUrl.trim()] : null,
    departmentId: departmentId ?? null,
    productId: productId ? Number(productId) : null,
    reviewCategoryCode: reviewCategoryCode ?? null,
    isInitiate: autoSubmitOnCreate,
  });

  return {
    legalId: data.id,
    detailUrl: data.detailUrl,
    reviewStatus: data.reviewStatus ?? null,
  };
}
