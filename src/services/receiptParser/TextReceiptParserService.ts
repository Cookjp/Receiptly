import { LineItem, ReceiptData, ReceiptParserService } from "./ReceiptParserService";

export class TextReceiptParserService implements ReceiptParserService {
  parseReceipt(text: string): ReceiptData {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const items: LineItem[] = [];

    let serviceCharge: number | undefined;
    let total: number | undefined;
    let establishmentName: string | undefined;
    let date: string | undefined;
    let address: string | undefined;
    let phoneNumber: string | undefined;

    const pricePattern = /(\d+[.,]\d{2})(?!.*\d)/; // Last float in line
    const qtyPatternStart = /^(\d+)\s+/; // "2 Item"
    const qtyPatternMid = /[×x]\s*(\d+)/i; // "Item × 2" or "Item x 2"
    const qtyPatternAt = /(\d+)\s*@/; // "2 @ £1.99" or "2@ £1.99"
    const eachPricePattern = /\([£$€]?\d+[.,]\d{2}\s*each\)/i; // "(£16.00 each)"

    // Detect currency from the text
    const currency = this.detectCurrency(text);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lowerLine = line.toLowerCase();

      // Skip common metadata lines
      if (i < 5 && (lowerLine.includes('tel') || lowerLine.includes('address') || lowerLine.includes('date'))) {
        continue;
      }

      // Skip "(£X.XX each)" info lines
      if (/^\([£$€]?\d+[.,]\d{2}\s*each\)$/i.test(line)) {
        continue;
      }

      // Skip tax breakdown lines (e.g., "A (20%) £56.67 £11.33 £68.00")
      if (/^[A-Z]\s*\(\d+%\)/i.test(line) || lowerLine.includes('tax rate')) {
        continue;
      }

      const priceMatch = line.match(pricePattern);
      if (!priceMatch) continue;

      let rawPrice = parseFloat(priceMatch[1].replace(',', '.'));

      // Heuristic: fix misread large numbers like "1900.00" → likely "100.00"
      if (rawPrice > 300 && rawPrice % 100 < 1) {
        rawPrice = parseFloat((rawPrice / 10).toFixed(2));
      }

      // Skip subtotal lines (we calculate subtotal from items instead)
      if (lowerLine.includes('subtotal') || lowerLine.includes('sub-total') || lowerLine.includes('sub total')) {
        continue;
      }
      if (lowerLine.includes('service') || lowerLine.includes('tip') || lowerLine.includes('gratuity')) {
        serviceCharge = rawPrice;
        continue;
      }
      if (lowerLine.includes('total') || lowerLine.includes('amount due') || lowerLine.includes('balance')) {
        total = rawPrice;
        continue;
      }

      // Extract line items
      let quantity: number | undefined;
      let unitPrice: number | undefined;
      let description = line.replace(pricePattern, '').trim();

      // Remove "(£X.XX each)" from description
      description = description.replace(eachPricePattern, '').trim();

      // Check for quantity at start: "2 Item"
      const qtyMatchStart = description.match(qtyPatternStart);
      if (qtyMatchStart) {
        quantity = parseInt(qtyMatchStart[1]);
        description = description.replace(qtyPatternStart, '');
      }

      // Check for quantity mid-line: "Item × 2" or "Item x 2"
      const qtyMatchMid = description.match(qtyPatternMid);
      if (qtyMatchMid && !quantity) {
        quantity = parseInt(qtyMatchMid[1]);
        description = description.replace(qtyPatternMid, '').trim();
      }

      // Check for @ notation: "2 @ £1.99" or "Item 2 @ £1.99"
      const qtyMatchAt = description.match(qtyPatternAt);
      if (qtyMatchAt && !quantity) {
        quantity = parseInt(qtyMatchAt[1]);
        description = description.replace(qtyPatternAt, '').trim();
      }

      // Calculate unit price if quantity found
      if (quantity && quantity > 0) {
        unitPrice = parseFloat((rawPrice / quantity).toFixed(2));
      }

      const cleanedDesc = this.cleanDescription(description);

      // Skip items with empty or very short descriptions (likely noise)
      if (cleanedDesc.length < 2) {
        continue;
      }

      items.push({
        description: cleanedDesc,
        quantity,
        unitPrice,
        totalPrice: rawPrice
      });
    }

    // Calculate subtotal as sum of line items (not from receipt text)
    // This helps detect parsing errors when subtotal != total
    const calculatedSubtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

    return {
      items,
      subtotal: calculatedSubtotal > 0 ? parseFloat(calculatedSubtotal.toFixed(2)) : undefined,
      serviceCharge,
      total,
      establishmentName,
      date,
      address,
      phoneNumber,
      currency
    };
  }

  private cleanDescription(desc: string): string {
    return desc
      .replace(/\s+[A-Z]$/, '') // Remove trailing single letter tax codes (A, B, etc.)
      .replace(/[^a-zA-Z0-9\s&\-()]/g, '') // remove OCR noise but keep parentheses
      .replace(/\s{2,}/g, ' ') // normalize spacing
      .trim();
  }

  private detectCurrency(text: string): string | undefined {
    // Count currency symbol occurrences
    const poundCount = (text.match(/£/g) || []).length;
    const dollarCount = (text.match(/\$/g) || []).length;
    const euroCount = (text.match(/€/g) || []).length;

    // Also check for currency words
    const lowerText = text.toLowerCase();
    const hasGBP = lowerText.includes('gbp') || lowerText.includes('sterling');
    const hasUSD = lowerText.includes('usd') || lowerText.includes('dollar');
    const hasEUR = lowerText.includes('eur') || lowerText.includes('euro');

    // Determine currency based on symbol frequency and keywords
    if (poundCount > 0 || hasGBP) {
      return 'GBP';
    }
    if (euroCount > 0 || hasEUR) {
      return 'EUR';
    }
    if (dollarCount > 0 || hasUSD) {
      return 'USD';
    }

    return undefined;
  }
}
