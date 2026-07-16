import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { profileRepository } from "@/lib/supabase/profile.repository";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  // The /profile area is for regular users. Agents and owners have their own
  // dashboards, so send them there instead.
  const profile = await profileRepository.getSessionProfile(user.id);
  if (profile?.accountType === "agent" || profile?.accountType === "owner") {
    redirect("/");
  }

  return (
    <div>
      User Profile
      <br />
      Coming Soon 🚀
    </div>
  );
}
