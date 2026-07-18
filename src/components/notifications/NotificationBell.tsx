"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Ban,
  Clock,
  UserPlus,
  MessageSquare,
  Wallet,
  ShoppingCart,
  CalendarDays,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  getMyNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/actions/notification.action";
import { createClient } from "@/lib/supabase/client";
import type { AppNotification } from "@/types/notification";

const POLL_MS = 45000;

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function iconFor(type: string): { Icon: LucideIcon; className: string } {
  if (type.includes("approved")) return { Icon: CheckCircle2, className: "bg-emerald-50 text-emerald-600" };
  if (type.includes("reject") || type.includes("disapprov")) return { Icon: Ban, className: "bg-red-50 text-red-600" };
  if (type.includes("pending") || type.includes("submitted")) return { Icon: Clock, className: "bg-amber-50 text-amber-600" };
  if (type.includes("lead") || type.includes("enquiry")) return { Icon: MessageSquare, className: "bg-blue-50 text-blue-600" };
  if (type.includes("credit") || type.includes("wallet") || type.includes("topup")) return { Icon: Wallet, className: "bg-emerald-50 text-emerald-600" };
  if (type.includes("purchase") || type.includes("bought")) return { Icon: ShoppingCart, className: "bg-blue-50 text-blue-600" };
  if (type.includes("event")) return { Icon: CalendarDays, className: "bg-amber-50 text-amber-600" };
  if (type.includes("signup")) return { Icon: UserPlus, className: "bg-blue-50 text-blue-600" };
  return { Icon: Bell, className: "bg-slate-100 text-slate-500" };
}

/**
 * Notification bell for any signed-in user. Polls the unread count; opens a
 * dropdown that lazily loads the list. Clicking a row marks it read and follows
 * its link. Placed in the navbar and the admin shell.
 */
export default function NotificationBell({ dark = false }: { dark?: boolean }) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<AppNotification | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  // Poll the unread count as a fallback (async-set, so no synchronous set).
  useEffect(() => {
    let active = true;
    const load = async () => {
      const c = await getUnreadCount();
      if (active) setCount(c);
    };
    load();
    const t = setInterval(load, POLL_MS);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, []);

  // Realtime: new notifications arrive instantly (badge bump + toast). Needs the
  // notifications table on the realtime publication + a read-own RLS policy.
  useEffect(() => {
    const supabase = createClient();
    let active = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !active) return;
      // Unique channel name per subscription — the browser client is a
      // singleton, so reusing a name returns an already-subscribed channel
      // (StrictMode remount) and `.on()` after subscribe() throws.
      channel = supabase
        .channel(`notif-${user.id}-${Math.random().toString(36).slice(2)}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `recipient_id=eq.${user.id}`,
          },
          (payload) => {
            const r = payload.new as Record<string, unknown>;
            const n: AppNotification = {
              id: r.id as number,
              type: (r.type as string) ?? "",
              title: (r.title as string) ?? "",
              body: (r.body as string | null) ?? null,
              link: (r.link as string | null) ?? null,
              read: false,
              createdAt: (r.created_at as string | null) ?? null,
            };
            setCount((c) => c + 1);
            setItems((prev) => [n, ...prev.filter((x) => x.id !== n.id)]);
            setToast(n);
            if (hideTimer) clearTimeout(hideTimer);
            hideTimer = setTimeout(() => setToast(null), 5000);
          }
        )
        .subscribe();
    })();

    return () => {
      active = false;
      if (hideTimer) clearTimeout(hideTimer);
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const openPanel = async () => {
    setOpen(true);
    setLoading(true);
    try {
      const list = await getMyNotifications();
      setItems(list);
      setCount(list.filter((n) => !n.read).length);
    } finally {
      setLoading(false);
    }
  };

  const onRowClick = (n: AppNotification) => {
    if (!n.read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setCount((c) => Math.max(0, c - 1));
      startTransition(() => void markNotificationRead(n.id));
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  };

  const markAll = () => {
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    setCount(0);
    startTransition(() => void markAllNotificationsRead());
  };

  const toastMeta = toast ? iconFor(toast.type) : null;
  const ToastIcon = toastMeta?.Icon;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openPanel())}
        aria-label="Notifications"
        className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
          dark ? "text-slate-200 hover:bg-white/10" : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <span className="text-sm font-semibold text-slate-900">Notifications</span>
              {items.some((n) => !n.read) && (
                <button
                  type="button"
                  onClick={markAll}
                  className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[70vh] overflow-y-auto">
              {loading ? (
                <div className="px-4 py-10 text-center text-sm text-slate-400">Loading…</div>
              ) : items.length === 0 ? (
                <div className="px-4 py-12 text-center text-sm text-slate-400">
                  You&apos;re all caught up.
                </div>
              ) : (
                items.map((n) => {
                  const { Icon, className } = iconFor(n.type);
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => onRowClick(n)}
                      className={`flex w-full gap-3 border-b border-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                        n.read ? "" : "bg-blue-50/40"
                      }`}
                    >
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${className}`}>
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-slate-900">{n.title}</p>
                          {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600" />}
                        </div>
                        {n.body && <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{n.body}</p>}
                        <p className="mt-1 text-[11px] text-slate-400">{timeAgo(n.createdAt)}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

      {/* Realtime toast (portal to body so the navbar can't clip it) */}
      {toast &&
        ToastIcon &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed right-4 top-20 z-70 w-80 max-w-[calc(100vw-2rem)]">
            <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xl">
              <button
                type="button"
                onClick={() => {
                  const link = toast.link;
                  setToast(null);
                  if (link) router.push(link);
                }}
                className="flex min-w-0 flex-1 items-start gap-3 text-left"
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${toastMeta.className}`}>
                  <ToastIcon className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
                  {toast.body && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{toast.body}</p>
                  )}
                </div>
              </button>
              <button
                type="button"
                onClick={() => setToast(null)}
                aria-label="Dismiss"
                className="shrink-0 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
