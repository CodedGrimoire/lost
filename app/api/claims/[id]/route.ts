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
    // JWT format: header.payload.signature
    // The payload contains the user_id in the 'sub' or 'user_id' field
    const parts = token.split(".");
    if (parts.length === 3) {
      // Decode the payload (base64url)
      const payload = JSON.parse(
        Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString()
      );
      // Firebase uses 'user_id' or 'sub' for the UID
      return payload.user_id || payload.sub || null;
    }
  } catch (error) {
    console.error("Error decoding token:", error);
  }
  
  return null;
}

// Helper to get user email from token
async function getUserEmailFromToken(token: string): Promise<string | null> {
  if (token.startsWith("demo_")) {
    return null;
  }
  
  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(
        Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString()
      );
      return payload.email || null;
    }
  } catch (error) {
    console.error("Error decoding token for email:", error);
  }
  
  return null;
}

// PATCH /api/claims/:id - Approve or reject a claim
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
    const body = await request.json();
    const { status, meetupAddress } = body;

    if (!status || !["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "status must be 'approved' or 'rejected'" },
        { status: 400 }
      );
    }

    // If approving, meetupAddress is required
    if (status === "approved" && !meetupAddress) {
      return NextResponse.json(
        { error: "meetupAddress is required when approving a claim" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Get the claim
    const { ObjectId } = await import("mongodb");
    const claim = await db.collection("claims").findOne({
      _id: new ObjectId(claimId),
    });

    if (!claim) {
      return NextResponse.json(
        { error: "Claim not found" },
        { status: 404 }
      );
    }

    // Verify the user is the finder (reporter) of the item
    const item = await db.collection("items").findOne({
      _id: typeof claim.itemId === "string" ? new ObjectId(claim.itemId) : claim.itemId,
    });

    if (!item) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    // Check if user is the reporter
    // Match by Firebase UID (reportedBy) or by email
    const userEmail = await getUserEmailFromToken(token);
    const isReporter = 
      (item.reportedBy && userId && item.reportedBy === userId) ||
      (item.reporter?.email && userEmail && item.reporter.email === userEmail);

    if (!isReporter) {
      return NextResponse.json(
        { error: "Only the item finder can approve/reject claims" },
        { status: 403 }
      );
    }

    // If approving, ensure no other approved claims exist for this item
    if (status === "approved") {
      const existingApproved = await db.collection("claims").findOne({
        itemId: claim.itemId,
        status: "approved",
        _id: { $ne: new ObjectId(claimId) },
      });

      if (existingApproved) {
        return NextResponse.json(
          { error: "Another claim has already been approved for this item" },
          { status: 400 }
        );
      }

      // Update claim to approved with meetup address
      await db.collection("claims").updateOne(
        { _id: new ObjectId(claimId) },
        { $set: { status: "approved", meetupAddress: meetupAddress } }
      );

      // Update item to claimed and approved (this marks it as matched)
      await db.collection("items").updateOne(
        { _id: typeof claim.itemId === "string" ? new ObjectId(claim.itemId) : claim.itemId },
        {
          $set: {
            claimed: true,
            claimedBy: claim.claimedBy,
            approved: true, // Flag that owner approved this claim (matched item)
          },
        }
      );

      // Reject all other pending claims for this item
      const rejectedClaims = await db.collection("claims")
        .find({
          itemId: claim.itemId,
          status: "pending",
          _id: { $ne: new ObjectId(claimId) },
        })
        .toArray();

      await db.collection("claims").updateMany(
        {
          itemId: claim.itemId,
          status: "pending",
          _id: { $ne: new ObjectId(claimId) },
        },
        { $set: { status: "rejected" } }
      );

      // Create notifications for rejected claimers
      const now = new Date();
      for (const rejectedClaim of rejectedClaims) {
        const notification = {
          userId: rejectedClaim.claimedBy,
          type: "claim_rejected" as const,
          itemId: typeof claim.itemId === "string" ? claim.itemId : claim.itemId.toString(),
          itemTitle: claim.itemTitle,
          message: `Your claim for ${claim.itemTitle} was rejected`,
          read: false,
          createdAt: now,
        };
        await db.collection("notifications").insertOne(notification);
      }

      // Create notification for approved claimer
      const approvedNotification = {
        userId: claim.claimedBy,
        type: "claim_approved" as const,
        itemId: typeof claim.itemId === "string" ? claim.itemId : claim.itemId.toString(),
        itemTitle: claim.itemTitle,
        message: `Your claim for ${claim.itemTitle} was approved. Meetup address: ${meetupAddress}`,
        read: false,
        createdAt: now,
      };
      await db.collection("notifications").insertOne(approvedNotification);
    } else {
      // Reject the claim
      await db.collection("claims").updateOne(
        { _id: new ObjectId(claimId) },
        { $set: { status: "rejected" } }
      );
      // Do NOT modify the item

      // Create notification for rejected claimer
      const now = new Date();
      const notification = {
        userId: claim.claimedBy,
        type: "claim_rejected" as const,
        itemId: typeof claim.itemId === "string" ? claim.itemId : claim.itemId.toString(),
        itemTitle: claim.itemTitle,
        message: `Your claim for ${claim.itemTitle} was rejected`,
        read: false,
        createdAt: now,
      };
      await db.collection("notifications").insertOne(notification);
    }

    // Return updated claim
    const updatedClaim = await db.collection("claims").findOne({
      _id: new ObjectId(claimId),
    });

    return NextResponse.json(updatedClaim);
  } catch (error) {
    console.error("Error updating claim:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
