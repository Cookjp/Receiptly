'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { ReceiptData } from '@/services/receiptParser/ReceiptParserService';

export interface Person {
  id: string;
  name: string;
}

export interface ItemAttribution {
  itemIndex: number;
  personIds: string[];
}

export interface ReceiptContextType {
  receipt: ReceiptData | null;
  setReceipt: (receipt: ReceiptData | null) => void;
  people: Person[];
  setPeople: (people: Person[]) => void;
  addPerson: (name: string) => void;
  removePerson: (id: string) => void;
  updatePerson: (id: string, name: string) => void;
  attributions: ItemAttribution[];
  setAttributions: (attributions: ItemAttribution[]) => void;
  attributeItem: (itemIndex: number, personIds: string[]) => void;
  getItemAttribution: (itemIndex: number) => string[];
  isItemAttributed: (itemIndex: number) => boolean;
  calculateSplits: () => PersonSplit[];
  clearAll: () => void;
  // Session-related
  sessionId: string | null;
  isSharedSession: boolean;
  lastSyncAt: number | null;
  createSharedSession: () => Promise<string>;
  joinSharedSession: (sessionId: string) => Promise<void>;
  updateSharedAttributions: (itemIndex: number, personIds: string[]) => Promise<void>;
  syncSession: () => Promise<void>;
  leaveSession: () => void;
}

export interface PersonSplit {
  person: Person;
  items: {
    description: string;
    amount: number;
    originalAmount: number;
    splitters: number;
  }[];
  subtotal: number;
  serviceCharge: number;
  total: number;
}

const ReceiptContext = createContext<ReceiptContextType | undefined>(undefined);

export const ReceiptProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [attributions, setAttributions] = useState<ItemAttribution[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);

  const isSharedSession = sessionId !== null;

  const addPerson = (name: string) => {
    setPeople([...people, { id: crypto.randomUUID(), name }]);
  };

  const removePerson = (id: string) => {
    setPeople(people.filter(person => person.id !== id));
    
    // Remove this person from any attributions
    setAttributions(
      attributions.map(attr => ({
        ...attr,
        personIds: attr.personIds.filter(personId => personId !== id)
      }))
    );
  };

  const updatePerson = (id: string, name: string) => {
    setPeople(people.map(person => 
      person.id === id ? { ...person, name } : person
    ));
  };

  const attributeItem = (itemIndex: number, personIds: string[]) => {
    const existingIndex = attributions.findIndex(a => a.itemIndex === itemIndex);
    
    if (existingIndex >= 0) {
      const newAttributions = [...attributions];
      newAttributions[existingIndex] = { itemIndex, personIds };
      setAttributions(newAttributions);
    } else {
      setAttributions([...attributions, { itemIndex, personIds }]);
    }
  };

  const getItemAttribution = (itemIndex: number): string[] => {
    const attribution = attributions.find(a => a.itemIndex === itemIndex);
    return attribution ? attribution.personIds : [];
  };

  const isItemAttributed = (itemIndex: number): boolean => {
    const attribution = attributions.find(a => a.itemIndex === itemIndex);
    return !!attribution && attribution.personIds.length > 0;
  };

  const calculateSplits = (): PersonSplit[] => {
    if (!receipt) return [];

    // Calculate what percentage of the bill each person is responsible for
    const totalItemsAmount = receipt.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    
    const personItems: Record<string, {
      items: {
        description: string;
        amount: number;
        originalAmount: number;
        splitters: number;
      }[];
      subtotalShare: number;
    }> = {};

    // Initialize person records
    people.forEach(person => {
      personItems[person.id] = {
        items: [],
        subtotalShare: 0
      };
    });

    // Assign items to people
    attributions.forEach(attribution => {
      if (attribution.personIds.length === 0) return;
      
      const item = receipt.items[attribution.itemIndex];
      if (!item) return;
      
      const sharePerPerson = (item.totalPrice || 0) / attribution.personIds.length;
      
      attribution.personIds.forEach(personId => {
        if (personItems[personId]) {
          personItems[personId].items.push({
            description: item.description,
            amount: sharePerPerson,
            originalAmount: item.totalPrice || 0,
            splitters: attribution.personIds.length
          });
          personItems[personId].subtotalShare += sharePerPerson;
        }
      });
    });

    // Calculate final splits with tax and service charge proportions
    const result: PersonSplit[] = [];
    
    const subtotal = receipt.subtotal || totalItemsAmount;
    const serviceCharge = receipt.serviceCharge || 0;
    
    people.forEach(person => {
      const personData = personItems[person.id];
      if (!personData) return;
      
      // Calculate the proportion of shared costs
      const proportion = subtotal > 0 ? personData.subtotalShare / subtotal : 0;
      const serviceChargeShare = serviceCharge * proportion;
      
      result.push({
        person,
        items: personData.items,
        subtotal: personData.subtotalShare,
        serviceCharge: serviceChargeShare,
        total: personData.subtotalShare  + serviceChargeShare
      });
    });

    return result;
  };

  const clearAll = () => {
    setReceipt(null);
    setPeople([]);
    setAttributions([]);
    setSessionId(null);
    setLastSyncAt(null);
  };

  const createSharedSession = useCallback(async (): Promise<string> => {
    if (!receipt || people.length === 0) {
      throw new Error('Cannot create session without receipt and people');
    }

    const response = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receipt, people }),
    });

    if (!response.ok) {
      throw new Error('Failed to create session');
    }

    const data = await response.json();
    setSessionId(data.sessionId);
    setLastSyncAt(Date.now());
    return data.shareUrl;
  }, [receipt, people]);

  const joinSharedSession = useCallback(async (id: string): Promise<void> => {
    const response = await fetch(`/api/sessions/${id}`);

    if (!response.ok) {
      throw new Error('Session not found');
    }

    const session = await response.json();
    setReceipt(session.receipt);
    setPeople(session.people);
    setAttributions(session.attributions);
    setSessionId(id);
    setLastSyncAt(Date.now());
  }, []);

  const syncSession = useCallback(async (): Promise<void> => {
    if (!sessionId) return;

    try {
      const response = await fetch(`/api/sessions/${sessionId}`);

      if (!response.ok) {
        if (response.status === 404) {
          setSessionId(null);
          setLastSyncAt(null);
          throw new Error('Session expired');
        }
        throw new Error('Failed to sync session');
      }

      const session = await response.json();
      setAttributions(session.attributions);
      setPeople(session.people);
      setLastSyncAt(Date.now());
    } catch (error) {
      // Re-throw after cleanup
      throw error;
    }
  }, [sessionId]);

  const updateSharedAttributions = useCallback(async (itemIndex: number, personIds: string[]): Promise<void> => {
    // Update local state first (optimistic update)
    const existingIndex = attributions.findIndex(a => a.itemIndex === itemIndex);
    let newAttributions: ItemAttribution[];

    if (existingIndex >= 0) {
      newAttributions = [...attributions];
      newAttributions[existingIndex] = { itemIndex, personIds };
    } else {
      newAttributions = [...attributions, { itemIndex, personIds }];
    }
    setAttributions(newAttributions);

    // If in shared session, sync to server
    if (sessionId) {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attributions: newAttributions }),
      });

      if (!response.ok) {
        throw new Error('Failed to update session');
      }

      setLastSyncAt(Date.now());
    }
  }, [attributions, sessionId]);

  const leaveSession = useCallback(() => {
    setSessionId(null);
    setLastSyncAt(null);
  }, []);

  return (
    <ReceiptContext.Provider
      value={{
        receipt,
        setReceipt,
        people,
        setPeople,
        addPerson,
        removePerson,
        updatePerson,
        attributions,
        setAttributions,
        attributeItem,
        getItemAttribution,
        isItemAttributed,
        calculateSplits,
        clearAll,
        sessionId,
        isSharedSession,
        lastSyncAt,
        createSharedSession,
        joinSharedSession,
        updateSharedAttributions,
        syncSession,
        leaveSession,
      }}
    >
      {children}
    </ReceiptContext.Provider>
  );
};

export const useReceipt = () => {
  const context = useContext(ReceiptContext);
  if (context === undefined) {
    throw new Error('useReceipt must be used within a ReceiptProvider');
  }
  return context;
};