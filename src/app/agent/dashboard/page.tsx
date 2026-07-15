import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { profileRepository } from "@/lib/supabase/profile.repository";
import { leadApi } from "@/lib/api/lead.api";
import LeadsTable from "@/components/dashboard/LeadsTable";
import { Lead } from "@/types/lead";

export const dynamic = "force-dynamic";

export default async function AgentDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const profile = await profileRepository.getSessionProfile(user.id);

  let leads: Lead[] = [];
  if (profile?.oldWpUserId != null) {
    leads = await leadApi.getAgentLeads(profile.oldWpUserId);
  }

  const newCount = leads.filter((l) => l.status.toLowerCase() === "new").length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">My Enquiries</h1>
        <p className="mt-1 text-sm text-muted">
          {leads.length} total {leads.length === 1 ? "lead" : "leads"}
          {newCount > 0 && ` · ${newCount} new`}
        </p>
      </div>

      {profile?.oldWpUserId == null ? (
        <div className="rounded-card border border-(--border) bg-(--surface-container-lowest) p-10 text-center">
          <p className="text-sm text-muted">
            Your account isn&apos;t linked to any listings yet, so there are no
            enquiries to show.
          </p>
        </div>
      ) : (
        <LeadsTable leads={leads} />
      )}
    </div>
  );
}
