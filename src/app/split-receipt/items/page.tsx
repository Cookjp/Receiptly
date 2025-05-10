'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useReceipt } from '@/contexts/ReceiptContext';
import Link from 'next/link';

export default function SplitItemsPage() {
  const router = useRouter();
  const { receipt, people, attributeItem, getItemAttribution, isItemAttributed } = useReceipt();
  const [validationMessage, setValidationMessage] = useState('');

  // Redirect to home if no receipt data
  useEffect(() => {
    if (!receipt) {
      router.push('/');
    } else if (people.length === 0) {
      router.push('/split-receipt');
    }
  }, [receipt, people, router]);

  const handleAttributeAll = () => {
    if (!receipt) return;
    
    // Attribute all items to all people
    receipt.items.forEach((_, index) => {
      attributeItem(index, people.map(p => p.id));
    });
  };

  const handleTogglePerson = (itemIndex: number, personId: string) => {
    const currentAttribution = getItemAttribution(itemIndex);
    
    if (currentAttribution.includes(personId)) {
      // Remove this person
      attributeItem(
        itemIndex, 
        currentAttribution.filter(id => id !== personId)
      );
    } else {
      // Add this person
      attributeItem(
        itemIndex,
        [...currentAttribution, personId]
      );
    }
  };

  const handleContinue = () => {
    if (!receipt) return;
    
    // Check if all items are attributed
    const unattributedItems = receipt.items.filter((_, index) => !isItemAttributed(index));
    
    if (unattributedItems.length > 0) {
      setValidationMessage(`${unattributedItems.length} item(s) haven't been assigned to anyone`);
      return;
    }
    
    router.push('/split-receipt/result');
  };

  if (!receipt || people.length === 0) {
    return (
      <div className="grid place-items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-foreground"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-rows-[auto_1fr_auto] min-h-screen p-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <header className="w-full max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Assign Items</h1>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Select who&apos;s paying for each item
        </p>
      </header>
      
      <main className="w-full max-w-3xl mx-auto my-8">
        <div className="bg-white dark:bg-black/[.3] p-6 rounded-lg border border-black/[.08] dark:border-white/[.08]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Items from {receipt.establishmentName || 'Unknown'}</h2>
            
            <button
              onClick={handleAttributeAll}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              Split all items equally
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse font-[family-name:var(--font-geist-mono)] text-sm">
              <thead>
                <tr className="border-b border-black/[.08] dark:border-white/[.145]">
                  <th className="py-3 px-4 text-left">Item</th>
                  <th className="py-3 px-4 text-right">Price</th>
                  {people.map(person => (
                    <th key={person.id} className="py-3 px-2 text-center whitespace-nowrap">
                      {person.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {receipt.items.map((item, index) => {
                  const attributedTo = getItemAttribution(index);
                  return (
                    <tr 
                      key={index} 
                      className={`border-b border-black/[.04] dark:border-white/[.07] ${!isItemAttributed(index) ? 'bg-red-50 dark:bg-red-900/10' : ''}`}
                    >
                      <td className="py-3 px-4">{item.description}</td>
                      <td className="py-3 px-4 text-right">${(item.totalPrice || 0).toFixed(2)}</td>
                      
                      {people.map(person => (
                        <td key={person.id} className="py-3 px-2 text-center">
                          <button
                            className={`w-6 h-6 rounded-md transition-colors ${
                              attributedTo.includes(person.id)
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600'
                            }`}
                            onClick={() => handleTogglePerson(index, person.id)}
                            aria-label={`Toggle ${person.name} for ${item.description}`}
                          >
                            {attributedTo.includes(person.id) ? (
                              <svg viewBox="0 0 24 24" width="14" height="14" className="mx-auto" stroke="currentColor" fill="none">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            ) : null}
                          </button>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-black/[.08] dark:border-white/[.145] font-medium">
                  <td className="py-3 px-4">Total</td>
                  <td className="py-3 px-4 text-right">${(receipt.total || 0).toFixed(2)}</td>
                  <td colSpan={people.length}></td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          {validationMessage && (
            <p className="mt-4 text-sm text-red-500">{validationMessage}</p>
          )}
          
          <div className="flex justify-between items-center mt-8">
            <Link href="/split-receipt" className="text-blue-600 dark:text-blue-400 hover:underline">
              ← Back to people
            </Link>
            
            <button
              onClick={handleContinue}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-colors flex items-center gap-2"
            >
              <span>Calculate Split</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </svg>
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