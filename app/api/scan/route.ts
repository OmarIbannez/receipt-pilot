import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createGmailClient,
  searchExpenseEmails,
  getFullMessage,
  getHeader,
  extractBody,
  findAttachments,
} from "@/lib/gmail";
import { categorizeExpenses } from "@/lib/categorize";
import type { ExpenseInput } from "@/types";

const PLAN_SCAN_LIMITS: Record<string, number> = {
  FREE: 1,
  PRO: 50,
  BUSINESS: Infinity,
};

export async function POST() {
  let scanId: string | null = null;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check plan limits
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const scansThisMonth = await prisma.scan.count({
      where: {
        userId: user.id,
        startedAt: { gte: monthStart },
        status: "COMPLETED",
      },
    });

    const limit = PLAN_SCAN_LIMITS[user.plan] ?? 1;
    if (scansThisMonth >= limit) {
      return NextResponse.json(
        { error: "Monthly scan limit reached. Upgrade your plan for more scans." },
        { status: 429 }
      );
    }

    if (!user.accessToken) {
      return NextResponse.json(
        { error: "No Gmail access token. Please re-authenticate." },
        { status: 403 }
      );
    }

    const gmail = createGmailClient(user.accessToken);
    const daysBack = 30;

    // Create scan record
    const scan = await prisma.scan.create({
      data: {
        userId: user.id,
        query: "expense emails",
        daysBack,
        status: "RUNNING",
      },
    });
    scanId = scan.id;

    // Search Gmail for expense emails (paginate up to 200)
    const messages = await searchExpenseEmails(gmail, daysBack, 200);

    await prisma.scan.update({
      where: { id: scan.id },
      data: { emailsFound: messages.length },
    });

    if (messages.length === 0) {
      await prisma.scan.update({
        where: { id: scan.id },
        data: { status: "COMPLETED", completedAt: new Date() },
      });
      return NextResponse.json({ success: true, count: 0, scanId: scan.id });
    }

    // Fetch full messages and prepare for categorization
    const expenseInputs: ExpenseInput[] = [];
    const fullMessages: Awaited<ReturnType<typeof getFullMessage>>[] = [];

    for (const msg of messages) {
      if (!msg.id) continue;
      try {
        const full = await getFullMessage(gmail, msg.id);
        fullMessages.push(full);

        const subject = getHeader(full, "Subject") ?? "(no subject)";
        const from = getHeader(full, "From") ?? "";
        const body = extractBody(full);
        const snippet = body.text?.slice(0, 500) ?? full.snippet ?? "";

        expenseInputs.push({ subject, from, snippet });
      } catch (err) {
        console.error(`Failed to fetch message ${msg.id}:`, err);
      }
    }

    // Batch categorize with Claude
    const categorized = await categorizeExpenses(expenseInputs);

    // Upsert expenses to DB
    let count = 0;
    for (let i = 0; i < fullMessages.length; i++) {
      const full = fullMessages[i];
      const input = expenseInputs[i];
      const cat = categorized[i];
      const messageId = full.id;

      if (!messageId || !input || !cat) continue;

      const subject = getHeader(full, "Subject") ?? "(no subject)";
      const fromHeader = getHeader(full, "From") ?? "";
      const dateHeader = getHeader(full, "Date");
      const emailDate = dateHeader ? new Date(dateHeader) : new Date();
      const body = extractBody(full);
      const attachments = findAttachments(full);

      // Parse from name and email
      const fromMatch = fromHeader.match(/^(.+?)\s*<(.+?)>$/);
      const fromName = fromMatch ? fromMatch[1].replace(/"/g, "").trim() : null;
      const fromEmail = fromMatch ? fromMatch[2] : fromHeader;

      try {
        const expense = await prisma.expense.upsert({
          where: {
            userId_gmailMessageId: {
              userId: user.id,
              gmailMessageId: messageId,
            },
          },
          update: {
            subject,
            fromEmail,
            fromName,
            emailDate,
            amount: cat.amount,
            currency: cat.currency,
            category: cat.category,
            snippet: input.snippet.slice(0, 500),
            bodyText: body.text,
            bodyHtml: body.html,
            gmailUrl: `https://mail.google.com/mail/u/0/#inbox/${messageId}`,
            scanId: scan.id,
          },
          create: {
            userId: user.id,
            gmailMessageId: messageId,
            subject,
            fromEmail,
            fromName,
            emailDate,
            amount: cat.amount,
            currency: cat.currency,
            category: cat.category,
            snippet: input.snippet.slice(0, 500),
            bodyText: body.text,
            bodyHtml: body.html,
            gmailUrl: `https://mail.google.com/mail/u/0/#inbox/${messageId}`,
            scanId: scan.id,
          },
        });

        // Upsert attachments
        for (const att of attachments) {
          await prisma.attachment.upsert({
            where: {
              id: `${expense.id}_${att.attachmentId}`,
            },
            update: {
              filename: att.filename,
              mimeType: att.mimeType,
              size: att.size,
            },
            create: {
              expenseId: expense.id,
              gmailAttachId: att.attachmentId,
              filename: att.filename,
              mimeType: att.mimeType,
              size: att.size,
            },
          });
        }

        count++;
      } catch (err) {
        console.error(`Failed to upsert expense for message ${messageId}:`, err);
      }
    }

    // Update scan status to completed
    await prisma.scan.update({
      where: { id: scan.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });

    // Update user scan count
    await prisma.user.update({
      where: { id: user.id },
      data: {
        scanCount: { increment: 1 },
        lastScanAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, count, scanId: scan.id });
  } catch (error) {
    console.error("Scan failed:", error);

    // Mark scan as failed if we created one
    if (scanId) {
      await prisma.scan
        .update({
          where: { id: scanId },
          data: { status: "FAILED", completedAt: new Date() },
        })
        .catch(() => {});
    }

    return NextResponse.json(
      { error: "Scan failed. Please try again." },
      { status: 500 }
    );
  }
}
