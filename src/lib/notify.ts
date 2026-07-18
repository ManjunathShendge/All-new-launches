import { notificationRepository } from "@/lib/supabase/notification.repository";
import type { NotifyInput } from "@/types/notification";

/**
 * Fire-and-forget notification helpers used inside server actions. Every call is
 * wrapped so a notification failure can NEVER break the action that triggered it
 * (creating the property, capturing the lead, etc. must still succeed).
 * Server-only — imports the service-role client.
 */

export async function notifyUser(
  recipientId: string | null | undefined,
  input: NotifyInput
): Promise<void> {
  if (!recipientId) return;
  try {
    await notificationRepository.createForMany([recipientId], input);
  } catch {
    /* swallow */
  }
}

export async function notifyAdmins(input: NotifyInput): Promise<void> {
  try {
    const ids = await notificationRepository.adminIds();
    await notificationRepository.createForMany(ids, input);
  } catch {
    /* swallow */
  }
}

/** Notify a property's lister, resolved from their legacy WP user id. */
export async function notifyLister(
  wpUserId: number | null,
  input: NotifyInput
): Promise<void> {
  try {
    const id = await notificationRepository.profileIdByWpUserId(wpUserId);
    if (id) await notificationRepository.createForMany([id], input);
  } catch {
    /* swallow */
  }
}
