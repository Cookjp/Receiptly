'use client';

import { useState } from 'react';
import ImageCapture from '@/components/ImageCapture';
import ReceiptResults from '@/components/ReceiptResults';
import { OcrServiceFactory } from '@/services/ocr/OcrServiceFactory';
import { OcrResult } from '@/services/ocr/OcrService';

export default function Home() {
  const [imageData, setImageData] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const processImage = async (imageData: string) => {
    setImageData(imageData);
    setIsProcessing(true);
    try {
      const ocrService = OcrServiceFactory.getOcrService();
      const result = await ocrService.processImage(imageData);
      console.log('result', result);
      setOcrResult(result);
    } catch (error) {
      console.error('Error processing receipt:', error);
      alert('Failed to process receipt. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetState = () => {
    setImageData(null);
    setOcrResult(null);
  };

  return (
    <div className="grid grid-rows-[auto_1fr_auto] items-center justify-items-center pb-20 gap-8  font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 w-full max-w-2xl items-center">
        {!imageData ? (
          <ImageCapture onCapture={processImage} />
        ) : (
          <button
            onClick={resetState}
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm h-10 px-4"
          >
            Scan Another Receipt
          </button>
        )}
        
        <ReceiptResults 
          result={ocrResult}
          imagePreview={imageData}
          isLoading={isProcessing}
        />
      </main>
      
      <footer className="flex gap-[24px] flex-wrap items-center justify-center text-sm">
        <p>Built with Next.js and Tesseract.js</p>
      </footer>
    </div>
  );
}