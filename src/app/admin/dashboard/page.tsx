import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { profileRepository } from "@/lib/supabase/profile.repository";
import { leadApi } from "@/lib/api/lead.api";
import {
  getAdminPropertiesPage,
  getPropertyStats,
  ADMIN_PROPERTIES_PAGE_SIZE,
} from "@/lib/admin/admin-queries";
import {
  getAdminUsersPage,
  getUserStats,
  ADMIN_USERS_PAGE_SIZE,
} from "@/lib/admin/user-queries";
import { getRecentActivity } from "@/lib/admin/activity-queries";
import AdminShell from "@/components/dashboard/AdminShell";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const profile = await profileRepository.getSessionProfile(user.id);
  if (profile?.role !== "admin") redirect("/");

  const [leads, agents, properties, propertyStats, users, userStats, activity] =
    await Promise.all([
      leadApi.getAllLeads(),
      leadApi.getAssignableAgents(),
      getAdminPropertiesPage(1, ADMIN_PROPERTIES_PAGE_SIZE, {}),
      getPropertyStats(),
      getAdminUsersPage(1, ADMIN_USERS_PAGE_SIZE, {}),
      getUserStats(),
      getRecentActivity({ limit: 60 }),
    ]);

  return (
    <AdminShell
      leads={leads}
      agents={agents}
      properties={properties}
      propertyStats={propertyStats}
      users={users}
      userStats={userStats}
      currentUserId={user.id}
      activity={activity}
    />
  );
}
