import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { profileRepository } from "@/lib/supabase/profile.repository";
import { getMyProfile } from "@/lib/actions/profile.action";
import {
  getMyActivityStats,
  getMyEnquiries,
  getMyEvents,
  getMySavedProperties,
} from "@/lib/actions/user-activity.action";
import UserProfile from "@/components/profile/UserProfile";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  // The /profile area is for regular buyers. Agents and owners have their own
  // dashboards, so send them there instead.
  const profile = await profileRepository.getSessionProfile(user.id);
  if (profile?.accountType === "agent" || profile?.accountType === "owner") {
    redirect("/");
  }

  const [editable, stats, enquiries, events, saved] = await Promise.all([
    getMyProfile(),
    getMyActivityStats(),
    getMyEnquiries(),
    getMyEvents(),
    getMySavedProperties(),
  ]);

  if (!editable) {
    return (
      <main className="min-h-screen bg-(--surface) py-20 text-center text-sm text-slate-500">
        Could not load your profile. Please try again.
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-(--surface)">
      <UserProfile
        profile={editable}
        stats={stats}
        enquiries={enquiries}
        events={events}
        saved={saved}
      />
    </main>
  );
}
