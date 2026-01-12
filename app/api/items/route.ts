import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export const runtime = "nodejs";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const items = await db.collection("items").find().toArray();
    return NextResponse.json(items);
  } catch (error) {
    const message = (error as Error).message || "Failed to load items.";
    return NextResponse.json({ error: message }, { status: 500 });
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
    const message = (error as Error).message || "Failed to create item.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
