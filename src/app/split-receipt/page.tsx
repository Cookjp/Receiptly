'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useReceipt } from '@/contexts/ReceiptContext';
import Link from 'next/link';

export default function SplitReceiptPage() {
  const router = useRouter();
  const { receipt, people, addPerson, removePerson, updatePerson } = useReceipt();
  const [newPersonName, setNewPersonName] = useState('');
  const [validationMessage, setValidationMessage] = useState('');

  // Redirect to home if no receipt data
  useEffect(() => {
    if (!receipt) {
      router.push('/');
    }
  }, [receipt, router]);

  const handleAddPerson = () => {
    if (!newPersonName.trim()) {
      setValidationMessage('Please enter a name');
      return;
    }
    
    addPerson(newPersonName.trim());
    setNewPersonName('');
    setValidationMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddPerson();
    }
  };

  const handleRemovePerson = (id: string) => {
    removePerson(id);
  };

  const handleUpdatePerson = (id: string, name: string) => {
    updatePerson(id, name);
  };

  const handleContinue = () => {
    if (people.length === 0) {
      setValidationMessage('Add at least one person to continue');
      return;
    }
    
    router.push('/split-receipt/items');
  };

  if (!receipt) {
    return (
      <div className="grid place-items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-foreground"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-rows-[auto_1fr_auto] font-[family-name:var(--font-geist-sans)]">
      <header className="w-full max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Split Receipt</h1>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Add the people who will split this receipt
        </p>
      </header>
      
      <main className="w-full max-w-2xl mx-auto my-8">
        <div className="bg-white dark:bg-black/[.3] p-6 rounded-lg border border-black/[.08] dark:border-white/[.08]">
          <h2 className="text-lg font-semibold mb-4">{receipt.establishmentName && `Receipt from ${receipt.establishmentName}`}</h2>
          
          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-2">Total Amount: <span className="font-[family-name:var(--font-geist-mono)] font-semibold text-black dark:text-white">${(receipt.total || 0).toFixed(2)}</span></p>
            <p className="text-sm text-gray-500">{receipt.date && 'Date: ' + receipt.date}</p>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Who&apos;s splitting this receipt?</label>
            
            <div className="space-y-2">
              {people.map((person) => (
                <div key={person.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={person.name}
                    onChange={(e) => handleUpdatePerson(person.id, e.target.value)}
                    className="flex-grow border dark:border-gray-700 bg-transparent px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Person's name"
                  />
                  <button
                    onClick={() => handleRemovePerson(person.id)}
                    className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    aria-label="Remove person"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18"></path>
                      <path d="m6 6 12 12"></path>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            
            <div className="mt-4 flex items-stretch gap-2">
              <input
                type="text"
                value={newPersonName}
                onChange={(e) => setNewPersonName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-grow border dark:border-gray-700 bg-transparent px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Add a person"
              />
              <button
                onClick={handleAddPerson}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Add
              </button>
            </div>
            
            {validationMessage && (
              <p className="mt-2 text-sm text-red-500">{validationMessage}</p>
            )}
          </div>
          
          <div className="flex justify-between items-center mt-8">
            <Link href="/receipt" className="text-blue-600 dark:text-blue-400 hover:underline">
              ← Back to scanning
            </Link>
            
            <button
              onClick={handleContinue}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-colors flex items-center gap-2"
              disabled={people.length === 0}
            >
              <span>Continue to Items</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </svg>
            </button>
          </div>
        </div>
      </main>
      
      <footer className="w-full max-w-2xl mx-auto text-center text-sm text-gray-500">
        <p>Receiptly - Split bills easily</p>
      </footer>
    </div>
  );
}