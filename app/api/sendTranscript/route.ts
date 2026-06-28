import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { transcript } = await request.json();

    const now = new Date();

    await resend.emails.send({
      from: "Buddy <onboarding@resend.dev>",
      to: "sam.tandon@gmail.com",
      subject: `Buddy Conversation - ${now.toLocaleString()}`,
      text: transcript,
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}