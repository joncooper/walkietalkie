import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Defense in depth: verify email even though Clerk allowlist should handle it
  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress;
  if (email !== "jon.cooper@gmail.com") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const response = await fetch(
    "https://api.openai.com/v1/realtime/client_secrets",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        expires_after: { anchor: "created_at", seconds: 600 },
        session: {
          type: "realtime",
          model: "gpt-realtime",
          voice: "marin",
          instructions:
            "You are a helpful, concise voice assistant accessed via a walkie talkie app. Keep responses brief and conversational. Be friendly and natural.",
          turn_detection: {
            type: "server_vad",
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500,
            create_response: true,
            interrupt_response: true,
          },
          input_audio_transcription: {
            model: "gpt-4o-mini-transcribe",
          },
        },
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("OpenAI session error:", response.status, errorBody);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 502 }
    );
  }

  const data = await response.json();
  return NextResponse.json(data);
}
