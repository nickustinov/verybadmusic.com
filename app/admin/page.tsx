import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { readMixes } from "@/lib/catalog/store";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const mixes = await readMixes();
  return <AdminDashboard mixes={mixes} />;
}
