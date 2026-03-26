import Anthropic from "@anthropic-ai/sdk";
import type { ExpenseInput, CategorizedExpense, Category } from "@/types";

const VALID_CATEGORIES: Category[] = [
  "RIDESHARE",
  "FOOD_DELIVERY",
  "TRAVEL",
  "SUBSCRIPTIONS",
  "SHOPPING",
  "UTILITIES",
  "INSURANCE",
  "HEALTHCARE",
  "ENTERTAINMENT",
  "EDUCATION",
  "OTHER",
];

const SYSTEM_PROMPT = `You are an expense categorization engine. You receive a JSON array of expense emails and return a JSON array with the same number of elements, one per input.

Each output element must have:
- "category": one of ${VALID_CATEGORIES.join(", ")}
- "amount": the numeric amount (no currency symbol) or null if not found
- "currency": ISO 4217 currency code (default "USD")
- "vendor": the company or merchant name
- "confidence": a number from 0 to 1 indicating your confidence

Return ONLY a valid JSON array. No explanation, no markdown.`;

const MAX_BATCH_SIZE = 20;

const client = new Anthropic();

function stripMarkdownFences(text: string): string {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, "");
  cleaned = cleaned.replace(/\n?```\s*$/i, "");
  return cleaned.trim();
}

function validateCategory(cat: string): Category {
  const upper = cat.toUpperCase() as Category;
  if (VALID_CATEGORIES.includes(upper)) {
    return upper;
  }
  return "OTHER";
}

export async function categorizeExpenses(
  expenses: ExpenseInput[]
): Promise<CategorizedExpense[]> {
  if (expenses.length === 0) return [];

  const results: CategorizedExpense[] = [];

  for (let i = 0; i < expenses.length; i += MAX_BATCH_SIZE) {
    const batch = expenses.slice(i, i + MAX_BATCH_SIZE);
    const batchResults = await categorizeBatch(batch);
    results.push(...batchResults);
  }

  return results;
}

async function categorizeBatch(
  batch: ExpenseInput[]
): Promise<CategorizedExpense[]> {
  const input = batch.map((e) => ({
    subject: e.subject,
    from: e.from,
    snippet: e.snippet.slice(0, 500),
  }));

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Categorize these ${batch.length} expenses:\n${JSON.stringify(input)}`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return batch.map(() => ({
      category: "OTHER" as Category,
      amount: null,
      currency: "USD",
      vendor: "Unknown",
      confidence: 0,
    }));
  }

  const cleaned = stripMarkdownFences(textBlock.text);

  let parsed: unknown[];
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.error("Failed to parse categorization response:", cleaned);
    return batch.map(() => ({
      category: "OTHER" as Category,
      amount: null,
      currency: "USD",
      vendor: "Unknown",
      confidence: 0,
    }));
  }

  if (!Array.isArray(parsed)) {
    return batch.map(() => ({
      category: "OTHER" as Category,
      amount: null,
      currency: "USD",
      vendor: "Unknown",
      confidence: 0,
    }));
  }

  return parsed.map((raw: unknown, idx: number) => {
    const item = raw as Record<string, unknown>;
    if (!item || typeof item !== "object") {
      return {
        category: "OTHER" as Category,
        amount: null,
        currency: "USD",
        vendor: batch[idx]?.from ?? "Unknown",
        confidence: 0,
      };
    }

    return {
      category: validateCategory(String(item.category ?? "OTHER")),
      amount:
        typeof item.amount === "number"
          ? item.amount
          : item.amount === null
            ? null
            : parseFloat(String(item.amount)) || null,
      currency: typeof item.currency === "string" ? item.currency : "USD",
      vendor: typeof item.vendor === "string" ? item.vendor : "Unknown",
      confidence:
        typeof item.confidence === "number"
          ? Math.max(0, Math.min(1, item.confidence))
          : 0,
    };
  });
}
