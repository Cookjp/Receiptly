'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
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
  addPerson: (name: string) => void;
  removePerson: (id: string) => void;
  updatePerson: (id: string, name: string) => void;
  attributions: ItemAttribution[];
  attributeItem: (itemIndex: number, personIds: string[]) => void;
  getItemAttribution: (itemIndex: number) => string[];
  isItemAttributed: (itemIndex: number) => boolean;
  calculateSplits: () => PersonSplit[];
  clearAll: () => void;
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
  tax: number;
  serviceCharge: number;
  total: number;
}

const ReceiptContext = createContext<ReceiptContextType | undefined>(undefined);

export const ReceiptProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [attributions, setAttributions] = useState<ItemAttribution[]>([]);

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
    const tax = receipt.tax || 0;
    const serviceCharge = receipt.serviceCharge || 0;
    
    people.forEach(person => {
      const personData = personItems[person.id];
      if (!personData) return;
      
      // Calculate the proportion of shared costs
      const proportion = subtotal > 0 ? personData.subtotalShare / subtotal : 0;
      const taxShare = tax * proportion;
      const serviceChargeShare = serviceCharge * proportion;
      
      result.push({
        person,
        items: personData.items,
        subtotal: personData.subtotalShare,
        tax: taxShare,
        serviceCharge: serviceChargeShare,
        total: personData.subtotalShare + taxShare + serviceChargeShare
      });
    });

    return result;
  };

  const clearAll = () => {
    setReceipt(null);
    setPeople([]);
    setAttributions([]);
  };

  return (
    <ReceiptContext.Provider
      value={{
        receipt,
        setReceipt,
        people,
        addPerson,
        removePerson,
        updatePerson,
        attributions,
        attributeItem,
        getItemAttribution,
        isItemAttributed,
        calculateSplits,
        clearAll
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