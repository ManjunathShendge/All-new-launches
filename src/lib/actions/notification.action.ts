"use server";

import { createClient } from "@/lib/supabase/server";
import { notificationRepository } from "@/lib/supabase/notification.repository";
import type { AppNotification } from "@/types/notification";

async function currentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function getMyNotifications(): Promise<AppNotification[]> {
  const id = await currentUserId();
  if (!id) return [];
  // Load all recent notifications — the dropdown scrolls through them.
  return notificationRepository.list(id, 100);
}

export async function getUnreadCount(): Promise<number> {
  const id = await currentUserId();
  if (!id) return 0;
  return notificationRepository.unreadCount(id);
}

export async function markNotificationRead(
  notificationId: number
): Promise<{ ok: boolean }> {
  const id = await currentUserId();
  if (!id) return { ok: false };
  if (!Number.isInteger(notificationId)) return { ok: false };
  await notificationRepository.markRead(id, notificationId);
  return { ok: true };
}

export async function markAllNotificationsRead(): Promise<{ ok: boolean }> {
  const id = await currentUserId();
  if (!id) return { ok: false };
  await notificationRepository.markAllRead(id);
  return { ok: true };
}
