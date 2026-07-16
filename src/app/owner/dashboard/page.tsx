import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { profileRepository } from "@/lib/supabase/profile.repository";
import { leadApi } from "@/lib/api/lead.api";
import { getMyListings } from "@/lib/actions/listing.action";
import PropertyDashboard from "@/components/dashboard/PropertyDashboard";
import { Lead } from "@/types/lead";

export const dynamic = "force-dynamic";

export default async function OwnerDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const profile = await profileRepository.getSessionProfile(user.id);
  if (profile?.accountType !== "owner") redirect("/");

  let leads: Lead[] = [];
  if (profile.oldWpUserId != null) {
    leads = await leadApi.getAgentLeads(profile.oldWpUserId);
  }

  const listings = await getMyListings();

  return (
    <PropertyDashboard
      listings={listings}
      leads={leads}
      fullName={profile.fullName}
    />
  );
}
