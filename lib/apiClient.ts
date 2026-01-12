import { getAuthTokenFromCookie } from "./utils";

const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

type RequestOptions = {
  body?: unknown;
  headers?: HeadersInit;
  authenticated?: boolean;
  credentials?: RequestCredentials;
};

async function request<T>(
  path: string,
  method: HttpMethod,
  options: RequestOptions = {},
): Promise<T> {
  const url = baseUrl
    ? path.startsWith("http")
      ? path
      : path.startsWith("/")
        ? `${baseUrl}${path}`
        : `${baseUrl}/${path}`
    : path.startsWith("http")
      ? path
      : path.startsWith("/")
        ? path
        : `/${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (options.authenticated) {
    const token = getAuthTokenFromCookie();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: options.credentials ?? "include",
  });

  const contentType = response.headers.get("content-type");
  const payload = contentType?.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "string"
        ? payload
        : payload?.error || payload?.message || "Request failed";
    throw new Error(message);
  }

  return payload as T;
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, "GET", options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, "POST", { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, "PUT", { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, "PATCH", { ...options, body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, "DELETE", options),
};
