import type { Category, Plan, ScanStatus } from "@/app/generated/prisma/client";

export type { Category, Plan, ScanStatus };

export interface ExpenseInput {
  subject: string;
  from: string;
  snippet: string;
}

export interface CategorizedExpense {
  category: Category;
  amount: number | null;
  currency: string;
  vendor: string;
  confidence: number;
}

export interface AttachmentInfo {
  filename: string;
  mimeType: string;
  attachmentId: string;
  size: number;
}

export interface ScanResult {
  success: boolean;
  count: number;
  scanId: string;
}

export interface ExpenseWithAttachments {
  id: string;
  subject: string;
  fromEmail: string;
  fromName: string | null;
  emailDate: Date;
  amount: number | null;
  currency: string;
  category: Category;
  snippet: string | null;
  gmailUrl: string | null;
  attachments: {
    id: string;
    filename: string;
    mimeType: string;
    size: number;
  }[];
}

export interface DashboardStats {
  totalAmount: number;
  expenseCount: number;
  withPdfs: number;
  categories: Record<string, number>;
}
