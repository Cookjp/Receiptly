'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useReceipt } from '@/contexts/ReceiptContext';

interface UseSessionPollingOptions {
  interval?: number;
  enabled?: boolean;
}

export function useSessionPolling(options: UseSessionPollingOptions = {}) {
  const { interval = 2000, enabled = true } = options;
  const { sessionId, syncSession } = useReceipt();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isVisibleRef = useRef(true);

  const startPolling = useCallback(() => {
    if (intervalRef.current) return;

    intervalRef.current = setInterval(async () => {
      if (!isVisibleRef.current) return;

      try {
        await syncSession();
      } catch (error) {
        console.error('Session sync failed:', error);
      }
    }, interval);
  }, [syncSession, interval]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState === 'visible';

      if (isVisibleRef.current && sessionId && enabled) {
        // Sync immediately when tab becomes visible
        syncSession().catch(console.error);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [sessionId, syncSession, enabled]);

  useEffect(() => {
    if (sessionId && enabled) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => stopPolling();
  }, [sessionId, enabled, startPolling, stopPolling]);

  return { startPolling, stopPolling };
}
