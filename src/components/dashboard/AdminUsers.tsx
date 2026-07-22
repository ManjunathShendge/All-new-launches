"use client";

import { useRef, useState, useTransition } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
  ShieldCheck,
  ShieldOff,
  Users2,
  Building2,
  UserRound,
  Crown,
  X,
  Mail,
  Phone,
  AlertTriangle,
  Check,
} from "lucide-react";
import Select from "@/components/ui/Select";
import ExportButton from "@/components/ui/ExportButton";
import type { ExportColumn } from "@/lib/export/csv";
import { ADMIN_USERS_PAGE_SIZE as PAGE_SIZE } from "@/lib/admin/constants";
import type {
  AdminUser,
  AdminUserPage,
  AdminUserFilter,
  UserCategory,
  UserStats,
} from "@/lib/admin/user-queries";
import {
  fetchAdminUsers,
  setUserAccountType,
  setUserRole,
  deleteUser,
  type AccountType,
} from "@/lib/actions/admin-users.action";

// ─────────────────────────── category presentation ───────────────────────────

const CATEGORY_META: Record<
  UserCategory,
  { label: string; badge: string; dot: string }
> = {
  user: { label: "User", badge: "bg-slate-100 text-slate-600", dot: "bg-slate-400" },
  agent: { label: "Agent", badge: "bg-blue-50 text-blue-700", dot: "bg-blue-500" },
  owner: { label: "Owner", badge: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  admin: { label: "Admin", badge: "bg-slate-900 text-white", dot: "bg-amber-400" },
};

function catOf(role: string, accountType: string): UserCategory {
  if (role === "admin") return "admin";
  if (accountType === "agent") return "agent";
  if (accountType === "owner") return "owner";
  return "user";
}

function CategoryBadge({ category }: { category: UserCategory }) {
  const m = CATEGORY_META[category];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${m.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

function initials(name: string | null, email: string | null): string {
  const src = (name || email || "?").trim();
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const USER_COLUMNS: ExportColumn<AdminUser>[] = [
  { header: "Name", value: (u) => u.fullName ?? "" },
  { header: "Email", value: (u) => u.email ?? "" },
  { header: "Phone", value: (u) => u.phone ?? "" },
  { header: "Role", value: (u) => CATEGORY_META[u.category].label },
  { header: "Account Type", value: (u) => u.accountType },
  { header: "Joined", value: (u) => formatDate(u.createdAt) },
];

function pageWindow(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("…");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("…");
  pages.push(total);
  return pages;
}

// ───────────────────────────── stat cards ─────────────────────────────

const STAT_CARDS: {
  key: keyof UserStats;
  category: UserCategory | null;
  label: string;
  icon: typeof Users2;
  accent: string;
}[] = [
  { key: "total", category: null, label: "Total", icon: Users2, accent: "text-slate-900" },
  { key: "users", category: "user", label: "Users", icon: UserRound, accent: "text-slate-600" },
  { key: "agents", category: "agent", label: "Agents", icon: Building2, accent: "text-blue-600" },
  { key: "owners", category: "owner", label: "Owners", icon: UserRound, accent: "text-amber-600" },
  { key: "admins", category: "admin", label: "Admins", icon: Crown, accent: "text-slate-900" },
];

// ─────────────────────────── confirmation modal ───────────────────────────

type Confirm = {
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
};

function ConfirmDialog({
  confirm,
  busy,
  onClose,
}: {
  confirm: Confirm;
  busy: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      onClick={busy ? undefined : onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              confirm.danger ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
            }`}
          >
            {confirm.danger ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <ShieldCheck className="h-5 w-5" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-slate-900">
              {confirm.title}
            </h3>
            <div className="mt-1 text-sm text-slate-500">{confirm.message}</div>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={confirm.onConfirm}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60 ${
              confirm.danger
                ? "bg-red-600 hover:bg-red-700"
                : "bg-slate-900 hover:bg-slate-800"
            }`}
          >
            {busy ? "Working…" : confirm.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────── main component ─────────────────────────────

export default function AdminUsers({
  initial,
  initialStats,
  currentUserId,
}: {
  initial: AdminUserPage;
  initialStats: UserStats;
  currentUserId: string;
}) {
  const [rows, setRows] = useState(initial.rows);
  const [count, setCount] = useState(initial.count);
  const [stats, setStats] = useState(initialStats);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<UserCategory | null>(null);
  const [search, setSearch] = useState("");
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const flash = (ok: boolean, text: string) => {
    setToast({ ok, text });
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(null), 3200);
  };

  const load = (nextPage: number, filter: AdminUserFilter) => {
    startTransition(async () => {
      const res = await fetchAdminUsers(nextPage, filter);
      setRows(res.rows);
      setCount(res.count);
      setPage(nextPage);
    });
  };

  const currentFilter = (): AdminUserFilter => ({
    category: category ?? undefined,
    search: search.trim() || undefined,
  });

  // Export walks every page for the active filter, not just the page on screen.
  const fetchAllForExport = async (): Promise<AdminUser[]> => {
    const filter = currentFilter();
    const all: AdminUser[] = [];
    const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));
    for (let p = 1; p <= pages; p++) {
      const res = await fetchAdminUsers(p, filter);
      all.push(...res.rows);
      if (res.rows.length === 0) break;
    }
    return all;
  };

  const pickCategory = (next: UserCategory | null) => {
    setCategory(next);
    load(1, { category: next ?? undefined, search: search.trim() || undefined });
  };

  const onSearch = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () =>
        load(1, {
          category: category ?? undefined,
          search: value.trim() || undefined,
        }),
      400
    );
  };

  const patchRow = (id: string, patch: Partial<AdminUser>) =>
    setRows((rs) =>
      rs.map((r) => {
        if (r.id !== id) return r;
        const merged = { ...r, ...patch };
        merged.category = catOf(merged.role, merged.accountType);
        return merged;
      })
    );

  // ── Actions (each opens a confirmation first) ──

  const askAccountType = (u: AdminUser, next: AccountType) => {
    if (next === u.accountType) return;
    setConfirm({
      title: "Change account type?",
      message: (
        <>
          Set <b>{u.fullName || u.email || "this user"}</b> from{" "}
          <b>{CATEGORY_META[catOf("user", u.accountType)].label}</b> to{" "}
          <b>{CATEGORY_META[catOf("user", next)].label}</b>?
        </>
      ),
      confirmLabel: "Change type",
      onConfirm: () => {
        setBusyId(u.id);
        startTransition(async () => {
          const res = await setUserAccountType(u.id, next);
          if (res.ok) {
            patchRow(u.id, { accountType: next });
            if (res.stats) setStats(res.stats);
            flash(true, "Account type updated.");
          } else {
            flash(false, res.error ?? "Could not update.");
          }
          setBusyId(null);
          setConfirm(null);
        });
      },
    });
  };

  const askRole = (u: AdminUser) => {
    const makeAdmin = u.role !== "admin";
    setConfirm({
      title: makeAdmin ? "Grant admin access?" : "Remove admin access?",
      message: makeAdmin ? (
        <>
          <b>{u.fullName || u.email || "This user"}</b> will get full admin
          control — managing users, properties, leads and everything else.
        </>
      ) : (
        <>
          <b>{u.fullName || u.email || "This user"}</b> will lose admin access and
          return to a normal <b>{CATEGORY_META[catOf("user", u.accountType)].label}</b>.
        </>
      ),
      confirmLabel: makeAdmin ? "Make admin" : "Remove admin",
      danger: !makeAdmin,
      onConfirm: () => {
        setBusyId(u.id);
        startTransition(async () => {
          const res = await setUserRole(u.id, makeAdmin ? "admin" : "user");
          if (res.ok) {
            patchRow(u.id, { role: makeAdmin ? "admin" : "user" });
            if (res.stats) setStats(res.stats);
            flash(true, makeAdmin ? "Admin access granted." : "Admin access removed.");
          } else {
            flash(false, res.error ?? "Could not update.");
          }
          setBusyId(null);
          setConfirm(null);
        });
      },
    });
  };

  const askDelete = (u: AdminUser) => {
    setConfirm({
      title: "Delete this user?",
      danger: true,
      message: (
        <>
          <b>{u.fullName || u.email || "This user"}</b> and their sign-in access
          will be permanently removed. This cannot be undone. (Any properties they
          listed stay in the system.)
        </>
      ),
      confirmLabel: "Delete user",
      onConfirm: () => {
        setBusyId(u.id);
        startTransition(async () => {
          const res = await deleteUser(u.id);
          if (res.ok) {
            setRows((rs) => rs.filter((r) => r.id !== u.id));
            setCount((c) => Math.max(0, c - 1));
            if (res.stats) setStats(res.stats);
            flash(true, "User deleted.");
          } else {
            flash(false, res.error ?? "Could not delete.");
          }
          setBusyId(null);
          setConfirm(null);
        });
      },
    });
  };

  const from = count === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, count);

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Users</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Manage everyone on the platform — roles, access and accounts.
          </p>
        </div>
        {count > 0 && (
          <ExportButton
            filename="users"
            columns={USER_COLUMNS}
            rows={fetchAllForExport}
          />
        )}
      </div>

      {/* Stat cards (also act as category filters) */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {STAT_CARDS.map((c) => {
          const Icon = c.icon;
          const isActive = category === c.category;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => pickCategory(c.category)}
              className={`flex flex-col items-start rounded-2xl border p-4 text-left transition ${
                isActive
                  ? "border-slate-900 bg-slate-900/3 ring-1 ring-slate-900"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <Icon className={`h-4 w-4 ${c.accent}`} />
                {c.label}
              </span>
              <span className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">
                {stats[c.key].toLocaleString("en-IN")}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search + active-filter row */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search by name, email or phone…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
          />
        </div>
        {category && (
          <button
            type="button"
            onClick={() => pickCategory(null)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <X className="h-3.5 w-3.5" />
            Clear {CATEGORY_META[category].label} filter
          </button>
        )}
      </div>

      {/* ── Desktop table (md+) ── */}
      <div
        className={`hidden overflow-x-auto rounded-xl border border-slate-200 transition-opacity md:block ${
          pending ? "opacity-60" : ""
        }`}
      >
        <table className="w-full min-w-215 border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Account type</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                  No users match your search.
                </td>
              </tr>
            ) : (
              rows.map((u) => {
                const isSelf = u.id === currentUserId;
                const busy = busyId === u.id;
                return (
                  <tr key={u.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar user={u} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 font-medium text-slate-900">
                            <span className="truncate">
                              {u.fullName || "Unnamed"}
                            </span>
                            {isSelf && (
                              <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                                You
                              </span>
                            )}
                          </div>
                          <div className="truncate text-xs text-slate-400">
                            {u.email || "—"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <ContactLinks user={u} />
                    </td>
                    <td className="px-4 py-3">
                      <CategoryBadge category={u.category} />
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        inline
                        value={u.accountType}
                        disabled={busy || u.role === "admin"}
                        onChange={(e) =>
                          askAccountType(u, e.target.value as AccountType)
                        }
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 outline-none disabled:opacity-50"
                      >
                        <option value="user">User</option>
                        <option value="agent">Agent</option>
                        <option value="owner">Owner</option>
                      </Select>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <RoleButton u={u} isSelf={isSelf} busy={busy} onClick={() => askRole(u)} />
                        <button
                          type="button"
                          disabled={busy || isSelf}
                          onClick={() => askDelete(u)}
                          title={isSelf ? "You can't delete yourself" : "Delete user"}
                          className="rounded-md p-2 text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Mobile / tablet cards (< md) ── */}
      <div className={`space-y-3 md:hidden ${pending ? "opacity-60" : ""}`}>
        {rows.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500">
            No users match your search.
          </div>
        ) : (
          rows.map((u) => {
            const isSelf = u.id === currentUserId;
            const busy = busyId === u.id;
            return (
              <div
                key={u.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <Avatar user={u} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate font-semibold text-slate-900">
                        {u.fullName || "Unnamed"}
                      </span>
                      {isSelf && (
                        <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                          You
                        </span>
                      )}
                    </div>
                    <div className="truncate text-xs text-slate-400">
                      {u.email || "—"}
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <CategoryBadge category={u.category} />
                      <span className="text-xs text-slate-400">
                        Joined {formatDate(u.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <ContactLinks user={u} />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                  <Select
                    inline
                    value={u.accountType}
                    disabled={busy || u.role === "admin"}
                    onChange={(e) => askAccountType(u, e.target.value as AccountType)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700 outline-none disabled:opacity-50"
                  >
                    <option value="user">User</option>
                    <option value="agent">Agent</option>
                    <option value="owner">Owner</option>
                  </Select>

                  <div className="ml-auto flex items-center gap-1.5">
                    <RoleButton u={u} isSelf={isSelf} busy={busy} labelled onClick={() => askRole(u)} />
                    <button
                      type="button"
                      disabled={busy || isSelf}
                      onClick={() => askDelete(u)}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer: range + pagination */}
      <div className="mt-5 flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-sm text-slate-500">
          {count > 0
            ? `Showing ${from.toLocaleString("en-IN")}–${to.toLocaleString(
                "en-IN"
              )} of ${count.toLocaleString("en-IN")}`
            : "No results"}
        </p>

        {totalPages > 1 && (
          <nav className="flex flex-wrap items-center gap-1.5">
            <PagerButton
              disabled={page <= 1 || pending}
              onClick={() => load(page - 1, currentFilter())}
            >
              <ChevronLeft className="h-4 w-4" />
            </PagerButton>

            {pageWindow(page, totalPages).map((p, i) =>
              p === "…" ? (
                <span key={`e${i}`} className="px-1.5 text-slate-400">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  disabled={pending}
                  onClick={() => load(p, currentFilter())}
                  className={`h-9 min-w-9 rounded-lg border px-3 text-sm font-medium transition-colors ${
                    p === page
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {p}
                </button>
              )
            )}

            <PagerButton
              disabled={page >= totalPages || pending}
              onClick={() => load(page + 1, currentFilter())}
            >
              <ChevronRight className="h-4 w-4" />
            </PagerButton>
          </nav>
        )}
      </div>

      {/* Confirmation modal */}
      {confirm && (
        <ConfirmDialog
          confirm={confirm}
          busy={busyId !== null}
          onClose={() => setConfirm(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0">
          <div
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-lg ${
              toast.ok ? "bg-slate-900" : "bg-red-600"
            }`}
          >
            {toast.ok ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            {toast.text}
          </div>
        </div>
      )}
    </div>
  );
}

// ───────────────────────────── small pieces ─────────────────────────────

function Avatar({ user }: { user: AdminUser }) {
  if (user.avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={user.avatarUrl}
        alt={user.fullName || "User"}
        className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-slate-200"
      />
    );
  }
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
      {initials(user.fullName, user.email)}
    </span>
  );
}

function ContactLinks({ user }: { user: AdminUser }) {
  return (
    <div className="flex items-center gap-1.5">
      {user.email ? (
        <a
          href={`mailto:${user.email}`}
          title={user.email}
          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
        >
          <Mail className="h-3.5 w-3.5" />
          Email
        </a>
      ) : null}
      {user.phone ? (
        <a
          href={`tel:${user.phone}`}
          title={user.phone}
          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
        >
          <Phone className="h-3.5 w-3.5" />
          Call
        </a>
      ) : null}
      {!user.email && !user.phone && <span className="text-xs text-slate-400">—</span>}
    </div>
  );
}

function RoleButton({
  u,
  isSelf,
  busy,
  labelled,
  onClick,
}: {
  u: AdminUser;
  isSelf: boolean;
  busy: boolean;
  labelled?: boolean;
  onClick: () => void;
}) {
  const isAdmin = u.role === "admin";
  return (
    <button
      type="button"
      disabled={busy || isSelf}
      onClick={onClick}
      title={
        isSelf
          ? "You can't change your own access"
          : isAdmin
            ? "Remove admin access"
            : "Make admin"
      }
      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-30 ${
        isAdmin
          ? "text-amber-700 hover:bg-amber-50"
          : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      {isAdmin ? <ShieldOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
      {labelled && <span>{isAdmin ? "Remove admin" : "Make admin"}</span>}
    </button>
  );
}

function PagerButton({
  disabled,
  onClick,
  children,
}: {
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex h-9 min-w-9 items-center justify-center rounded-lg border border-slate-200 px-2 text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
