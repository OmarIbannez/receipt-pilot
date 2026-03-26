import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  createGmailClient,
  getRawMessage,
  getFullMessage,
  downloadAttachment,
  extractBody,
  getHeader,
  buildEmailHtml,
} from "@/lib/gmail";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { messageId, type, attachmentId, filename } = body as {
      messageId: string;
      type: "eml" | "attachment" | "pdf";
      attachmentId?: string;
      filename?: string;
    };

    if (!messageId || !type) {
      return NextResponse.json(
        { error: "Missing messageId or type" },
        { status: 400 }
      );
    }

    const gmail = createGmailClient(session.accessToken);

    if (type === "eml") {
      const raw = await getRawMessage(gmail, messageId);
      const buffer = Buffer.from(raw, "base64url");
      return new Response(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "message/rfc822",
          "Content-Disposition": 'attachment; filename="email.eml"',
        },
      });
    }

    if (type === "attachment") {
      if (!attachmentId) {
        return NextResponse.json(
          { error: "Missing attachmentId" },
          { status: 400 }
        );
      }
      const buffer = await downloadAttachment(gmail, messageId, attachmentId);
      const safeName = filename || "attachment";
      return new Response(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `attachment; filename="${safeName}"`,
        },
      });
    }

    if (type === "pdf") {
      const full = await getFullMessage(gmail, messageId);
      const { text, html } = extractBody(full);
      const subject = getHeader(full, "Subject");
      const from = getHeader(full, "From");
      const date = getHeader(full, "Date");
      const htmlString = buildEmailHtml(subject, from, date, html, text);
      const safeSubject = sanitizeFilename(subject || "email");
      return new Response(htmlString, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `attachment; filename="${safeSubject}.html"`,
        },
      });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Download failed:", error);
    return NextResponse.json(
      { error: "Download failed. Please try again." },
      { status: 500 }
    );
  }
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._\- ]/g, "")
    .trim()
    .slice(0, 100) || "file";
}
