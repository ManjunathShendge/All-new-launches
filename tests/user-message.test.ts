import { describe, it, expect, vi, beforeEach } from "vitest";
import { getUserErrorMessage } from "@/lib/errors/user-message";

// The mapper logs the raw error server-side; silence it in tests.
beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("getUserErrorMessage", () => {
  it("maps a Postgres unique-violation code to friendly copy", () => {
    expect(
      getUserErrorMessage({
        code: "23505",
        message: 'duplicate key value violates unique constraint "properties_slug_key"',
      })
    ).toBe("This already exists.");
  });

  it("maps a code-less RLS message (repos that rethrow new Error)", () => {
    expect(
      getUserErrorMessage(
        new Error('new row violates row-level security policy for table "properties"')
      )
    ).toBe("You don't have permission to do that.");
  });

  it("maps a not-null violation", () => {
    expect(
      getUserErrorMessage(
        new Error('null value in column "title" violates not-null constraint')
      )
    ).toBe("Please fill in all the required fields.");
  });

  it("translates Supabase auth 'Invalid login credentials'", () => {
    expect(getUserErrorMessage({ message: "Invalid login credentials" })).toBe(
      "Incorrect email or password."
    );
  });

  it("translates the auth rate-limit message", () => {
    expect(
      getUserErrorMessage(
        "For security purposes, you can only request this after 45 seconds"
      )
    ).toBe("Too many attempts. Please wait a moment and try again.");
  });

  it("passes a curated, human-readable message through unchanged", () => {
    expect(
      getUserErrorMessage({ message: "Title must be at least 5 characters." })
    ).toBe("Title must be at least 5 characters.");
  });

  it("never leaks a raw/unknown error — uses the fallback", () => {
    expect(
      getUserErrorMessage(new Error("socket hang up"), "Could not save.")
    ).toBe("Could not save.");
  });

  it("uses the generic fallback for a totally unknown throw", () => {
    expect(getUserErrorMessage(undefined)).toBe(
      "Something went wrong. Please try again."
    );
  });

  it("does not leak SQL identifiers even when no rule matches", () => {
    const msg = getUserErrorMessage(
      new Error('relation "leads" does not exist at character 42')
    );
    expect(msg).not.toMatch(/relation|leads|character/i);
  });
});
