"use server";

import { headers } from "next/headers";
import { leadApi } from "@/lib/api/lead.api";
import { CreateLeadInput } from "@/types/lead";
import { rateLimit } from "@/lib/security/rate-limit";
import { getUserErrorMessage } from "@/lib/errors/user-message";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { notificationRepository } from "@/lib/supabase/notification.repository";

export interface SubmitLeadResult {
  success: boolean;
  error?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Upper bounds to reject oversized/abusive payloads before they hit the DB.
const MAX = { name: 100, email: 150, phone: 20, message: 2000 };

export async function submitLead(input: CreateLeadInput): Promise<SubmitLeadResult> {
  // --- Rate limit per client IP (blunt form-spam / abuse) ---
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown";

  const rl = rateLimit(`lead:${ip}`, 5, 10 * 60 * 1000); // 5 per 10 min
  if (!rl.ok) {
    return {
      success: false,
      error: `Too many requests. Please try again in ${rl.retryAfter}s.`,
    };
  }

  const name = (input.name?.trim() ?? "").slice(0, MAX.name);
  const email = (input.email?.trim() ?? "").slice(0, MAX.email);
  const phone = (input.phone?.trim() ?? "").slice(0, MAX.phone);
  const message = (input.message?.trim() ?? "").slice(0, MAX.message);

  if (!input.propertyId || Number.isNaN(Number(input.propertyId))) {
    return { success: false, error: "Invalid property." };
  }
  if (name.length < 2) {
    return { success: false, error: "Please enter your name." };
  }
  if (!EMAIL_RE.test(email)) {
    return { success: false, error: "Please enter a valid email." };
  }
  if (phone.replace(/\D/g, "").length < 7) {
    return { success: false, error: "Please enter a valid phone number." };
  }

  try {
    await leadApi.createLead({
      propertyId: Number(input.propertyId),
      name,
      email,
      phone,
      message,
      propertyUrl: input.propertyUrl,
    });

    // Notify the listing's agent/owner (best-effort; never fails the enquiry).
    try {
      const db = createServiceRoleClient();
      const { data: prop } = await db
        .from("properties")
        .select("user_id, title, slug")
        .eq("id", Number(input.propertyId))
        .maybeSingle();
      const propTitle = (prop?.title as string | null) ?? "the property";
      const propLink = prop?.slug ? `/properties/${prop.slug as string}` : null;

      // Notify the listing's agent/owner.
      if (prop?.user_id != null) {
        const { data: lister } = await db
          .from("profiles")
          .select("id, account_type")
          .eq("old_wp_user_id", prop.user_id)
          .maybeSingle();
        if (lister?.id) {
          await notificationRepository.createForMany([lister.id as string], {
            type: "new_lead",
            title: "New enquiry on your listing",
            body: `${name} enquired about "${propTitle}".`,
            link:
              lister.account_type === "owner"
                ? "/owner/dashboard"
                : "/agent/dashboard",
          });
        }
      }

      // Confirmation to the enquirer if they have an account.
      const { data: me } = await db
        .from("profiles")
        .select("id")
        .ilike("email", email)
        .maybeSingle();
      if (me?.id) {
        await notificationRepository.createForMany([me.id as string], {
          type: "enquiry_sent",
          title: "Enquiry sent",
          body: `Your details were shared for "${propTitle}". The agent will reach out soon.`,
          link: propLink,
        });
      }
    } catch {
      /* notification best-effort */
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: getUserErrorMessage(err, "Something went wrong.") };
  }
}
