import { OcrService } from './OcrService';
import { TesseractOcrService } from './TesseractOcrService';

export class OcrServiceFactory {
  static getOcrService(): OcrService {
    // This could be based on configuration or environment variables
    return new TesseractOcrService();
  }
}