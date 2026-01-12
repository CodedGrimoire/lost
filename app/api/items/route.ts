import { NextResponse } from "next/server";
import { verifyAuthHeader } from "@/lib/firebaseAdmin";
import { getDb } from "@/lib/mongodb";

export const runtime = "nodejs";

export async function GET() {
  try {
    const db = await getDb();
    const items = await db.collection("items").find({}).toArray();

    const serialized = items.map((item) => ({
      ...item,
      _id: item._id?.toString(),
    }));

    return NextResponse.json({ items: serialized });
  } catch (error) {
    const message = (error as Error).message || "Failed to fetch items.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const decodedToken = await verifyAuthHeader(
      request.headers.get("authorization"),
    );

    const payload = await request.json().catch(() => null);

    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    const db = await getDb();
    const collection = db.collection("items");
    const document = {
      ...payload,
      userId: decodedToken.uid,
      createdAt: new Date(),
    };

    const result = await collection.insertOne(document);

    return NextResponse.json(
      { id: result.insertedId.toString(), item: { ...document, _id: result.insertedId.toString() } },
      { status: 201 },
    );
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500;
    const message = (error as Error).message || "Failed to create item.";
    return NextResponse.json({ error: message }, { status });
  }
}
