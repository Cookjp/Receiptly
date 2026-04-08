import { OcrService } from './OcrService';
import { OcrSpaceOcrService } from './OcrSpaceOcrService';
import { TabscannerOcrService } from './TabscannerOcrService';
import { TesseractOcrService } from './TesseractOcrService';

export type OcrProvider = 'tesseract' | 'tabscanner' | 'ocrspace';

export interface OcrProviderOption {
  id: OcrProvider;
  name: string;
  description: string;
  available: boolean;
}

export class OcrServiceFactory {
  static getAvailableProviders(): OcrProviderOption[] {
    return [
      {
        id: 'ocrspace',
        name: 'OCR.space',
        description: 'Cloud API - fast & accurate',
        available: !!process.env.NEXT_PUBLIC_OCRSPACE_ENABLED,
      },
      {
        id: 'tabscanner',
        name: 'Tabscanner',
        description: 'Cloud API - receipt specialist',
        available: !!process.env.NEXT_PUBLIC_TABSCANNER_ENABLED,
      },
      {
        id: 'tesseract',
        name: 'Tesseract',
        description: 'Browser-based - works offline',
        available: true, // Always available
      },
    ];
  }

  static getOcrService(provider?: OcrProvider): OcrService {
    // If no provider specified, check localStorage then fall back to env-based selection
    if (!provider && typeof window !== 'undefined') {
      provider = localStorage.getItem('ocrProvider') as OcrProvider | null ?? undefined;
    }

    // Use specified provider if available
    if (provider === 'ocrspace' && process.env.NEXT_PUBLIC_OCRSPACE_ENABLED) {
      return new OcrSpaceOcrService();
    }
    if (provider === 'tabscanner' && process.env.NEXT_PUBLIC_TABSCANNER_ENABLED) {
      return new TabscannerOcrService();
    }
    if (provider === 'tesseract') {
      return new TesseractOcrService();
    }

    // Fall back to env-based priority
    if (process.env.NEXT_PUBLIC_OCRSPACE_ENABLED) {
      return new OcrSpaceOcrService();
    }
    if (process.env.NEXT_PUBLIC_TABSCANNER_ENABLED) {
      return new TabscannerOcrService();
    }
    return new TesseractOcrService();
  }
}