import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getAuthTokenFromRequest } from "@/lib/utils";

export const runtime = "nodejs";

// Helper to get user UID from token (simplified - in production, verify Firebase token)
async function getUserIdFromToken(token: string): Promise<string | null> {
  // For now, we'll extract from token or use a simple approach
  // In production, verify the Firebase token using Firebase Admin SDK
  // For demo purposes, we'll use the token as a user identifier
  if (token.startsWith("demo_")) {
    // Demo token - extract user info
    return token;
  }
  // In production, decode and verify Firebase ID token
  return token;
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
    const { itemId, message } = body;

    if (!itemId || !message) {
      return NextResponse.json(
        { error: "itemId and message are required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Verify item exists and is a found item
    const item = await db.collection("items").findOne({ _id: itemId as any });
    
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
      itemId: itemId,
      claimedBy: userId,
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
      itemId: itemId,
      itemTitle: item.title,
      claimedBy: userId,
      message: message,
      status: "pending" as const,
      createdAt: now,
    };

    const result = await db.collection("claims").insertOne(claim);

    // Create notification for the finder
    if (item.reportedBy) {
      const notification = {
        userId: item.reportedBy,
        type: "claim_created" as const,
        itemId: typeof itemId === "string" ? itemId : itemId.toString(),
        itemTitle: item.title,
        message: "Someone has requested to claim your found item",
        read: false,
        createdAt: now,
      };
      await db.collection("notifications").insertOne(notification);
    }

    return NextResponse.json(
      {
        id: result.insertedId.toString(),
        claim: { ...claim, _id: result.insertedId.toString() },
      },
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

    // Verify the user is the finder (reporter) of this item
    const item = await db.collection("items").findOne({ _id: itemId as any });
    
    if (!item) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    // Check if user is the reporter
    // For now, we'll check reporter.email or reportedBy
    // In production, verify Firebase UID properly
    const isReporter = item.reportedBy === userId || 
                      (item.reporter?.email && token.includes(item.reporter.email));

    if (!isReporter) {
      return NextResponse.json(
        { error: "Only the item finder can view claims" },
        { status: 403 }
      );
    }

    // Get all claims for this item
    const claims = await db.collection("claims")
      .find({ itemId: itemId })
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
