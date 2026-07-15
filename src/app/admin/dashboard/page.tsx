import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { profileRepository } from "@/lib/supabase/profile.repository";
import { leadApi } from "@/lib/api/lead.api";
import LeadsTable from "@/components/dashboard/LeadsTable";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const profile = await profileRepository.getSessionProfile(user.id);
  if (profile?.role !== "admin") redirect("/");

  const leads = await leadApi.getAllLeads();
  const newCount = leads.filter((l) => l.status.toLowerCase() === "new").length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">All Enquiries</h1>
        <p className="mt-1 text-sm text-muted">
          {leads.length} total {leads.length === 1 ? "lead" : "leads"}
          {newCount > 0 && ` · ${newCount} new`}
        </p>
      </div>

      <LeadsTable leads={leads} showAgent />
    </div>
  );
}
