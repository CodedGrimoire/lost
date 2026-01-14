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

// POST /api/claims - Create a new claim
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    // Support both new format (itemId, claimerId, proof) and old format (itemId, message)
    const { itemId, claimerId, proof, message } = body;

    // Use claimerId from body if provided, otherwise use userId from token
    const finalClaimerId = claimerId || userId;
    // Use proof if provided, otherwise use message (for backward compatibility)
    const finalProof = proof || message;

    if (!itemId || !finalProof) {
      return NextResponse.json(
        { error: "itemId and proof (or message) are required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const { ObjectId } = await import("mongodb");

    // Convert itemId to ObjectId if it's a string
    const itemIdObj = typeof itemId === "string" ? new ObjectId(itemId) : itemId;

    // Verify item exists and is a found item
    const item = await db.collection("items").findOne({ _id: itemIdObj });
    
    if (!item) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    if (item.status !== "found") {
      return NextResponse.json(
        { error: "Can only claim found items" },
        { status: 400 }
      );
    }

    if (item.claimed) {
      return NextResponse.json(
        { error: "Item has already been claimed" },
        { status: 400 }
      );
    }

    // Check if user already has a pending claim for this item
    const existingClaim = await db.collection("claims").findOne({
      itemId: itemIdObj,
      claimedBy: finalClaimerId,
      status: "pending",
    });

    if (existingClaim) {
      return NextResponse.json(
        { error: "You already have a pending claim for this item" },
        { status: 400 }
      );
    }

    // Create the claim
    const now = new Date();
    const claim = {
      itemId: itemIdObj,
      itemTitle: item.title,
      claimedBy: finalClaimerId,
      message: finalProof, // Store proof as message in the database
      status: "pending" as const,
      createdAt: now,
    };

    await db.collection("claims").insertOne(claim);

    // Create notification for the finder
    if (item.reportedBy) {
      const notification = {
        userId: item.reportedBy,
        type: "claim_created" as const,
        itemId: typeof itemId === "string" ? itemId : itemIdObj.toString(),
        itemTitle: item.title,
        message: "Someone has requested to claim your found item",
        read: false,
        createdAt: now,
      };
      await db.collection("notifications").insertOne(notification);
    }

    return NextResponse.json(
      { success: true },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating claim:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/claims?itemId=... - Get claims for an item (finder only)
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

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json(
        { error: "itemId parameter is required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const { ObjectId } = await import("mongodb");

    // Convert itemId to ObjectId if it's a string
    const itemIdObj = typeof itemId === "string" ? new ObjectId(itemId) : itemId;

    // Verify the user is the finder (reporter) of this item
    const item = await db.collection("items").findOne({ _id: itemIdObj });
    
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
      console.log("Authorization failed:", {
        itemReportedBy: item.reportedBy,
        userId,
        itemReporterEmail: item.reporter?.email,
        userEmail,
      });
      return NextResponse.json(
        { error: "Only the item finder can view claims" },
        { status: 403 }
      );
    }

    // Get all claims for this item
    const claims = await db.collection("claims")
      .find({ itemId: itemIdObj })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(claims);
  } catch (error) {
    console.error("Error fetching claims:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
