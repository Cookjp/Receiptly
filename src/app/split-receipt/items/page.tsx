'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useReceipt } from '@/contexts/ReceiptContext';
import { useSessionPolling } from '@/hooks/useSessionPolling';
import SharedSessionBanner from '@/components/SharedSessionBanner';
import Link from 'next/link';

function SplitItemsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    receipt,
    people,
    attributeItem,
    getItemAttribution,
    isItemAttributed,
    isSharedSession,
    joinSharedSession,
    updateSharedAttributions,
  } = useReceipt();
  const [validationMessage, setValidationMessage] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Enable polling when in shared session
  useSessionPolling({ enabled: isSharedSession });

  // Check for session parameter and join if present
  useEffect(() => {
    const sessionId = searchParams.get('session');
    if (sessionId && !isSharedSession && !isJoining) {
      setIsJoining(true);
      joinSharedSession(sessionId)
        .catch((err) => {
          setJoinError(err.message || 'Failed to join session');
        })
        .finally(() => {
          setIsJoining(false);
        });
    }
  }, [searchParams, isSharedSession, isJoining, joinSharedSession]);

  // Redirect to home if no receipt data (only if not joining a session)
  useEffect(() => {
    if (!isJoining && !searchParams.get('session')) {
      if (!receipt) {
        router.push('/');
      } else if (people.length === 0) {
        router.push('/split-receipt');
      }
    }
  }, [receipt, people, router, isJoining, searchParams]);

  const handleAttributeAll = async () => {
    if (!receipt) return;

    // Attribute all items to all people
    const allPersonIds = people.map(p => p.id);
    for (let index = 0; index < receipt.items.length; index++) {
      if (isSharedSession) {
        await updateSharedAttributions(index, allPersonIds);
      } else {
        attributeItem(index, allPersonIds);
      }
    }
  };

  const handleTogglePerson = async (itemIndex: number, personId: string) => {
    const currentAttribution = getItemAttribution(itemIndex);
    let newAttribution: string[];

    if (currentAttribution.includes(personId)) {
      // Remove this person
      newAttribution = currentAttribution.filter(id => id !== personId);
    } else {
      // Add this person
      newAttribution = [...currentAttribution, personId];
    }

    if (isSharedSession) {
      await updateSharedAttributions(itemIndex, newAttribution);
    } else {
      attributeItem(itemIndex, newAttribution);
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

  if (isJoining) {
    return (
      <div className="grid place-items-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-foreground"></div>
          <p className="text-sm text-gray-500">Joining shared session...</p>
        </div>
      </div>
    );
  }

  if (joinError) {
    return (
      <div className="grid place-items-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="text-red-500 text-4xl">!</div>
          <p className="text-lg font-medium">Failed to join session</p>
          <p className="text-sm text-gray-500">{joinError}</p>
          <Link
            href="/"
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Start a new receipt
          </Link>
        </div>
      </div>
    );
  }

  if (!receipt || people.length === 0) {
    return (
      <div className="grid place-items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-foreground"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-rows-[auto_1fr_auto]  font-[family-name:var(--font-geist-sans)]">
      <header className="w-full max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Assign Items</h1>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Select who&apos;s paying for each item
        </p>
      </header>
      
      <main className="w-full max-w-3xl mx-auto my-8">
        {isSharedSession && (
          <div className="mb-4">
            <SharedSessionBanner />
          </div>
        )}
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

export default function SplitItemsPage() {
  return (
    <Suspense
      fallback={
        <div className="grid place-items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-foreground"></div>
        </div>
      }
    >
      <SplitItemsContent />
    </Suspense>
  );
}