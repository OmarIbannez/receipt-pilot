import { parse, isValid } from "date-fns";

/**
 * Extracts the first dollar amount found in the given text.
 * Supports formats like $1,234.56, USD 1234.56, 1,234.56 USD, etc.
 * Returns the amount as a number or null if none found.
 */
export function extractAmount(text: string): number | null {
  if (!text) return null;

  // Match patterns like $1,234.56 or $ 1234.56
  const dollarSign = /\$\s?([\d,]+\.?\d{0,2})/;
  // Match patterns like USD 1,234.56 or 1,234.56 USD
  const currencyCode =
    /(?:USD|EUR|GBP|CAD|AUD)\s?([\d,]+\.?\d{0,2})|([\d,]+\.?\d{0,2})\s?(?:USD|EUR|GBP|CAD|AUD)/i;
  // Match "Total: 1,234.56" or "Amount: 1234.56"
  const labeledAmount =
    /(?:total|amount|charge|price|cost|due|paid|payment)\s*:?\s*\$?\s*([\d,]+\.\d{2})/i;

  for (const pattern of [labeledAmount, dollarSign, currencyCode]) {
    const match = text.match(pattern);
    if (match) {
      const raw = match[1] || match[2];
      if (raw) {
        const cleaned = raw.replace(/,/g, "");
        const value = parseFloat(cleaned);
        if (!isNaN(value) && value > 0 && value < 1_000_000) {
          return value;
        }
      }
    }
  }

  return null;
}

/**
 * Extracts a date from common formats found in receipt/invoice emails.
 * Returns a Date object or null if no valid date found.
 */
export function extractDate(text: string): Date | null {
  if (!text) return null;

  const formats = [
    // 2024-01-15
    { pattern: /(\d{4}-\d{2}-\d{2})/, format: "yyyy-MM-dd" },
    // 01/15/2024
    { pattern: /(\d{2}\/\d{2}\/\d{4})/, format: "MM/dd/yyyy" },
    // 15/01/2024 (day first, try after MM/dd)
    { pattern: /(\d{2}-\d{2}-\d{4})/, format: "MM-dd-yyyy" },
    // January 15, 2024
    {
      pattern:
        /([A-Z][a-z]+ \d{1,2},?\s*\d{4})/,
      format: "MMMM d, yyyy",
    },
    // Jan 15, 2024
    {
      pattern: /([A-Z][a-z]{2} \d{1,2},?\s*\d{4})/,
      format: "MMM d, yyyy",
    },
    // 15 Jan 2024
    {
      pattern: /(\d{1,2} [A-Z][a-z]{2} \d{4})/,
      format: "d MMM yyyy",
    },
    // 15 January 2024
    {
      pattern:
        /(\d{1,2} [A-Z][a-z]+ \d{4})/,
      format: "d MMMM yyyy",
    },
  ];

  for (const { pattern, format } of formats) {
    const match = text.match(pattern);
    if (match) {
      const raw = match[1].replace(/,\s*/g, ", ");
      const date = parse(raw, format, new Date());
      if (isValid(date)) {
        return date;
      }
      // Try with comma variant for "January 15, 2024" vs "January 15 2024"
      const withoutComma = raw.replace(",", "");
      const formatWithoutComma = format.replace(",", "");
      const date2 = parse(withoutComma, formatWithoutComma, new Date());
      if (isValid(date2)) {
        return date2;
      }
    }
  }

  return null;
}
