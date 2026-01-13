import { NextRequest, NextResponse } from "next/server";
import { setAuthTokenCookieInResponse } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const demoUser = process.env.DEMO_USER;
    const demoPassword = process.env.DEMO_PASSWORD;

    if (!demoUser || !demoPassword) {
      return NextResponse.json(
        { error: "Demo login is not configured" },
        { status: 500 }
      );
    }

    // Validate demo credentials
    if (email === demoUser && password === demoPassword) {
      // Create a simple demo token (in production, use proper JWT)
      const demoToken = `demo_${Buffer.from(`${demoUser}:${Date.now()}`).toString('base64')}`;
      
      const response = NextResponse.json({
        success: true,
        user: {
          email: demoUser,
          isDemo: true,
        },
        token: demoToken,
      });

      // Set the auth token cookie
      setAuthTokenCookieInResponse(response, demoToken);

      return response;
    }

    return NextResponse.json(
      { error: "Invalid demo credentials" },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
