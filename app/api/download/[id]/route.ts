import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createGmailClient, downloadAttachment } from "@/lib/gmail";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Find attachment with expense and user info for ownership verification
    const attachment = await prisma.attachment.findUnique({
      where: { id },
      include: {
        expense: {
          select: {
            userId: true,
            gmailMessageId: true,
            user: {
              select: { accessToken: true },
            },
          },
        },
      },
    });

    if (!attachment) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (attachment.expense.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const accessToken = attachment.expense.user.accessToken;
    if (!accessToken) {
      return NextResponse.json(
        { error: "No Gmail access token. Please re-authenticate." },
        { status: 403 }
      );
    }

    const gmail = createGmailClient(accessToken);
    const buffer = await downloadAttachment(
      gmail,
      attachment.expense.gmailMessageId,
      attachment.gmailAttachId
    );

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Disposition": `attachment; filename="${attachment.filename}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Failed to download attachment:", error);
    return NextResponse.json(
      { error: "Failed to download attachment" },
      { status: 500 }
    );
  }
}
