import { NextResponse } from "next/server";
import { verifyAuthHeader } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const decodedToken = await verifyAuthHeader(
      request.headers.get("authorization"),
    );

    return NextResponse.json({
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name ?? decodedToken.email,
      picture: decodedToken.picture,
      emailVerified: decodedToken.email_verified,
    });
  } catch (error) {
    const status = (error as { status?: number }).status ?? 401;
    const message =
      (error as Error).message || "Unable to load authenticated user.";

    return NextResponse.json({ error: message }, { status });
  }
}
