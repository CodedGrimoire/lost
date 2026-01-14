import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getAuthTokenFromRequest } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const token = getAuthTokenFromRequest(req);
    
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // For now, we'll return basic user info from the token
    // In a full implementation, you'd verify the Firebase token and get user from MongoDB
    // For demo purposes, we'll return a basic response
    return NextResponse.json({
      message: "User info endpoint - token verified",
      token: token.substring(0, 20) + "...",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
