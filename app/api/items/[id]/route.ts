import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const db = await getDb();
    const item = await db
      .collection("items")
      .findOne({ _id: new ObjectId(params.id) });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...item,
      _id: item._id?.toString(),
    });
  } catch (error) {
    const message = (error as Error).message || "Failed to load item.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
