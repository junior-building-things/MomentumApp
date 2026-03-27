import { DashboardShell } from "@/components/dashboard-shell";
import { cookies } from "next/headers";
import { getDashboardData } from "@/lib/dashboard-data";
import { EXTRA_FEATURES_COOKIE, parseExtraMeegoUrlsCookie } from "@/lib/feature-registry";

export const dynamic = "force-dynamic";

export default async function Home() {
  const cookieStore = await cookies();
  const extraFeatureUrls = parseExtraMeegoUrlsCookie(cookieStore.get(EXTRA_FEATURES_COOKIE)?.value);
  const dashboard = await getDashboardData(extraFeatureUrls);

  return <DashboardShell initialData={dashboard} />;
}
