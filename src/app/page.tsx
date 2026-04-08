"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import ImageCapture from "@/components/ImageCapture";
import { OcrServiceFactory, OcrProvider, OcrProviderOption } from "@/services/ocr/OcrServiceFactory";

export default function Home() {
  const router = useRouter();
  const [selectedProvider, setSelectedProvider] = useState<OcrProvider>('tesseract');
  const [providers, setProviders] = useState<OcrProviderOption[]>([]);
  const [tabscannerCredit, setTabscannerCredit] = useState<number | null>(null);

  useEffect(() => {
    // Get available providers
    const availableProviders = OcrServiceFactory.getAvailableProviders();
    setProviders(availableProviders);

    // Load saved preference or default to first available
    const saved = localStorage.getItem('ocrProvider') as OcrProvider | null;
    if (saved && availableProviders.find(p => p.id === saved && p.available)) {
      setSelectedProvider(saved);
    } else {
      const firstAvailable = availableProviders.find(p => p.available);
      if (firstAvailable) {
        setSelectedProvider(firstAvailable.id);
      }
    }

    // Fetch Tabscanner credit if available
    if (availableProviders.find(p => p.id === 'tabscanner' && p.available)) {
      fetch('/api/ocr/tabscanner/credit')
        .then(res => res.json())
        .then(data => {
          if (data.credit !== undefined) {
            setTabscannerCredit(data.credit);
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleProviderChange = (provider: OcrProvider) => {
    setSelectedProvider(provider);
    localStorage.setItem('ocrProvider', provider);
  };

  const processImage = async (imageData: string) => {
    // Store image data in localStorage
    localStorage.setItem("receiptImage", imageData);

    // Navigate to the receipt page
    router.push("/receipt");
  };

  return (
    <div className="grid grid-rows-[auto_1fr_auto] items-center justify-items-center pb-20 gap-8 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 w-full max-w-2xl items-center">
        <ImageCapture onCapture={processImage} />

        {/* OCR Provider Selector */}
        <div className="w-full max-w-md">
          <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2 text-center">
            OCR Provider
          </label>
          <div className="flex gap-2 justify-center flex-wrap">
            {providers.filter(p => p.available).map((provider) => (
              <button
                key={provider.id}
                onClick={() => handleProviderChange(provider.id)}
                className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                  selectedProvider === provider.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title={provider.description}
              >
                {provider.name}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-1">
            {providers.find(p => p.id === selectedProvider)?.description}
            {selectedProvider === 'tabscanner' && tabscannerCredit !== null && (
              <span className="ml-1">({tabscannerCredit} credits remaining)</span>
            )}
          </p>
        </div>
      </main>
    </div>
  );
}
