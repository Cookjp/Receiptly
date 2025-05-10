'use client';

import { useRouter } from 'next/navigation';
import ImageCapture from '@/components/ImageCapture';

export default function Home() {
  const router = useRouter();

  const processImage = async (imageData: string) => {
    // Store image data in localStorage
    localStorage.setItem('receiptImage', imageData);
    
    // Navigate to the receipt page
    router.push('/receipt');
  };

  return (
    <div className="grid grid-rows-[auto_1fr_auto] items-center justify-items-center pb-20 gap-8 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 w-full max-w-2xl items-center">
        <ImageCapture onCapture={processImage} />
      </main>
      
      <footer className="flex gap-[24px] flex-wrap items-center justify-center text-sm">
        <p>Built with Next.js and Tesseract.js</p>
      </footer>
    </div>
  );
}