import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  createGmailClient,
  getRawMessage,
  getFullMessage,
  extractBody,
  getHeader,
  buildEmailHtml,
  findAttachments,
  downloadAttachment,
} from "@/lib/gmail";
import { generateZip } from "@/lib/zip";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { messageIds } = body as { messageIds: string[] };

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json(
        { error: "Missing or empty messageIds" },
        { status: 400 }
      );
    }

    const gmail = createGmailClient(session.accessToken);
    const entries: { name: string; buffer: Buffer }[] = [];

    for (const messageId of messageIds) {
      try {
        // Get raw .eml
        const raw = await getRawMessage(gmail, messageId);
        const emlBuffer = Buffer.from(raw, "base64url");

        // Get full message for HTML and attachments
        const full = await getFullMessage(gmail, messageId);
        const subject = getHeader(full, "Subject") || "no-subject";
        const from = getHeader(full, "From");
        const date = getHeader(full, "Date");
        const safeSubject = sanitizeFilename(subject);

        entries.push({
          name: `emails/${safeSubject}.eml`,
          buffer: emlBuffer,
        });

        // Build HTML version
        const { text, html } = extractBody(full);
        const htmlString = buildEmailHtml(subject, from, date, html, text);
        entries.push({
          name: `emails/${safeSubject}.html`,
          buffer: Buffer.from(htmlString, "utf-8"),
        });

        // Download attachments
        const attachments = findAttachments(full);
        for (const att of attachments) {
          try {
            const attBuffer = await downloadAttachment(
              gmail,
              messageId,
              att.attachmentId
            );
            const safeFilename = sanitizeFilename(att.filename || "attachment");
            entries.push({
              name: `attachments/${safeFilename}`,
              buffer: attBuffer,
            });
          } catch (err) {
            console.error(
              `Failed to download attachment ${att.attachmentId}:`,
              err
            );
          }
        }
      } catch (err) {
        console.error(`Failed to process message ${messageId}:`, err);
      }
    }

    if (entries.length === 0) {
      return NextResponse.json(
        { error: "No content could be retrieved" },
        { status: 404 }
      );
    }

    const zipBuffer = await generateZip(entries);

    return new Response(new Uint8Array(zipBuffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="receipts.zip"',
      },
    });
  } catch (error) {
    console.error("Bulk download failed:", error);
    return NextResponse.json(
      { error: "Bulk download failed. Please try again." },
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
