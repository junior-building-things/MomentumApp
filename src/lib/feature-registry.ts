import { FeatureSeed } from "@/lib/types";

export const EXTRA_FEATURES_COOKIE = "momentum_extra_meego_urls";

export const featureRegistry: FeatureSeed[] = [
  {
    id: "expand-sa-row-eu",
    priority: "p2",
    defaultStatus: "planned",
    meegoIssueId: "6970364080",
    meegoUrl: "https://meego.larkoffice.com/tiktok/story/detail/6970364080",
  },
  {
    id: "id-attribution-sa-ugc-stickers",
    priority: "p2",
    defaultStatus: "planned",
    meegoIssueId: "6970365064",
    meegoUrl: "https://meego.larkoffice.com/tiktok/story/detail/6970365064",
  },
  {
    id: "animated-sa-pgc-stickers",
    priority: "p2",
    defaultStatus: "planned",
    meegoIssueId: "6970402572",
    meegoUrl: "https://meego.larkoffice.com/tiktok/story/detail/6970402572",
  },
  {
    id: "story-6864333123",
    priority: "p2",
    defaultStatus: "planned",
    meegoIssueId: "6864333123",
    meegoUrl: "https://meego.larkoffice.com/tiktok/story/detail/6864333123",
  },
];

function createFeatureSeedFromUrl(url: string): FeatureSeed | null {
  const trimmedUrl = url.trim();
  const issueId = trimmedUrl.match(/\/detail\/(\d+)/)?.[1];

  if (!issueId) {
    return null;
  }

  return {
    id: `story-${issueId}`,
    priority: "p2",
    defaultStatus: "planned",
    meegoIssueId: issueId,
    meegoUrl: trimmedUrl,
  };
}

export function parseExtraMeegoUrlsCookie(rawValue?: string | null): string[] {
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

export function buildFeatureRegistry(extraUrls: string[] = []): FeatureSeed[] {
  const merged = new Map<string, FeatureSeed>();

  for (const feature of featureRegistry) {
    const key = feature.meegoUrl ?? feature.id;
    merged.set(key, feature);
  }

  for (const url of extraUrls) {
    const feature = createFeatureSeedFromUrl(url);

    if (!feature || merged.has(url.trim())) {
      continue;
    }

    merged.set(url.trim(), feature);
  }

  return [...merged.values()];
}
