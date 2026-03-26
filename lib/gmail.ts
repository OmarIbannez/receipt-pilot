import { google, gmail_v1 } from "googleapis";
import type { AttachmentInfo } from "@/types";

export function createGmailClient(accessToken: string): gmail_v1.Gmail {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.gmail({ version: "v1", auth });
}

export async function searchExpenseEmails(
  gmail: gmail_v1.Gmail,
  daysBack: number,
  maxResults = 100
): Promise<gmail_v1.Schema$Message[]> {
  const query = [
    "subject:(invoice OR receipt OR payment OR expense OR bill OR statement OR subscription OR charge OR order)",
    `newer_than:${daysBack}d`,
  ].join(" ");

  const messages: gmail_v1.Schema$Message[] = [];
  let pageToken: string | undefined;

  do {
    const res = await gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults: Math.min(maxResults - messages.length, 100),
      pageToken,
    });

    if (res.data.messages) {
      messages.push(...res.data.messages);
    }

    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken && messages.length < maxResults);

  return messages.slice(0, maxResults);
}

export async function getFullMessage(
  gmail: gmail_v1.Gmail,
  messageId: string
): Promise<gmail_v1.Schema$Message> {
  const res = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full",
  });
  return res.data;
}

export async function downloadAttachment(
  gmail: gmail_v1.Gmail,
  messageId: string,
  attachmentId: string
): Promise<Buffer> {
  const res = await gmail.users.messages.attachments.get({
    userId: "me",
    messageId,
    id: attachmentId,
  });

  const data = res.data.data;
  if (!data) {
    throw new Error(`No data returned for attachment ${attachmentId}`);
  }

  return Buffer.from(data, "base64url");
}

export function getHeader(
  message: gmail_v1.Schema$Message,
  name: string
): string | null {
  const headers = message.payload?.headers ?? [];
  const header = headers.find(
    (h) => h.name?.toLowerCase() === name.toLowerCase()
  );
  return header?.value ?? null;
}

export function extractBody(message: gmail_v1.Schema$Message): {
  text: string | null;
  html: string | null;
} {
  const result: { text: string | null; html: string | null } = {
    text: null,
    html: null,
  };

  function walkParts(parts: gmail_v1.Schema$MessagePart[] | undefined): void {
    if (!parts) return;

    for (const part of parts) {
      const mimeType = part.mimeType ?? "";
      const bodyData = part.body?.data;

      if (mimeType === "text/plain" && bodyData && !result.text) {
        result.text = Buffer.from(bodyData, "base64url").toString("utf-8");
      } else if (mimeType === "text/html" && bodyData && !result.html) {
        result.html = Buffer.from(bodyData, "base64url").toString("utf-8");
      }

      if (part.parts) {
        walkParts(part.parts);
      }
    }
  }

  const payload = message.payload;
  if (!payload) return result;

  // Single-part message
  if (payload.body?.data) {
    const mimeType = payload.mimeType ?? "";
    const decoded = Buffer.from(payload.body.data, "base64url").toString(
      "utf-8"
    );
    if (mimeType === "text/plain") {
      result.text = decoded;
    } else if (mimeType === "text/html") {
      result.html = decoded;
    }
  }

  // Multi-part message
  walkParts(payload.parts);

  return result;
}

export function findAttachments(
  message: gmail_v1.Schema$Message
): AttachmentInfo[] {
  const attachments: AttachmentInfo[] = [];

  function walkParts(parts: gmail_v1.Schema$MessagePart[] | undefined): void {
    if (!parts) return;

    for (const part of parts) {
      const attachmentId = part.body?.attachmentId;
      const filename = part.filename;

      if (attachmentId && filename) {
        attachments.push({
          filename,
          mimeType: part.mimeType ?? "application/octet-stream",
          attachmentId,
          size: part.body?.size ?? 0,
        });
      }

      if (part.parts) {
        walkParts(part.parts);
      }
    }
  }

  walkParts(message.payload?.parts);

  return attachments;
}
