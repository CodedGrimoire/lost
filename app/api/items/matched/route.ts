import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export const runtime = "nodejs";

// GET /api/items/matched - Get items that have claims with status "approved"
export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const { ObjectId } = await import("mongodb");

    // Get all claims with status "approved"
    const approvedClaims = await db.collection("claims")
      .find({
        status: "approved"
      })
      .sort({ createdAt: -1 })
      .limit(6)
      .toArray();

    console.log(`[MATCHED] Found ${approvedClaims.length} claims with status "approved"`);

    if (approvedClaims.length === 0) {
      console.log(`[MATCHED] No approved claims found`);
      return NextResponse.json([]);
    }

    // Get the items for these approved claims
    const matchedItems = [];
    for (const claim of approvedClaims) {
      try {
        // Handle both string and ObjectId itemId
        let itemIdObj;
        if (typeof claim.itemId === "string") {
          itemIdObj = new ObjectId(claim.itemId);
        } else {
          itemIdObj = claim.itemId;
        }

        const item = await db.collection("items").findOne({ 
          _id: itemIdObj,
          status: "found" // Only show found items
        });

        if (item) {
          matchedItems.push({
            ...item,
            _id: item._id.toString(),
            matchedAt: claim.createdAt 
              ? (typeof claim.createdAt === "string" 
                  ? claim.createdAt 
                  : new Date(claim.createdAt).toISOString())
              : new Date().toISOString(),
            claimerId: claim.claimedBy,
            claimMessage: claim.message,
            meetupAddress: claim.meetupAddress,
          });
          console.log(`[MATCHED] Added item: ${item.title} (claim approved)`);
        }
      } catch (err) {
        console.error(`[MATCHED] Error fetching item for claim ${claim._id}:`, err);
      }
    }

    console.log(`[MATCHED] Returning ${matchedItems.length} matched items`);

    return NextResponse.json(matchedItems);
  } catch (error) {
    console.error("[MATCHED] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
