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

// PATCH /api/notifications/:id/read - Mark notification as read
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: notificationId } = await params;
    const client = await clientPromise;
    const db = client.db();

    const { ObjectId } = await import("mongodb");

    // Verify the notification belongs to the user
    const notification = await db.collection("notifications").findOne({
      _id: new ObjectId(notificationId),
      userId,
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    // Mark as read
    await db.collection("notifications").updateOne(
      { _id: new ObjectId(notificationId) },
      { $set: { read: true } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
