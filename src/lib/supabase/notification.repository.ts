import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { AppNotification, NotifyInput } from "@/types/notification";

export class NotificationRepository {
  async createForMany(
    recipientIds: string[],
    input: NotifyInput
  ): Promise<void> {
    const ids = [...new Set(recipientIds.filter(Boolean))];
    if (ids.length === 0) return;
    const db = createServiceRoleClient();
    const rows = ids.map((recipient_id) => ({
      recipient_id,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      link: input.link ?? null,
    }));
    await db.from("notifications").insert(rows);
  }

  async list(recipientId: string, limit = 20): Promise<AppNotification[]> {
    const db = createServiceRoleClient();
    const { data } = await db
      .from("notifications")
      .select("id, type, title, body, link, read, created_at")
      .eq("recipient_id", recipientId)
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data ?? []).map((n) => ({
      id: n.id as number,
      type: (n.type as string) ?? "",
      title: (n.title as string) ?? "",
      body: (n.body as string | null) ?? null,
      link: (n.link as string | null) ?? null,
      read: Boolean(n.read),
      createdAt: (n.created_at as string | null) ?? null,
    }));
  }

  async unreadCount(recipientId: string): Promise<number> {
    const db = createServiceRoleClient();
    const { count } = await db
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", recipientId)
      .eq("read", false);
    return count ?? 0;
  }

  async markRead(recipientId: string, id: number): Promise<void> {
    const db = createServiceRoleClient();
    await db
      .from("notifications")
      .update({ read: true })
      .eq("recipient_id", recipientId)
      .eq("id", id);
  }

  async markAllRead(recipientId: string): Promise<void> {
    const db = createServiceRoleClient();
    await db
      .from("notifications")
      .update({ read: true })
      .eq("recipient_id", recipientId)
      .eq("read", false);
  }

  // ---- recipient resolvers ------------------------------------------------
  async adminIds(): Promise<string[]> {
    const db = createServiceRoleClient();
    const { data } = await db.from("profiles").select("id").eq("role", "admin");
    return (data ?? []).map((r) => r.id as string);
  }

  /** profiles.id for a property lister, resolved from their legacy WP user id. */
  async profileIdByWpUserId(wpUserId: number | null): Promise<string | null> {
    if (wpUserId == null) return null;
    const db = createServiceRoleClient();
    const { data } = await db
      .from("profiles")
      .select("id")
      .eq("old_wp_user_id", wpUserId)
      .maybeSingle();
    return (data?.id as string | null) ?? null;
  }
}

export const notificationRepository = new NotificationRepository();
