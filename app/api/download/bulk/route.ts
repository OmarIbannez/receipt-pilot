import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createGmailClient, downloadAttachment } from "@/lib/gmail";
import archiver from "archiver";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { expenseIds } = body as { expenseIds: string[] };

    if (!Array.isArray(expenseIds) || expenseIds.length === 0) {
      return NextResponse.json(
        { error: "expenseIds array is required" },
        { status: 400 }
      );
    }

    // Fetch expenses with attachments, verify ownership
    const expenses = await prisma.expense.findMany({
      where: {
        id: { in: expenseIds },
        userId: session.user.id,
      },
      include: {
        attachments: true,
        user: {
          select: { accessToken: true },
        },
      },
    });

    if (expenses.length === 0) {
      return NextResponse.json(
        { error: "No matching expenses found" },
        { status: 404 }
      );
    }

    const accessToken = expenses[0].user.accessToken;
    if (!accessToken) {
      return NextResponse.json(
        { error: "No Gmail access token. Please re-authenticate." },
        { status: 403 }
      );
    }

    const gmail = createGmailClient(accessToken);

    // Create ZIP archive
    const archive = archiver("zip", { zlib: { level: 5 } });
    const chunks: Buffer[] = [];

    archive.on("data", (chunk: Buffer) => chunks.push(chunk));

    const archiveFinished = new Promise<void>((resolve, reject) => {
      archive.on("end", resolve);
      archive.on("error", reject);
    });

    // Add files organized by category
    for (const expense of expenses) {
      const categoryFolder = expense.category.toLowerCase();

      // Add email HTML summary
      const emailSummary = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${expense.subject}</title></head>
<body>
  <h1>${expense.subject}</h1>
  <p><strong>From:</strong> ${expense.fromName ?? ""} &lt;${expense.fromEmail}&gt;</p>
  <p><strong>Date:</strong> ${expense.emailDate.toISOString()}</p>
  <p><strong>Amount:</strong> ${expense.amount != null ? `${expense.currency} ${expense.amount}` : "N/A"}</p>
  <p><strong>Category:</strong> ${expense.category}</p>
  <hr>
  ${expense.bodyHtml ?? `<pre>${expense.bodyText ?? expense.snippet ?? ""}</pre>`}
</body>
</html>`.trim();

      const safeSubject = expense.subject
        .replace(/[^a-zA-Z0-9_\-. ]/g, "_")
        .slice(0, 80);

      archive.append(emailSummary, {
        name: `${categoryFolder}/${safeSubject}/email.html`,
      });

      // Download and add attachments
      for (const att of expense.attachments) {
        try {
          const buffer = await downloadAttachment(
            gmail,
            expense.gmailMessageId,
            att.gmailAttachId
          );
          archive.append(buffer, {
            name: `${categoryFolder}/${safeSubject}/${att.filename}`,
          });
        } catch (err) {
          console.error(
            `Failed to download attachment ${att.id} for expense ${expense.id}:`,
            err
          );
        }
      }
    }

    archive.finalize();
    await archiveFinished;

    const zipBuffer = Buffer.concat(chunks);

    return new Response(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="expenses-${new Date().toISOString().split("T")[0]}.zip"`,
        "Content-Length": zipBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Failed to create bulk download:", error);
    return NextResponse.json(
      { error: "Failed to create bulk download" },
      { status: 500 }
    );
  }
}
