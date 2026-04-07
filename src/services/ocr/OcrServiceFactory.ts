import { OcrService } from './OcrService';
import { OcrSpaceOcrService } from './OcrSpaceOcrService';
import { TabscannerOcrService } from './TabscannerOcrService';
import { TesseractOcrService } from './TesseractOcrService';

export class OcrServiceFactory {
  static getOcrService(): OcrService {
    if (process.env.NEXT_PUBLIC_OCRSPACE_ENABLED) {
      return new OcrSpaceOcrService();
    }
    if (process.env.NEXT_PUBLIC_TABSCANNER_ENABLED) {
      return new TabscannerOcrService();
    }
    return new TesseractOcrService();
  }
}