export interface LineItem {
  description: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice: number;
}

export interface ReceiptData {
  items: LineItem[];
  subtotal?: number;
  serviceCharge?: number;
  total?: number;
  establishmentName?: string;
  date?: string;
  address?: string;
  phoneNumber?: string;
}

export interface ReceiptParserService {
  parseReceipt(text: string): ReceiptData;
}

