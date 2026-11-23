import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  API_BASE,
  ensureSession,
  getAccessToken,
  renewSession,
} from "@/lib/session";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE,
  prepareHeaders: (headers) => {
    const token = getAccessToken();
    if (token) headers.set("Authorization", token);
    return headers;
  },
});

// - before the first request, make sure there is a session (a visitor who
//   opens a venue link directly gets a guest session)
// - on 401 (expired token) renew the session once and retry the request
const baseQueryWithSession = async (args, api, extraOptions) => {
  if (typeof window !== "undefined" && !getAccessToken()) {
    await ensureSession();
  }
  let result = await rawBaseQuery(args, api, extraOptions);
  if (result.error?.status === 401 && (await renewSession())) {
    result = await rawBaseQuery(args, api, extraOptions);
  }
  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithSession,
  tagTypes: [
    "Orders",
    "SingleOrder",
    "Payment",
    "venue",
    "updateProfile",
    "host",
    "videos",
  ],
  endpoints: () => ({}),
});

export default baseApi;
