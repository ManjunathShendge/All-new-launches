import { createServiceRoleClient } from "@/lib/supabase/service-role";

export { ADMIN_USERS_PAGE_SIZE } from "./constants";

/**
 * A person's bucket in the admin Users console. Mutually exclusive and always
 * summing to the total: an admin is counted as "admin" regardless of their
 * account_type, everyone else falls into agent / owner / user.
 */
export type UserCategory = "user" | "agent" | "owner" | "admin";

export interface AdminUser {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  /** Raw account_type from the profile (user / agent / owner). */
  accountType: string;
  /** "admin" or "user". */
  role: string;
  category: UserCategory;
  avatarUrl: string | null;
  createdAt: string | null;
}

export interface AdminUserFilter {
  /** Free-text match against name, email or phone. */
  search?: string;
  category?: UserCategory;
}

export interface AdminUserPage {
  rows: AdminUser[];
  count: number;
}

export interface UserStats {
  total: number;
  users: number;
  agents: number;
  owners: number;
  admins: number;
}

const USER_COLUMNS =
  "id, full_name, email, phone, account_type, role, avatar_url, created_at";

function categoryOf(role: string, accountType: string): UserCategory {
  if (role === "admin") return "admin";
  if (accountType === "agent") return "agent";
  if (accountType === "owner") return "owner";
  return "user";
}

function toAdminUser(r: Record<string, unknown>): AdminUser {
  const role = ((r.role as string | null) || "user").toLowerCase();
  const accountType = ((r.account_type as string | null) || "user").toLowerCase();
  return {
    id: r.id as string,
    fullName: (r.full_name as string | null) || null,
    email: (r.email as string | null) || null,
    phone: (r.phone as string | null) || null,
    accountType,
    role,
    category: categoryOf(role, accountType),
    avatarUrl: (r.avatar_url as string | null) || null,
    createdAt: (r.created_at as string | null) || null,
  };
}

/**
 * Head counts per bucket for the stat cards. Buckets are mutually exclusive
 * (admins are excluded from agent/owner) and `users` is derived by subtraction
 * so the four buckets always add up to `total`.
 */
export async function getUserStats(): Promise<UserStats> {
  const db = createServiceRoleClient();

  const head = (build: (q: any) => any): Promise<number> =>
    build(db.from("profiles").select("id", { count: "exact", head: true })).then(
      (res: { count: number | null }) => res.count ?? 0
    );

  const [total, admins, agents, owners] = await Promise.all([
    head((q) => q),
    head((q) => q.eq("role", "admin")),
    head((q) => q.eq("account_type", "agent").neq("role", "admin")),
    head((q) => q.eq("account_type", "owner").neq("role", "admin")),
  ]);

  const users = Math.max(0, total - admins - agents - owners);
  return { total, users, agents, owners, admins };
}

/** Apply the mutually-exclusive category filter to a profiles query. */
function applyCategory(query: any, category: UserCategory) {
  switch (category) {
    case "admin":
      return query.eq("role", "admin");
    case "agent":
      return query.eq("account_type", "agent").neq("role", "admin");
    case "owner":
      return query.eq("account_type", "owner").neq("role", "admin");
    case "user":
      // Everyone who isn't an admin, agent or owner.
      return query
        .neq("role", "admin")
        .not("account_type", "in", "(agent,owner)");
  }
}

/**
 * One page of users for the admin console, newest first, with the total match
 * count for pagination. Service-role so it isn't limited by per-user RLS.
 */
export async function getAdminUsersPage(
  page: number,
  pageSize: number,
  filter: AdminUserFilter = {}
): Promise<AdminUserPage> {
  const db = createServiceRoleClient();

  let query = db
    .from("profiles")
    .select(USER_COLUMNS, { count: "exact" })
    .order("created_at", { ascending: false });

  if (filter.category) query = applyCategory(query, filter.category);

  if (filter.search) {
    const term = filter.search.replace(/[%,()]/g, " ").trim();
    if (term) {
      query = query.or(
        `full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`
      );
    }
  }

  const safePage = Math.max(1, page);
  const from = (safePage - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query.range(from, to);
  if (error || !data) return { rows: [], count: 0 };

  return {
    rows: (data as Record<string, unknown>[]).map(toAdminUser),
    count: count ?? 0,
  };
}
