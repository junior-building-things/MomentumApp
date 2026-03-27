import { featureRegistry } from "@/lib/feature-registry";
import { getFeatureStatusesFromMeego } from "@/lib/meego";
import { DashboardData, DashboardFeature, DashboardSummaryCard, FeatureStatus } from "@/lib/types";

function createSummary(features: DashboardFeature[]): DashboardSummaryCard[] {
  const countByStatus = features.reduce<Record<FeatureStatus, number>>(
    (accumulator, feature) => {
      accumulator[feature.status] += 1;
      return accumulator;
    },
    {
      planned: 0,
      in_progress: 0,
      launched: 0,
      at_risk: 0,
    },
  );

  return [
    { id: "total", label: "Total Features", value: features.length },
    { id: "in_progress", label: "In Progress", value: countByStatus.in_progress },
    { id: "launched", label: "Launched", value: countByStatus.launched },
    { id: "at_risk", label: "At Risk", value: countByStatus.at_risk },
  ];
}

export async function getDashboardData(): Promise<DashboardData> {
  const { features: enriched, error } = await getFeatureStatusesFromMeego(featureRegistry);

  const liveFeatures = enriched.filter((feature) => feature.isLive);
  const lastSyncedAt = liveFeatures.length > 0 ? new Date().toISOString() : null;

  return {
    features: enriched,
    summary: createSummary(enriched),
    lastSyncedAt,
    isLive: liveFeatures.length > 0,
    loadError: error,
  };
}
