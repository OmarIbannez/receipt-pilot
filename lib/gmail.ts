import { google, gmail_v1 } from "googleapis";

export interface AttachmentInfo {
  filename: string;
  mimeType: string;
  attachmentId: string;
  size: number;
}

export interface EmailResult {
  messageId: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  hasAttachments: boolean;
  attachments: AttachmentInfo[];
}

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

export async function getRawMessage(
  gmail: gmail_v1.Gmail,
  messageId: string
): Promise<string> {
  const res = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "raw",
  });
  return res.data.raw ?? "";
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
): string {
  const headers = message.payload?.headers ?? [];
  const header = headers.find(
    (h) => h.name?.toLowerCase() === name.toLowerCase()
  );
  return header?.value ?? "";
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

export function parseEmailResult(message: gmail_v1.Schema$Message): EmailResult {
  const attachments = findAttachments(message);
  return {
    messageId: message.id!,
    subject: getHeader(message, "Subject"),
    from: getHeader(message, "From"),
    date: getHeader(message, "Date"),
    snippet: message.snippet ?? "",
    hasAttachments: attachments.length > 0,
    attachments,
  };
}

export function buildEmailHtml(
  subject: string,
  from: string,
  date: string,
  bodyHtml: string | null,
  bodyText: string | null
): string {
  const content = bodyHtml
    ? bodyHtml
    : `<pre style="white-space:pre-wrap;font-family:inherit">${(bodyText ?? "").replace(/</g, "&lt;")}</pre>`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${subject.replace(/</g, "&lt;")}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; color: #1c1917; }
  .header { border-bottom: 1px solid #e7e5e4; padding-bottom: 16px; margin-bottom: 24px; }
  .header h1 { font-size: 20px; margin: 0 0 8px; }
  .meta { color: #78716c; font-size: 14px; line-height: 1.6; }
  .body { line-height: 1.6; }
  @media print { body { margin: 20px; } }
</style>
</head>
<body>
<div class="header">
  <h1>${subject.replace(/</g, "&lt;")}</h1>
  <div class="meta">
    <div><strong>From:</strong> ${from.replace(/</g, "&lt;")}</div>
    <div><strong>Date:</strong> ${date.replace(/</g, "&lt;")}</div>
  </div>
</div>
<div class="body">${content}</div>
</body>
</html>`;
}
