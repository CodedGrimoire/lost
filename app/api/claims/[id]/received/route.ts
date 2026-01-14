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

// PATCH /api/claims/:id/received - Mark claim as received and delete item
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

    const { id: claimId } = await params;
    const client = await clientPromise;
    const db = client.db();
    const { ObjectId } = await import("mongodb");

    // Get the claim
    const claim = await db.collection("claims").findOne({
      _id: new ObjectId(claimId),
    });

    if (!claim) {
      return NextResponse.json(
        { error: "Claim not found" },
        { status: 404 }
      );
    }

    // Verify the user is the claimer
    if (claim.claimedBy !== userId) {
      return NextResponse.json(
        { error: "Only the claimer can mark this as received" },
        { status: 403 }
      );
    }

    // Verify claim is approved
    if (claim.status !== "approved") {
      return NextResponse.json(
        { error: "Only approved claims can be marked as received" },
        { status: 400 }
      );
    }

    // Update claim status to received with timestamp (don't delete item yet - will be cleaned up after 1 week)
    const now = new Date();
    await db.collection("claims").updateOne(
      { _id: new ObjectId(claimId) },
      { $set: { status: "received", receivedAt: now } }
    );

    // Note: Item is NOT deleted immediately. It will be cleaned up by the cleanup job after 1 week.
    // This allows the matched items to be shown on the landing page for a week.

    // Return success
    return NextResponse.json(
      { success: true, message: "Item received and removed from listings" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error marking claim as received:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
