import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export const runtime = "nodejs";

// GET /api/items/:id/matches - Get matching lost items for a found item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: itemId } = await params;
    const client = await clientPromise;
    const db = client.db();

    const { ObjectId } = await import("mongodb");
    const itemIdObj = typeof itemId === "string" ? new ObjectId(itemId) : itemId;

    // Fetch the found item
    const foundItem = await db.collection("items").findOne({ _id: itemIdObj });

    if (!foundItem) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    // Validate it's a found item
    if (foundItem.status !== "found") {
      return NextResponse.json(
        { error: "This endpoint only works for found items" },
        { status: 400 }
      );
    }

    // Extract search criteria from found item
    const category = foundItem.category || null;
    const title = foundItem.title || "";
    const description = foundItem.description || "";
    const location = foundItem.location || "";

    // Extract keywords from title (split by spaces, filter out common words)
    const titleKeywords = title
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 2) // Filter out very short words
      .filter((word) => !["the", "and", "or", "a", "an", "is", "was", "for", "with", "this", "that", "from"].includes(word));

    // Extract keywords from description
    const descKeywords = (description || "")
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 2)
      .filter((word) => !["the", "and", "or", "a", "an", "is", "was", "for", "with", "this", "that", "from"].includes(word));

    // Combine all keywords and remove duplicates
    const allKeywords = [...new Set([...titleKeywords, ...descKeywords])].filter(k => k.length > 0);

    // Build OR conditions for keyword/location matching
    const orConditions: any[] = [];

    // Title keyword match (if we have keywords)
    if (allKeywords.length > 0) {
      // Match if title contains any of the keywords
      orConditions.push({
        title: {
          $regex: allKeywords.join("|"),
          $options: "i", // case-insensitive
        },
      });
    }

    // Description keyword match (if we have keywords)
    if (allKeywords.length > 0) {
      orConditions.push({
        description: {
          $regex: allKeywords.join("|"),
          $options: "i",
        },
      });
    }

    // Location match (if location exists and is meaningful)
    if (location && location.trim().length > 3) {
      // Extract location keywords (remove common words)
      const locationWords = location
        .toLowerCase()
        .split(/[\s,]+/)
        .filter((word) => word.length > 2);
      
      if (locationWords.length > 0) {
        orConditions.push({
          location: {
            $regex: locationWords.join("|"),
            $options: "i",
          },
        });
      }
    }

    // If no matching conditions, return empty
    if (orConditions.length === 0) {
      return NextResponse.json([]);
    }

    // Build query for matching lost items
    const query: any = {
      status: "lost",
      _id: { $ne: itemIdObj }, // Exclude the found item itself
      $and: [
        // Filter out claimed items
        {
          $or: [
            { claimed: { $exists: false } },
            { claimed: false },
            { claimed: { $ne: true } }
          ]
        },
        // Match keywords or location
        { $or: orConditions }
      ]
    };

    // Category match (if category exists)
    if (category) {
      query.category = category;
    }

    // Query matching lost items
    const matches = await db.collection("items")
      .find(query)
      .limit(10)
      .sort({ createdAt: -1 }) // Most recent first
      .toArray();

    return NextResponse.json(matches);
  } catch (error) {
    console.error("Error fetching matching items:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
