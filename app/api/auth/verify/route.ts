import { NextResponse } from "next/server";
import { verifyAuthHeader } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const decodedToken = await verifyAuthHeader(
      request.headers.get("authorization"),
    );

    return NextResponse.json({
      uid: decodedToken.uid,
      email: decodedToken.email,
      claims: decodedToken,
    });
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500;
    const message =
      (error as Error).message || "Failed to verify authentication token.";

    return NextResponse.json({ error: message }, { status });
  }
}
