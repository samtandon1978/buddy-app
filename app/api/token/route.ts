import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiKey = process.env.GROK_API_KEY;

    if (!apiKey) {console.log("GROK_API_KEY NOT FOUND");
      return NextResponse.json(
        { error: "Missing GROK_API_KEY" },
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://api.x.ai/v1/realtime/client_secrets",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }
    );

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Token creation failed:", error);

    return NextResponse.json(
      {
        error: "Failed to create realtime token",
      },
      { status: 500 }
    );
  }
}