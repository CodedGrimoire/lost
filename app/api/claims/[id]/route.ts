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

// PATCH /api/claims/:id - Approve or reject a claim
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const claimId = params.id;
    const body = await request.json();
    const { status } = body;

    if (!status || !["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "status must be 'approved' or 'rejected'" },
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

    const isReporter = item.reportedBy === userId || 
                      (item.reporter?.email && token.includes(item.reporter.email));

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

      // Update claim to approved
      await db.collection("claims").updateOne(
        { _id: new ObjectId(claimId) },
        { $set: { status: "approved" } }
      );

      // Update item to claimed
      await db.collection("items").updateOne(
        { _id: typeof claim.itemId === "string" ? new ObjectId(claim.itemId) : claim.itemId },
        {
          $set: {
            claimed: true,
            claimedBy: claim.claimedBy,
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
        message: `Your claim for ${claim.itemTitle} was approved`,
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
