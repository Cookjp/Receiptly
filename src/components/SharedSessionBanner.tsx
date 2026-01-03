'use client';

import React from 'react';
import { useReceipt } from '@/contexts/ReceiptContext';

export const SharedSessionBanner: React.FC = () => {
  const { isSharedSession, lastSyncAt, leaveSession } = useReceipt();

  if (!isSharedSession) {
    return null;
  }

  const formatSyncTime = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
      <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
        <div className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
        </div>
        <span className="font-medium">Collaborative Mode</span>
        <span className="text-blue-500 dark:text-blue-400">
          · Synced {formatSyncTime(lastSyncAt)}
        </span>
      </div>
      <button
        onClick={leaveSession}
        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
      >
        Leave
      </button>
    </div>
  );
};

export default SharedSessionBanner;
