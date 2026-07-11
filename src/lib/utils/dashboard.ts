export type Profile = {
  account_type: "user" | "agent" | "owner";
  role: "admin" | "user";
};

export function getDashboardRoute(profile: Profile | null) {
  if (!profile) return "/";

  if (profile.role === "admin") return "/admin/dashboard";

  switch (profile.account_type) {
    case "agent":
      return "/agent/dashboard";

    case "owner":
      return "/owner/dashboard";

    default:
      return "/profile";
  }
}

export function getDashboardLabel(profile: Profile | null) {
  if (!profile) return "Dashboard";

  if (profile.role === "admin") return "Admin Dashboard";

  return profile.account_type === "user"
    ? "Profile"
    : "Dashboard";
}