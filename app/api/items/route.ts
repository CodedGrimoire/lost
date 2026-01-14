import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter");

    const client = await clientPromise;
    const db = client.db();
    const { ObjectId } = await import("mongodb");

    // Get all items with received claims (these should be excluded from normal listings)
    const receivedClaims = await db.collection("claims")
      .find({ status: "received" })
      .toArray();
    
    const receivedItemIds = receivedClaims.map(claim => 
      typeof claim.itemId === "string" ? new ObjectId(claim.itemId) : claim.itemId
    );

    const query: any =
      filter === "lost"
        ? { status: "lost" }
        : filter === "found"
          ? { status: "found" }
          : {};

    // Exclude items that have been received
    if (receivedItemIds.length > 0) {
      query._id = { $nin: receivedItemIds };
    }

    const items = await db.collection("items").find(query).toArray();

    return NextResponse.json(items);
  } catch (error) {
    console.error(error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const client = await clientPromise;
    const db = client.db();
    const now = new Date();
    const document = { ...payload, createdAt: now };
    const result = await db.collection("items").insertOne(document);

    return NextResponse.json(
      { id: result.insertedId.toString(), item: { ...document, _id: result.insertedId.toString() } },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json([], { status: 500 });
  }
}
