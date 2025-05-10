import { ReceiptData } from "../receiptParser/ReceiptParserService";

export interface OcrResult {
    text: string;
    confidence: number;
    parsedReceipt?: ReceiptData;
  }
  
  export interface OcrService {
    processImage(imageData: string): Promise<OcrResult>;
  }