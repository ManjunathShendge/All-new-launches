/**
 * Translate ANY error — a Supabase PostgrestError, a Supabase AuthError, a plain
 * Error, or an unknown throw — into a short, friendly message that is safe to
 * show an end user. It never leaks SQL, column/table names, RLS policy names,
 * JWTs, or stack traces. The raw error is logged server-side for debugging.
 *
 * Use this at every boundary that returns/shows an error to the user (server
 * actions, the auth service, form catch blocks). Curated messages you write
 * yourself (e.g. "Title must be at least 5 characters.") pass through unchanged.
 */

const GENERIC = "Something went wrong. Please try again.";

interface Loggable {
  code?: string | number;
  message?: string;
  details?: string;
  hint?: string;
  status?: number;
}

// Postgres SQLSTATE codes → friendly copy.
const PG_CODE: Record<string, string> = {
  "23505": "This already exists.",
  "23503": "That refers to something that no longer exists.",
  "23502": "Please fill in all the required fields.",
  "23514": "Some of the details entered aren't valid.",
  "22001": "One of the values is too long.",
  "22003": "One of the numbers entered is out of range.",
  "22P02": "Some of the details entered aren't valid.",
  "42501": "You don't have permission to do that.",
};

// Substrings found in raw Postgres messages — covers repos that throw
// `new Error(error.message)` and lose the SQLSTATE code.
const PG_TEXT: [RegExp, string][] = [
  [/duplicate key value|already exists/i, "This already exists."],
  [
    /row-level security|violates row-level security policy/i,
    "You don't have permission to do that.",
  ],
  [
    /foreign key constraint/i,
    "That refers to something that no longer exists.",
  ],
  [
    /not-null constraint|null value in column/i,
    "Please fill in all the required fields.",
  ],
  [/value too long/i, "One of the values is too long."],
  [/invalid input syntax|invalid text representation/i, "Some of the details entered aren't valid."],
];

// Supabase Auth messages → friendly copy.
const AUTH_TEXT: [RegExp, string][] = [
  [/invalid login credentials/i, "Incorrect email or password."],
  [/email not confirmed/i, "Please verify your email before logging in."],
  [
    /user already registered|already been registered|already exists/i,
    "An account with this email already exists. Please log in.",
  ],
  [/password should be at least/i, "Your password must be at least 6 characters."],
  [
    /for security purposes.*(second|request)|rate limit|too many requests/i,
    "Too many attempts. Please wait a moment and try again.",
  ],
  [/email rate limit exceeded/i, "Too many emails sent. Please wait a few minutes."],
  [
    /token has expired|expired|invalid.*(token|link)/i,
    "This link has expired. Please request a new one.",
  ],
  [
    /new password should be different/i,
    "Your new password must be different from your current one.",
  ],
  [/weak password/i, "Please choose a stronger password."],
];

function match(pairs: [RegExp, string][], text: string): string | null {
  if (!text) return null;
  for (const [re, msg] of pairs) if (re.test(text)) return msg;
  return null;
}

/**
 * A message is only shown verbatim if it reads like an intentionally-written
 * sentence (a message we authored, e.g. "Title must be at least 5 characters."),
 * NOT a raw DB/library/system error. It must:
 *   - be reasonably short,
 *   - start with a capital letter and end with sentence punctuation, and
 *   - contain none of the technical tell-tales below.
 * This deliberately rejects things like "socket hang up", "fetch failed" or
 * "relation ... does not exist" so they fall back to a generic message.
 */
function isSafeFriendly(msg: string): boolean {
  if (!msg || msg.length > 140) return false;
  if (!/^[A-Z].*[.!?]$/.test(msg.trim())) return false;
  return !/constraint|column|relation|syntax|postgres|pgrst|supabase|jwt|json|null value|violates|0x|at line|stack|undefined|\bat\s+\w+\.\w+/i.test(
    msg
  );
}

export function getUserErrorMessage(
  error: unknown,
  fallback: string = GENERIC
): string {
  const e = (error ?? {}) as Loggable;
  const code = e.code != null ? String(e.code) : "";
  const message =
    typeof e.message === "string"
      ? e.message
      : typeof error === "string"
        ? error
        : "";

  // Log the raw error server-side only — never on the client (where it'd sit in
  // the user's console) and never in the returned string.
  if (typeof window === "undefined") {
    console.error("[error]", {
      code: e.code,
      status: e.status,
      message: e.message,
      details: e.details,
      hint: e.hint,
    });
  }

  // 1) Known Postgres SQLSTATE code.
  if (code && PG_CODE[code]) return PG_CODE[code];

  // 2) Supabase Auth message patterns.
  const auth = match(AUTH_TEXT, message);
  if (auth) return auth;

  // 3) Postgres message patterns (for code-less rethrows).
  const pg = match(PG_TEXT, message);
  if (pg) return pg;

  // 4) A curated, human-readable message passes through; otherwise fall back.
  if (isSafeFriendly(message)) return message;

  return fallback;
}
