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

    // Verify session
    const decodedTicket = await adminAuth.verifySessionCookie(session);
    const userId = decodedTicket.uid;

    const body = await request.json();
    const { pollId } = body;
    if (!pollId) {
      return NextResponse.json({ error: "Poll ID is required" }, { status: 400 });
    }

    // Authorization: Verify user is creator of the poll
    const pollDoc = await adminDb.collection("polls").doc(pollId).get();
    if (!pollDoc.exists) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    const pollData = pollDoc.data()!;
    if (pollData.creatorId !== userId) {
      return NextResponse.json({ error: "Only the poll creator can run AI analytics" }, { status: 403 });
    }

    const agentUrl = process.env.AGENT_SERVER_URL || "http://localhost:8000";
    
    // Forward request to Python Agent Server
    const response = await fetch(`${agentUrl}/api/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        poll_id: pollId,
        userId: userId,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: errText || "Failed to generate analytics" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("AI Analytics Route Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
