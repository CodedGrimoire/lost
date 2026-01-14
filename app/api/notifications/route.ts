import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getAuthTokenFromRequest } from "@/lib/utils";

export const runtime = "nodejs";

// Helper to get user UID from token
async function getUserIdFromToken(token: string): Promise<string | null> {
  if (token.startsWith("demo_")) {
    return token;
  }
  return token;
}

// GET /api/notifications - Get notifications for current user
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

    // Get notifications for this user, sorted by createdAt desc
    const notifications = await db.collection("notifications")
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
