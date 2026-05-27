import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user session
    const decodedTicket = await adminAuth.verifySessionCookie(session);
    const userId = decodedTicket.uid;

    // Get user details
    const userDoc = await adminDb.collection("users").doc(userId).get();
    const creatorName = userDoc.data()?.name || "Anonymous";

    const body = await request.json();
    const { prompt, agent_type = "creation", conversation_id } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const agentUrl = process.env.AGENT_SERVER_URL || "http://localhost:8000";
    
    // Forward request to Python Agent Server
    const response = await fetch(`${agentUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        agent_type,
        userId,
        creatorName,
        conversation_id: conversation_id || null,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: errorText || "Agent server error" }, { status: 500 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Assistant API Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
