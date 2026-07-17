"use client";

import { registerAdminFcmDevice } from "@/lib/firebase/messaging";
import { useEffect, useRef } from "react";

/**
 * Registers admin browser FCM token after authenticated session is active.
 */
export default function FcmRegistration() {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    registerAdminFcmDevice().catch((err) => {
      console.warn("[FCM] Admin device registration failed:", err);
    });
  }, []);

  return null;
}
