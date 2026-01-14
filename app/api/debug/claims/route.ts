import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export const runtime = "nodejs";

// GET /api/debug/claims - Debug endpoint to see all claims
export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db();

    // Get all claims
    const claims = await db.collection("claims")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    console.log(`[DEBUG] Found ${claims.length} total claims`);
    
    // Log each claim
    claims.forEach((claim, idx) => {
      console.log(`\n[DEBUG] Claim ${idx + 1}:`);
      console.log(`  _id: ${claim._id}`);
      console.log(`  itemId: ${claim.itemId} (type: ${typeof claim.itemId})`);
      console.log(`  itemTitle: ${claim.itemTitle}`);
      console.log(`  claimedBy: ${claim.claimedBy}`);
      console.log(`  status: ${claim.status}`);
      console.log(`  message: ${claim.message?.substring(0, 50)}...`);
      console.log(`  meetupAddress: ${claim.meetupAddress || 'N/A'}`);
      console.log(`  receivedAt: ${claim.receivedAt || 'N/A'}`);
      console.log(`  createdAt: ${claim.createdAt}`);
    });

    return NextResponse.json({
      total: claims.length,
      claims: claims.map(claim => ({
        _id: claim._id.toString(),
        itemId: typeof claim.itemId === "string" ? claim.itemId : claim.itemId.toString(),
        itemTitle: claim.itemTitle,
        claimedBy: claim.claimedBy,
        status: claim.status,
        message: claim.message,
        meetupAddress: claim.meetupAddress,
        receivedAt: claim.receivedAt,
        createdAt: claim.createdAt,
      }))
    });
  } catch (error) {
    console.error("[DEBUG] Error fetching claims:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
