import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export const runtime = "nodejs";

// POST /api/items/cleanup - Clean up items that were received more than 1 week ago
// This should be called periodically (e.g., via cron job or scheduled task)
export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const { ObjectId } = await import("mongodb");

    // Calculate date 1 week ago
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Find all claims with status "received" that are older than 1 week
    const oldReceivedClaims = await db.collection("claims")
      .find({
        status: "received",
        $or: [
          { receivedAt: { $lt: oneWeekAgo } },
          { receivedAt: { $exists: false }, createdAt: { $lt: oneWeekAgo } } // Fallback for old claims
        ]
      })
      .toArray();

    let deletedItems = 0;
    let deletedClaims = 0;

    // Delete items and their associated claims
    for (const claim of oldReceivedClaims) {
      try {
        const itemIdObj = typeof claim.itemId === "string" ? new ObjectId(claim.itemId) : claim.itemId;
        
        // Delete the item
        const itemResult = await db.collection("items").deleteOne({ _id: itemIdObj });
        if (itemResult.deletedCount > 0) {
          deletedItems++;
        }

        // Delete all claims for this item
        const claimsResult = await db.collection("claims").deleteMany({ itemId: claim.itemId });
        deletedClaims += claimsResult.deletedCount;
      } catch (err) {
        console.error(`Error deleting item for claim ${claim._id}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      deletedItems,
      deletedClaims,
      message: `Cleaned up ${deletedItems} items and ${deletedClaims} claims older than 1 week`
    });
  } catch (error) {
    console.error("Error cleaning up items:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/items/cleanup - Get stats about items that would be cleaned up
export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db();

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const oldReceivedClaims = await db.collection("claims")
      .find({
        status: "received",
        $or: [
          { receivedAt: { $lt: oneWeekAgo } },
          { receivedAt: { $exists: false }, createdAt: { $lt: oneWeekAgo } } // Fallback for old claims
        ]
      })
      .toArray();

    return NextResponse.json({
      count: oldReceivedClaims.length,
      itemsToDelete: oldReceivedClaims.length,
      oldestClaimDate: oldReceivedClaims.length > 0 
        ? oldReceivedClaims[oldReceivedClaims.length - 1].createdAt 
        : null
    });
  } catch (error) {
    console.error("Error getting cleanup stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
