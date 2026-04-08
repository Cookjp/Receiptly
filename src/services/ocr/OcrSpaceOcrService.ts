import { OcrService, OcrResult } from './OcrService';

export class OcrSpaceOcrService implements OcrService {
  async processImage(imageData: string): Promise<OcrResult> {
    const response = await fetch('/api/ocr/ocrspace', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageData }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to process receipt image');
    }

    return response.json();
  }
}
