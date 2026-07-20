"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { profileRepository } from "@/lib/supabase/profile.repository";
import { notificationRepository } from "@/lib/supabase/notification.repository";
import { getUserErrorMessage } from "@/lib/errors/user-message";

const ALLOWED = ["new", "contacted", "closed", "lost"];

/**
 * Agent/owner updates the status of an enquiry (lead) on their own listing.
 * The first time it's marked "contacted", the enquirer is notified that an
 * agent has responded (best-effort).
 */
export async function setMyLeadStatus(
  leadId: number,
  status: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const profile = await profileRepository.getSessionProfile(user.id);
  if (profile?.accountType !== "agent" && profile?.accountType !== "owner") {
    return { ok: false, error: "Not allowed." };
  }
  if (!ALLOWED.includes(status)) return { ok: false, error: "Invalid status." };
  if (!Number.isInteger(leadId)) return { ok: false, error: "Invalid lead." };
  if (profile.oldWpUserId == null) return { ok: false, error: "Not linked." };

  const db = createServiceRoleClient();
  const { data: lead } = await db
    .from("leads")
    .select("id, user_id, email, property_id, status")
    .eq("id", leadId)
    .maybeSingle();
  // Ownership: the lead must be assigned to this agent/owner.
  if (!lead || (lead.user_id as number | null) !== profile.oldWpUserId) {
    return { ok: false, error: "Lead not found." };
  }

  const wasContacted = (lead.status as string | null) === "contacted";
  const { error } = await db.from("leads").update({ status }).eq("id", leadId);
  if (error)
    return { ok: false, error: getUserErrorMessage(error, "Could not update the lead.") };

  // Notify the enquirer the first time it becomes "contacted".
  if (status === "contacted" && !wasContacted) {
    try {
      let propTitle = "the property";
      let propLink: string | null = null;
      if (lead.property_id != null) {
        const { data: p } = await db
          .from("properties")
          .select("title, slug")
          .eq("id", lead.property_id as number)
          .maybeSingle();
        propTitle = (p?.title as string | null) ?? propTitle;
        propLink = p?.slug ? `/properties/${p.slug as string}` : null;
      }
      const email = (lead.email as string | null) ?? "";
      if (email) {
        const { data: enquirer } = await db
          .from("profiles")
          .select("id")
          .ilike("email", email)
          .maybeSingle();
        if (enquirer?.id) {
          await notificationRepository.createForMany([enquirer.id as string], {
            type: "enquiry_response",
            title: "An agent responded to your enquiry",
            body: `An agent is following up on your enquiry about "${propTitle}".`,
            link: propLink,
          });
        }
      }
    } catch {
      /* notification best-effort */
    }
  }

  revalidatePath("/agent/dashboard");
  revalidatePath("/owner/dashboard");
  return { ok: true };
}
