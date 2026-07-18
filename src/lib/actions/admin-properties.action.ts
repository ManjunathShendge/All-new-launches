"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { profileRepository } from "@/lib/supabase/profile.repository";
import {
  getAdminPropertiesPage,
  type AdminPropertyFilter,
  type AdminPropertyPage,
} from "@/lib/admin/admin-queries";
import { ADMIN_PROPERTIES_PAGE_SIZE } from "@/lib/admin/constants";
import { notifyLister } from "@/lib/notify";

// The only statuses an admin can set from the review UI. "rejected" matches the
// value already used in the imported data (shown to users as "Disapproved").
const REVIEW_STATUSES = ["approved", "rejected", "pending"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

/**
 * Paged, filtered property fetch for the admin Properties table. Admin-guarded
 * because it's callable from the client.
 */
export async function fetchAdminProperties(
  page: number,
  filter: AdminPropertyFilter
): Promise<AdminPropertyPage> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { rows: [], count: 0 };

  const profile = await profileRepository.getSessionProfile(user.id);
  if (profile?.role !== "admin") return { rows: [], count: 0 };

  return getAdminPropertiesPage(page, ADMIN_PROPERTIES_PAGE_SIZE, filter);
}

/**
 * Approve / disapprove (or reset to pending) a property. Admin-guarded and
 * validated against a fixed status allowlist. Revalidates the public listing
 * caches so an approval goes live immediately.
 */
export async function setPropertyStatus(
  propertyId: number,
  status: ReviewStatus
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const profile = await profileRepository.getSessionProfile(user.id);
  if (profile?.role !== "admin") return { ok: false, error: "Not allowed." };

  if (!REVIEW_STATUSES.includes(status)) {
    return { ok: false, error: "Invalid status." };
  }
  if (!Number.isInteger(propertyId) || propertyId <= 0) {
    return { ok: false, error: "Invalid property." };
  }

  const db = createServiceRoleClient();
  const { data: updated, error } = await db
    .from("properties")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", propertyId)
    .select("user_id, title, slug")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };

  // Notify the lister of the review outcome.
  if (updated) {
    const title = (updated.title as string | null) ?? "Your property";
    const slug = updated.slug as string | null;
    if (status === "approved") {
      await notifyLister(updated.user_id as number | null, {
        type: "property_approved",
        title: "Your property is live 🎉",
        body: `"${title}" was approved and is now visible to buyers.`,
        link: slug ? `/properties/${slug}` : null,
      });
    } else if (status === "rejected") {
      await notifyLister(updated.user_id as number | null, {
        type: "property_disapproved",
        title: "Your property needs changes",
        body: `"${title}" was not approved. Review and resubmit.`,
        link: slug ? `/properties/${slug}` : null,
      });
    }
  }

  revalidatePath("/properties");
  revalidatePath("/");
  return { ok: true };
}
