import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Category } from "@/app/generated/prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = request.nextUrl;
    const category = searchParams.get("category") as Category | null;
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = { userId: user.id };

    if (category) {
      where.category = category;
    }

    if (dateFrom || dateTo) {
      const emailDateFilter: Record<string, Date> = {};
      if (dateFrom) emailDateFilter.gte = new Date(dateFrom);
      if (dateTo) emailDateFilter.lte = new Date(dateTo);
      where.emailDate = emailDateFilter;
    }

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: "insensitive" } },
        { fromEmail: { contains: search, mode: "insensitive" } },
        { fromName: { contains: search, mode: "insensitive" } },
        { snippet: { contains: search, mode: "insensitive" } },
      ];
    }

    // Fetch paginated expenses
    const [expenses, totalCount] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          attachments: {
            select: {
              id: true,
              filename: true,
              mimeType: true,
              size: true,
            },
          },
        },
        orderBy: { emailDate: "desc" },
        skip,
        take: limit,
      }),
      prisma.expense.count({ where }),
    ]);

    // Calculate stats for the filtered set
    const allFiltered = await prisma.expense.findMany({
      where,
      select: {
        amount: true,
        category: true,
        attachments: { select: { id: true } },
      },
    });

    let totalAmount = 0;
    let withPdfs = 0;
    const categories: Record<string, number> = {};

    for (const exp of allFiltered) {
      if (exp.amount) totalAmount += exp.amount;
      if (exp.attachments.length > 0) withPdfs++;
      categories[exp.category] = (categories[exp.category] ?? 0) + 1;
    }

    return NextResponse.json({
      expenses,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      stats: {
        totalAmount: Math.round(totalAmount * 100) / 100,
        expenseCount: totalCount,
        withPdfs,
        categories,
      },
    });
  } catch (error) {
    console.error("Failed to fetch expenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}
