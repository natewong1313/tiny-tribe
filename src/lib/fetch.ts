import { headers } from "vinext/shims/headers";

export const fetchWithSession = (input: RequestInfo | URL, init?: RequestInit) => {
  const cookie = headers().get("cookie");
  const mergedHeaders = new Headers(init?.headers);
  if (cookie) {
    mergedHeaders.set("cookie", cookie);
  }

  return fetch(input, {
    ...init,
    headers: mergedHeaders,
  });
};
