import { DashboardShell } from "@/components/dashboard-shell";
import { getDashboardData } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const dashboard = await getDashboardData();

  return <DashboardShell initialData={dashboard} />;
}
