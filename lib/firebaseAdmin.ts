import { cert, getApps, initializeApp } from "firebase-admin/app";
import { DecodedIdToken, getAuth } from "firebase-admin/auth";

const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const projectId = process.env.FIREBASE_PROJECT_ID;

if (!privateKey || !clientEmail || !projectId) {
  throw new Error("Missing Firebase Admin environment variables.");
}

const app =
  getApps()[0] ??
  initializeApp({
    credential: cert({
      privateKey,
      clientEmail,
      projectId,
    }),
  });

export const adminAuth = getAuth(app);

export function extractBearerToken(headerValue?: string | null) {
  if (!headerValue) return null;
  const [scheme, token] = headerValue.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
}

export async function verifyAuthHeader(
  authorization?: string | null,
): Promise<DecodedIdToken> {
  const token = extractBearerToken(authorization);
  if (!token) {
    throw Object.assign(new Error("Missing bearer token"), {
      status: 401,
    });
  }

  try {
    return await adminAuth.verifyIdToken(token);
  } catch (error) {
    throw Object.assign(error instanceof Error ? error : new Error("Unauthorized"), {
      status: 401,
    });
  }
}
