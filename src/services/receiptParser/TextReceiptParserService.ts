import { LineItem, ReceiptData, ReceiptParserService } from "./ReceiptParserService";

export class TextReceiptParserService implements ReceiptParserService {
  parseReceipt(text: string): ReceiptData {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const items: LineItem[] = [];

    let subtotal: number | undefined;
    let tax: number | undefined;
    let serviceCharge: number | undefined;
    let total: number | undefined;
    let establishmentName: string | undefined;
    let date: string | undefined;
    let address: string | undefined;
    let phoneNumber: string | undefined;

    const pricePattern = /(\d+[.,]\d{2})(?!.*\d)/; // Last float in line
    const qtyPattern = /^(\d+)\s+/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lowerLine = line.toLowerCase();

      // Skip common metadata
      if (i < 5 && (lowerLine.includes('tel') || lowerLine.includes('address') || lowerLine.includes('date'))) {
        continue;
      }

      const priceMatch = line.match(pricePattern);
      if (!priceMatch) continue;

      let rawPrice = parseFloat(priceMatch[1].replace(',', '.'));

      // Heuristic: fix misread large numbers like "1900.00" → likely "100.00"
      if (rawPrice > 300 && rawPrice % 100 < 1) {
        rawPrice = parseFloat((rawPrice / 10).toFixed(2));
      }

      // Check for totals
      if (lowerLine.includes('subtotal') || lowerLine.includes('sub-total') || lowerLine.includes('sub total')) {
        subtotal = rawPrice;
        continue;
      }
      if (lowerLine.includes('tax') || lowerLine.includes('vat') || lowerLine.includes('gst')) {
        tax = rawPrice;
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

      const qtyMatch = description.match(qtyPattern);
      if (qtyMatch) {
        quantity = parseInt(qtyMatch[1]);
        description = description.replace(qtyPattern, '');

        if (quantity > 0) {
          unitPrice = parseFloat((rawPrice / quantity).toFixed(2));
        }
      }

      items.push({
        description: this.cleanDescription(description),
        quantity,
        unitPrice,
        totalPrice: rawPrice
      });
    }

    return {
      items,
      subtotal,
      tax,
      serviceCharge,
      total,
      establishmentName,
      date,
      address,
      phoneNumber
    };
  }

  private cleanDescription(desc: string): string {
    return desc
      .replace(/[^a-zA-Z0-9\s&\-]/g, '') // remove OCR noise
      .replace(/\s{2,}/g, ' ') // normalize spacing
      .trim();
  }
}
