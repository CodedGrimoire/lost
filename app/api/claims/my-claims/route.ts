import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getAuthTokenFromRequest } from "@/lib/utils";

export const runtime = "nodejs";

// Helper to get user UID from token
async function getUserIdFromToken(token: string): Promise<string | null> {
  // For demo tokens
  if (token.startsWith("demo_")) {
    return token;
  }
  
  // Firebase ID tokens are JWTs - decode to get UID
  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(
        Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString()
      );
      return payload.user_id || payload.sub || null;
    }
  } catch (error) {
    console.error("Error decoding token:", error);
  }
  
  return null;
}

// GET /api/claims/my-claims - Get all claims made by the current user
export async function GET(request: NextRequest) {
  try {
    const token = getAuthTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = await getUserIdFromToken(token);
    if (!userId) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Get all claims made by this user
    const claims = await db.collection("claims")
      .find({ claimedBy: userId })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(claims);
  } catch (error) {
    console.error("Error fetching user claims:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
