'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ReceiptResults from '@/components/ReceiptResults';
import { OcrServiceFactory } from '@/services/ocr/OcrServiceFactory';
import { OcrResult } from '@/services/ocr/OcrService';
import { useReceipt } from '@/contexts/ReceiptContext';

export default function ReceiptPage() {
  const [imageData, setImageData] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const { receipt, setReceipt } = useReceipt();

  useEffect(() => {
    // Always try to get the image from localStorage
    const imageFromStorage = localStorage.getItem('receiptImage');
    
    if (imageFromStorage) {
      setImageData(imageFromStorage);
      
      // If we already have a receipt in context, create an OcrResult from it
      if (receipt && !ocrResult) {
        setOcrResult({
          text: '', // We don't have the raw text anymore, but that's okay
          confidence: 100, // Assuming high confidence since it's already processed
          parsedReceipt: receipt
        });
      } 
      // Otherwise, process the image to get a new receipt
      else if (!receipt) {
        processImage(imageFromStorage);
      }
    } else if (!receipt) {
      // No image in localStorage and no receipt in context, redirect back home
      router.push('/');
    }
  }, [router, receipt, ocrResult]);

  const processImage = async (imageData: string) => {
    setIsProcessing(true);
    try {
      const ocrService = OcrServiceFactory.getOcrService();
      const result = await ocrService.processImage(imageData);
      console.log('result', result);
      setOcrResult(result);
      
      // Store the parsed receipt in context
      if (result.parsedReceipt) {
        setReceipt(result.parsedReceipt);
      }
    } catch (error) {
      console.error('Error processing receipt:', error);
      alert('Failed to process receipt. Please try again.');
      router.push('/');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetState = () => {
    localStorage.removeItem('receiptImage');
    setReceipt(null); // Clear the receipt from context
    router.push('/');
  };

  return (
    <div className="grid grid-rows-[auto_1fr_auto] items-center justify-items-center pb-20 gap-8 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 w-full max-w-2xl items-center">
        <button
          onClick={resetState}
          className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm h-10 px-4"
        >
          Scan Another Receipt
        </button>
        
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