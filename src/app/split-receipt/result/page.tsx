'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useReceipt, PersonSplit } from '@/contexts/ReceiptContext';
import Link from 'next/link';

export default function SplitResultPage() {
  const router = useRouter();
  const { receipt, people, calculateSplits, clearAll } = useReceipt();
  const [splits, setSplits] = useState<PersonSplit[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  useEffect(() => {
    if (!receipt) {
      router.push('/');
    } else if (people.length === 0) {
      router.push('/split-receipt');
    } else {
      const calculated = calculateSplits();
      setSplits(calculated);
      
      // Set first person as active tab
      if (calculated.length > 0 && !activeTab) {
        setActiveTab(calculated[0].person.id);
      }
    }
  }, [receipt, people, calculateSplits, router, activeTab]);

  const handleStartOver = () => {
    clearAll();
    router.push('/');
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getActiveSplit = (): PersonSplit | undefined => {
    return splits.find(split => split.person.id === activeTab);
  };

  if (!receipt || people.length === 0) {
    return (
      <div className="grid place-items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-foreground"></div>
      </div>
    );
  }

  const activeSplit = getActiveSplit();

  return (
    <div className="grid grid-rows-[auto_1fr_auto] font-[family-name:var(--font-geist-sans)]">
      <header className="w-full max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Split Results</h1>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Here&apos;s how much each person owes
        </p>
      </header>
      
      <main className="w-full max-w-3xl mx-auto my-8">
        <div className="bg-white dark:bg-black/[.3] p-6 rounded-lg border border-black/[.08] dark:border-white/[.08]">
          <h2 className="text-lg font-semibold mb-6">
            Receipt from {receipt.establishmentName || 'Unknown'} 
            <span className="text-sm font-normal text-gray-500 ml-2">
              {receipt.date || 'Unknown'}
            </span>
          </h2>
          
          {/* Summary tiles for all people */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {splits.map(split => (
              <button
                key={split.person.id}
                className={`p-4 rounded-lg border transition-colors ${
                  split.person.id === activeTab 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                    : 'border-black/[.08] dark:border-white/[.08] hover:bg-black/[.02] dark:hover:bg-white/[.02]'
                }`}
                onClick={() => setActiveTab(split.person.id)}
              >
                <div className="font-medium">{split.person.name}</div>
                <div className="text-2xl font-[family-name:var(--font-geist-mono)] font-bold mt-2">
                  {formatCurrency(split.total)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {split.items.length} item{split.items.length !== 1 ? 's' : ''}
                </div>
              </button>
            ))}
          </div>
          
          {/* Detailed view for selected person */}
          {activeSplit && (
            <div className="border border-black/[.08] dark:border-white/[.08] rounded-lg">
              <div className="border-b border-black/[.08] dark:border-white/[.08] p-4 flex justify-between items-center">
                <h3 className="font-medium">{activeSplit.person.name}&apos;s breakdown</h3>
                <div className="text-lg font-[family-name:var(--font-geist-mono)] font-bold">
                  {formatCurrency(activeSplit.total)}
                </div>
              </div>
              
              <div className="p-4">
                <div className="space-y-3">
                  {activeSplit.items.map((item, index) => (
                    <div key={index} className="flex justify-between">
                      <div className="flex flex-col">
                        <span>{item.description}</span>
                        {item.splitters > 1 && (
                          <span className="text-xs text-gray-500">
                            ({formatCurrency(item.originalAmount)} ÷ {item.splitters})
                          </span>
                        )}
                      </div>
                      <div className="font-[family-name:var(--font-geist-mono)]">
                        {formatCurrency(item.amount)}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-4 border-t border-black/[.04] dark:border-white/[.04]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-[family-name:var(--font-geist-mono)]">
                      {formatCurrency(activeSplit.subtotal)}
                    </span>
                  </div>
                  
                  {activeSplit.tax > 0 && (
                    <div className="flex justify-between mt-2">
                      <span>Tax</span>
                      <span className="font-[family-name:var(--font-geist-mono)]">
                        {formatCurrency(activeSplit.tax)}
                      </span>
                    </div>
                  )}
                  
                  {activeSplit.serviceCharge > 0 && (
                    <div className="flex justify-between mt-2">
                      <span>Service Charge</span>
                      <span className="font-[family-name:var(--font-geist-mono)]">
                        {formatCurrency(activeSplit.serviceCharge)}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between mt-3 pt-3 border-t border-black/[.08] dark:border-white/[.08] font-bold">
                    <span>Total</span>
                    <span className="font-[family-name:var(--font-geist-mono)]">
                      {formatCurrency(activeSplit.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-between items-center mt-8">
            <Link href="/split-receipt/items" className="text-blue-600 dark:text-blue-400 hover:underline">
              ← Back to items
            </Link>
            
            <button
              onClick={handleStartOver}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-colors"
            >
              Start Over
            </button>
          </div>
        </div>
      </main>
      
      <footer className="w-full max-w-3xl mx-auto text-center text-sm text-gray-500">
        <p>Receiptly - Split bills easily</p>
      </footer>
    </div>
  );
}