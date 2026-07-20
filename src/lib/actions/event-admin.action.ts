"use server";

import { revalidatePath } from "next/cache";
import { getUserErrorMessage } from "@/lib/errors/user-message";
import { createClient } from "@/lib/supabase/server";
import { profileRepository } from "@/lib/supabase/profile.repository";
import { eventRepository } from "@/lib/supabase/event.repository";
import {
  AdminEventRow,
  EventInput,
  EventRegistrationRow,
  EventStatus,
} from "@/types/event";

export interface EventMutationResult {
  success: boolean;
  error?: string;
}

async function isAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const profile = await profileRepository.getSessionProfile(user.id);
  return profile?.role === "admin";
}

function validate(input: EventInput): string | null {
  if (!input.title || input.title.trim().length < 3)
    return "Title must be at least 3 characters.";
  if (!input.startsAt) return "Start date & time is required.";
  if (Number.isNaN(new Date(input.startsAt).getTime()))
    return "Invalid start date.";
  if (
    input.capacity != null &&
    (Number.isNaN(input.capacity) || input.capacity < 0)
  )
    return "Capacity must be a positive number.";
  return null;
}

export async function listAdminEvents(): Promise<AdminEventRow[]> {
  if (!(await isAdmin())) return [];
  return eventRepository.getAllForAdmin();
}

export async function getEventRegistrations(
  eventId: number
): Promise<EventRegistrationRow[]> {
  if (!(await isAdmin())) return [];
  return eventRepository.getRegistrations(eventId);
}

export async function createEvent(
  input: EventInput
): Promise<EventMutationResult> {
  if (!(await isAdmin()))
    return { success: false, error: "Admin access required." };
  const err = validate(input);
  if (err) return { success: false, error: err };
  try {
    await eventRepository.insert(input);
    revalidatePath("/admin/dashboard");
    revalidatePath("/events");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: getUserErrorMessage(e, "Failed to create event."),
    };
  }
}

export async function updateEvent(
  id: number,
  input: EventInput
): Promise<EventMutationResult> {
  if (!(await isAdmin()))
    return { success: false, error: "Admin access required." };
  const err = validate(input);
  if (err) return { success: false, error: err };
  try {
    await eventRepository.update(id, input);
    revalidatePath("/admin/dashboard");
    revalidatePath("/events");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: getUserErrorMessage(e, "Failed to update event."),
    };
  }
}

export async function setEventStatus(
  id: number,
  status: EventStatus
): Promise<EventMutationResult> {
  if (!(await isAdmin()))
    return { success: false, error: "Admin access required." };
  try {
    await eventRepository.setStatus(id, status);
    revalidatePath("/admin/dashboard");
    revalidatePath("/events");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: getUserErrorMessage(e, "Failed to update status."),
    };
  }
}

export async function deleteEvent(id: number): Promise<EventMutationResult> {
  if (!(await isAdmin()))
    return { success: false, error: "Admin access required." };
  try {
    await eventRepository.remove(id);
    revalidatePath("/admin/dashboard");
    revalidatePath("/events");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: getUserErrorMessage(e, "Failed to delete event."),
    };
  }
}
