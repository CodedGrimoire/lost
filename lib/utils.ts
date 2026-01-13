export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function getAuthTokenFromCookie() {
  if (typeof document === "undefined") return "";
  const match = document.cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((entry) => entry.startsWith("auth_token="));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : "";
}

export function setAuthTokenCookie(token: string) {
  if (typeof document === "undefined") return;
  document.cookie = `auth_token=${encodeURIComponent(token)}; path=/; max-age=${
    60 * 60 * 24 * 7
  }`;
}

// Server-side cookie setter for NextResponse
export function setAuthTokenCookieInResponse(
  response: Response,
  token: string
) {
  const cookieValue = `auth_token=${encodeURIComponent(token)}; path=/; max-age=${
    60 * 60 * 24 * 7
  }; SameSite=Lax; HttpOnly`;
  response.headers.append("Set-Cookie", cookieValue);
}

export function clearAuthTokenCookie() {
  if (typeof document === "undefined") return;
  document.cookie = "auth_token=; path=/; max-age=0";
}
