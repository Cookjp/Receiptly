import { OcrService } from './OcrService';
import { TabscannerOcrService } from './TabscannerOcrService';
import { TesseractOcrService } from './TesseractOcrService';

export class OcrServiceFactory {
  private static useTabscanner = true; // Set to false to use Tesseract fallback

  static getOcrService(): OcrService {
    if (this.useTabscanner) {
      return new TabscannerOcrService();
    }
    return new TesseractOcrService();
  }
}