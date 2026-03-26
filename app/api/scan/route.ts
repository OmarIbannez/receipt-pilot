import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  createGmailClient,
  searchExpenseEmails,
  getFullMessage,
  parseEmailResult,
} from "@/lib/gmail";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const daysBack = typeof body.daysBack === "number" ? body.daysBack : 30;

    const gmail = createGmailClient(session.accessToken);
    const messages = await searchExpenseEmails(gmail, daysBack, 200);

    const results = [];
    for (const msg of messages) {
      if (!msg.id) continue;
      try {
        const full = await getFullMessage(gmail, msg.id);
        results.push(parseEmailResult(full));
      } catch (err) {
        console.error(`Failed to fetch message ${msg.id}:`, err);
      }
    }

    return NextResponse.json({ results, count: results.length });
  } catch (error) {
    console.error("Scan failed:", error);
    return NextResponse.json(
      { error: "Scan failed. Please try again." },
      { status: 500 }
    );
  }
}
