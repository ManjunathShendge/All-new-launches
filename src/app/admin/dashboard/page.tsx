import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { profileRepository } from "@/lib/supabase/profile.repository";
import { leadApi } from "@/lib/api/lead.api";
import {
  getAdminPropertiesPage,
  getPropertyStats,
  ADMIN_PROPERTIES_PAGE_SIZE,
} from "@/lib/admin/admin-queries";
import AdminShell from "@/components/dashboard/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const profile = await profileRepository.getSessionProfile(user.id);
  if (profile?.role !== "admin") redirect("/");

  const [leads, agents, properties, propertyStats] = await Promise.all([
    leadApi.getAllLeads(),
    leadApi.getAssignableAgents(),
    getAdminPropertiesPage(1, ADMIN_PROPERTIES_PAGE_SIZE, {}),
    getPropertyStats(),
  ]);

  return (
    <AdminShell
      leads={leads}
      agents={agents}
      properties={properties}
      propertyStats={propertyStats}
    />
  );
}
