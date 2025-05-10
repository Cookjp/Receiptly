import { createWorker } from 'tesseract.js';
import { OcrService, OcrResult } from './OcrService';
import { ReceiptParserFactory } from '../receiptParser/ReceiptParserServiceFactory';

export class TesseractOcrService implements OcrService {
  async processImage(imageData: string): Promise<OcrResult> {
    try {
      // Perform OCR with Tesseract
      const worker = await createWorker('eng');
      const result = await worker.recognize(imageData, {}, {blocks: true});
      await worker.terminate();
      
      // Parse the OCR text into structured receipt data
      const parserService = ReceiptParserFactory.getReceiptParserService();
      const parsedReceipt = parserService.parseReceipt(result.data.text);
      
      return {
        text: result.data.text,
        confidence: result.data.confidence,
        parsedReceipt
      };
    } catch (error) {
      console.error('Error processing image with Tesseract:', error);
      throw new Error('Failed to process receipt image');
    }
  }
}