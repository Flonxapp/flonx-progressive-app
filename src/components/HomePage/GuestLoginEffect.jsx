"use client";

import { useEffect } from "react";
import { ensureSession } from "@/lib/session";

// Mounted once in the root layout: gives every visitor a guest session as
// soon as the app opens (a logged-in bartender session is kept).
export default function GuestLoginEffect() {
  useEffect(() => {
    ensureSession().catch(() => {
      // offline or server down; the API layer retries on the next request
    });
  }, []);

  return null;
}
