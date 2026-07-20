// Client-safe constants (no server-only imports), shared by the admin console
// UI and the server queries/actions.
export const ADMIN_PROPERTIES_PAGE_SIZE = 50;
export const ADMIN_USERS_PAGE_SIZE = 25;

// Activity-log source types. Kept here (client-safe) so the client feed can
// reference them without pulling in the server-only activity queries.
export type ActivityType = "login" | "signup" | "property" | "lead" | "event";
export const ACTIVITY_TYPES: ActivityType[] = [
  "login",
  "signup",
  "property",
  "lead",
  "event",
];
