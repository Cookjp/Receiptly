import { OcrService } from './OcrService';
import { TabscannerOcrService } from './TabscannerOcrService';
import { TesseractOcrService } from './TesseractOcrService';

export class OcrServiceFactory {
  static getOcrService(): OcrService {
    if (process.env.NEXT_PUBLIC_TABSCANNER_ENABLED) {
      return new TabscannerOcrService();
    }
    return new TesseractOcrService();
  }
}