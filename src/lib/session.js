// Session storage and token handling shared by the API layer and the
// guest-login component. Everything here runs in the browser only.

export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "https://api.flonxapp.com"
).replace(/\/+$/, "");
export const API_BASE = `${API_URL}/api/v1`;

const KEYS = {
  access: "accessToken",
  refresh: "refreshToken",
  role: "authRole", // "guest" | "bartender"
  deviceId: "deviceId",
  guestSecret: "guestSecret",
};

const isBrowser = () => typeof window !== "undefined";

const read = (key) => (isBrowser() ? localStorage.getItem(key) : null);
const write = (key, value) => {
  if (!isBrowser()) return;
  if (value) localStorage.setItem(key, value);
  else localStorage.removeItem(key);
};

export const getAccessToken = () => read(KEYS.access);
export const getAuthRole = () => read(KEYS.role);

export const saveSession = ({ accessToken, refreshToken, role }) => {
  write(KEYS.access, accessToken);
  write(KEYS.refresh, refreshToken);
  write(KEYS.role, role);
};

export const clearSession = () => {
  write(KEYS.access, null);
  write(KEYS.refresh, null);
  write(KEYS.role, null);
};

const post = async (path, body) => {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data: json?.data };
};

// Logs this device in as a guest. The server issues a secret on the first
// login, which proves the device on later logins. If the secret is rejected
// (lost or from an old session), a fresh guest account is started once.
let guestLoginInFlight = null;
export const loginAsGuest = () => {
  if (guestLoginInFlight) return guestLoginInFlight;
  guestLoginInFlight = (async () => {
    for (let attempt = 0; attempt < 2; attempt++) {
      let deviceId = read(KEYS.deviceId);
      if (!deviceId) {
        deviceId = crypto.randomUUID();
        write(KEYS.deviceId, deviceId);
      }
      const guestSecret = read(KEYS.guestSecret);
      const res = await post("/auth/guest", {
        deviceId,
        ...(guestSecret ? { guestSecret } : {}),
      });
      if (res.ok && res.data?.accessToken) {
        if (res.data.guestSecret) write(KEYS.guestSecret, res.data.guestSecret);
        saveSession({
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
          role: "guest",
        });
        return true;
      }
      if (res.status !== 401) return false;
      write(KEYS.deviceId, null);
      write(KEYS.guestSecret, null);
    }
    return false;
  })().finally(() => {
    guestLoginInFlight = null;
  });
  return guestLoginInFlight;
};

// Exchanges the refresh token for a new access token.
const refreshAccessToken = async () => {
  const refreshToken = read(KEYS.refresh);
  if (!refreshToken) return false;
  const res = await post("/auth/refresh-token", { refreshToken });
  if (res.ok && res.data?.accessToken) {
    write(KEYS.access, res.data.accessToken);
    return true;
  }
  return false;
};

// Called after a 401. Returns true when a new access token is available.
// Guests fall back to a fresh guest login; a bartender whose session can't
// be refreshed must log in again.
let renewInFlight = null;
export const renewSession = () => {
  if (renewInFlight) return renewInFlight;
  renewInFlight = (async () => {
    if (await refreshAccessToken()) return true;
    const wasBartender = getAuthRole() === "bartender";
    clearSession();
    return wasBartender ? false : loginAsGuest();
  })().finally(() => {
    renewInFlight = null;
  });
  return renewInFlight;
};

// Make sure a customer (guest) session exists, e.g. when a visitor lands
// directly on a venue page from a QR code. A logged-in bartender is kept.
export const ensureSession = async () => {
  if (getAccessToken()) return true;
  return loginAsGuest();
};
