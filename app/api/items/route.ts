import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export const runtime = "nodejs";

export async function GET() {
  try {
    const db = await getDb();
    const items = await db
      .collection("items")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const serialized = items.map((item) => ({
      ...item,
      _id: item._id?.toString(),
    }));

    return NextResponse.json({ items: serialized });
  } catch (error) {
    const message = (error as Error).message || "Failed to load items.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const db = await getDb();
    const now = new Date();
    const document = { ...payload, createdAt: now };

    const result = await db.collection("items").insertOne(document);

    return NextResponse.json(
      {
        success: true,
        id: result.insertedId.toString(),
        item: { ...document, _id: result.insertedId.toString() },
      },
      { status: 201 },
    );
  } catch (error) {
    const message = (error as Error).message || "Failed to create item.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
