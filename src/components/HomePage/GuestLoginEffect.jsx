"use client";

import { useEffect } from "react";
import { useGuestUserMutation } from "@/redux/Api/userApi";

const DEVICE_ID_KEY = "deviceId";
const GUEST_SECRET_KEY = "guestSecret";
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

export default function GuestLoginEffect() {
  const [guestLogin] = useGuestUserMutation();

  useEffect(() => {
    const handleGuestLogin = async () => {
      try {
        let deviceId = localStorage.getItem(DEVICE_ID_KEY);
        if (!deviceId) {
          deviceId = crypto.randomUUID();
          localStorage.setItem(DEVICE_ID_KEY, deviceId);
        }
        const guestSecret = localStorage.getItem(GUEST_SECRET_KEY);

        const res = await guestLogin({
          deviceId,
          ...(guestSecret ? { guestSecret } : {}),
        }).unwrap();

        // the server sends a secret on first login; it proves this device later
        if (res?.data?.guestSecret) {
          localStorage.setItem(GUEST_SECRET_KEY, res.data.guestSecret);
        }
        if (res?.data?.accessToken) {
          localStorage.setItem(ACCESS_TOKEN_KEY, res.data.accessToken);
        }
        if (res?.data?.refreshToken) {
          localStorage.setItem(REFRESH_TOKEN_KEY, res.data.refreshToken);
        }
      } catch (err) {
        // secret lost or invalid: start a fresh guest session
        if (err?.status === 401) {
          localStorage.removeItem(DEVICE_ID_KEY);
          localStorage.removeItem(GUEST_SECRET_KEY);
        }
        console.error("Guest login failed", err?.data?.message || err);
      }
    };

    handleGuestLogin();
  }, [guestLogin]);

  return null;
}
