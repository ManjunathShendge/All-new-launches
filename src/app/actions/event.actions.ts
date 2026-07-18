"use server";

import { headers } from "next/headers";
import { eventService } from "@/lib/services/event.service";
import { rateLimit } from "@/lib/security/rate-limit";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { notificationRepository } from "@/lib/supabase/notification.repository";
import { notifyAdmins } from "@/lib/notify";
import {
  EventCard,
  EventFilter,
  RegisterInput,
  RegistrationStatus,
} from "@/types/event";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX = { name: 100, email: 150, phone: 20 };

/** Public: list published events (optionally filtered). Never throws. */
export async function getEvents(filter: EventFilter = {}): Promise<EventCard[]> {
  const clean: EventFilter = {
    category: filter.category?.trim() || undefined,
    locality: filter.locality?.trim().slice(0, 80) || undefined,
    search: filter.search?.trim().slice(0, 80) || undefined,
    when: filter.when,
  };
  return eventService.getEvents(clean);
}

export interface RegisterResult {
  success: boolean;
  status?: RegistrationStatus;
  error?: string;
}

/** Public: RSVP to an event. Rate-limited + validated + length-capped. */
export async function registerForEvent(
  input: RegisterInput
): Promise<RegisterResult> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown";

  const rl = rateLimit(`event-rsvp:${ip}`, 8, 10 * 60 * 1000);
  if (!rl.ok) {
    return {
      success: false,
      error: `Too many requests. Please try again in ${rl.retryAfter}s.`,
    };
  }

  const eventId = Number(input.eventId);
  const name = (input.name?.trim() ?? "").slice(0, MAX.name);
  const email = (input.email?.trim() ?? "").slice(0, MAX.email);
  const phone = (input.phone?.trim() ?? "").slice(0, MAX.phone);

  if (!eventId || Number.isNaN(eventId)) {
    return { success: false, error: "Invalid event." };
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
    const { status } = await eventService.register({
      eventId,
      name,
      email,
      phone,
    });

    // Notify the registrant (if they have an account) + admins. Best-effort.
    try {
      const db = createServiceRoleClient();
      const { data: ev } = await db
        .from("events")
        .select("title, slug")
        .eq("id", eventId)
        .maybeSingle();
      const evTitle = (ev?.title as string | null) ?? "the event";
      const evLink = ev?.slug ? `/events/${ev.slug as string}` : "/events";

      const { data: prof } = await db
        .from("profiles")
        .select("id")
        .ilike("email", email)
        .maybeSingle();
      if (prof?.id) {
        await notificationRepository.createForMany([prof.id as string], {
          type: "event",
          title:
            status === "waitlisted"
              ? `You're on the waitlist for ${evTitle}`
              : `You're registered for ${evTitle}`,
          body:
            status === "waitlisted"
              ? "We'll notify you if a spot opens up."
              : "See you there! Details are on the event page.",
          link: evLink,
        });
      }
      await notifyAdmins({
        type: "event_registration",
        title: "New event registration",
        body: `${name} registered for "${evTitle}".`,
        link: "/admin/dashboard",
      });
    } catch {
      /* notification best-effort */
    }

    return { success: true, status };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Something went wrong.",
    };
  }
}
