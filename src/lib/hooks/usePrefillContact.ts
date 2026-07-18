"use client";

import { useEffect } from "react";
import {
  getMyContactInfo,
  type MyContactInfo,
} from "@/lib/actions/contact-info.action";

/**
 * Runs `apply` once with the signed-in user's contact details (name/email/phone)
 * so lead forms can prefill. No-op for guests. The state update happens inside
 * the async callback, so it's never a synchronous set-state in an effect.
 */
export function usePrefillContact(apply: (info: MyContactInfo) => void) {
  useEffect(() => {
    let active = true;
    getMyContactInfo()
      .then((me) => {
        if (active && me) apply(me);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
    // Intentionally run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
