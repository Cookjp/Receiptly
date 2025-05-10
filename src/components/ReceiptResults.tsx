'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OcrResult } from '../services/ocr/OcrService';
import { ReceiptData, LineItem } from '@/services/receiptParser/ReceiptParserService';
import { ValidationService, ValidationIssue } from '@/services/validation/ValidationService';
import { useReceipt } from '@/contexts/ReceiptContext';

// interface QuantityField { 
//   type: 'quantity';
//   value: number;
// }

// interface UnitPriceField { 
//   type: 'unitPrice';
//   value: number;
// }

// interface TotalPriceField { 
//   type: 'totalPrice';
//   value: number;
// }

// interface DescriptionField { 
//   type: 'description';
//   value: string;
// }

// interface SubtotalField { 
//   type: 'subtotal';
//   value: number;
// }

// interface TaxField { 
//   type: 'tax';
//   value: number;
// }

// interface ServiceChargeField { 
//   type: 'serviceCharge';
//   value: number;
// }

// interface TotalField { 
//   type: 'total';
//   value: number;
// }

// type Field =  QuantityField | UnitPriceField | TotalPriceField | DescriptionField | SubtotalField | TaxField | ServiceChargeField | TotalField;

interface ReceiptResultsProps {
  result: OcrResult | null;
  imagePreview: string | null;
  isLoading: boolean;
}

const ReceiptResults: React.FC<ReceiptResultsProps> = ({ 
  result, 
  imagePreview, 
  isLoading 
}) => {
  const router = useRouter();
  const { setReceipt } = useReceipt();

  const [editedReceipt, setEditedReceipt] = useState<ReceiptData | null>(null);
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  
  // Sync the edited receipt with the OCR result
  useEffect(() => {
    if (result?.parsedReceipt) {
      const receiptData = JSON.parse(JSON.stringify(result.parsedReceipt));
      setEditedReceipt(receiptData);
      
      // Validate the receipt
      setValidationIssues(ValidationService.validateReceipt(receiptData));
    } else {
      setEditedReceipt(null);
      setValidationIssues([]);
    }
    setEditingItem(null);
    setEditingField(null);
    setIsEditingHeader(false);
  }, [result]);
  
  // Validate receipt whenever it changes
  useEffect(() => {
    if (editedReceipt) {
      setValidationIssues(ValidationService.validateReceipt(editedReceipt));
    }
  }, [editedReceipt]);
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-4 p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-foreground"></div>
        <p className="font-[family-name:var(--font-geist-mono)] text-sm">Processing receipt...</p>
      </div>
    );
  }

  if (!imagePreview && !result) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleItemChange = (index: number, field: keyof LineItem, value: any) => {
    if (!editedReceipt) return;
    
    const updatedItems = [...editedReceipt.items];
    
    // Handle numeric values
    if (field === 'quantity' || field === 'unitPrice' || field === 'totalPrice') {
      const numValue = parseFloat(value);
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: isNaN(numValue) ? 0 : numValue
      };
      
      // Update the total price if quantity or unit price changes
      if (field === 'quantity' || field === 'unitPrice') {
        const qty = field === 'quantity' ? 
          (isNaN(numValue) ? 0 : numValue) : 
          (updatedItems[index].quantity || 1);
          
        const unitPrice = field === 'unitPrice' ? 
          (isNaN(numValue) ? 0 : numValue) : 
          (updatedItems[index].unitPrice || 0);
          
        updatedItems[index].totalPrice = qty * unitPrice;
      }
      
      // Update unit price if total price and quantity changes
      if (field === 'totalPrice' && updatedItems[index].quantity && updatedItems[index].quantity > 0) {
        updatedItems[index].unitPrice = (isNaN(numValue) ? 0 : numValue) / updatedItems[index].quantity;
      }
    } else {
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value
      };
    }
    
    setEditedReceipt({
      ...editedReceipt,
      items: updatedItems
    });
  };
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleHeaderChange = (field: keyof ReceiptData, value: any) => {
    if (!editedReceipt) return;
    
    if (field === 'subtotal' || field === 'tax' || field === 'serviceCharge' || field === 'total') {
      const numValue = parseFloat(value);
      setEditedReceipt({
        ...editedReceipt,
        [field]: isNaN(numValue) ? undefined : numValue
      });
    } else {
      setEditedReceipt({
        ...editedReceipt,
        [field]: value
      });
    }
  };
  
  const handleEditStart = (index: number, field: string) => {
    setEditingItem(index);
    setEditingField(field);
    setIsEditingHeader(false);
  };
  
  const handleHeaderEditStart = (field: string) => {
    setEditingItem(null);
    setEditingField(field);
    setIsEditingHeader(true);
  };
  
  const handleEditEnd = () => {
    setEditingItem(null);
    setEditingField(null);
    setIsEditingHeader(false);
  };
  
  const addNewItem = () => {
    if (!editedReceipt) return;
    
    const newItem: LineItem = {
      description: 'New Item',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0
    };
    
    setEditedReceipt({
      ...editedReceipt,
      items: [...editedReceipt.items, newItem]
    });
    
    // Start editing the description of the new item
    setTimeout(() => {
      setEditingItem(editedReceipt.items.length);
      setEditingField('description');
    }, 50);
  };
  
  const deleteItem = (index: number) => {
    if (!editedReceipt) return;
    
    const updatedItems = [...editedReceipt.items];
    updatedItems.splice(index, 1);
    
    setEditedReceipt({
      ...editedReceipt,
      items: updatedItems
    });
  };
  
  const parseStringToNumber = (value: string): number => {
    const cleaned = value.replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  const formatNumber = (value: number | undefined): string => {
    if (value === undefined) return '-';
    return value.toFixed(2);
  };
  
  const fixSubtotalIssue = () => {
    if (!editedReceipt) return;
    
    const issue = validationIssues.find(i => i.type === 'subtotal_mismatch');
    if (issue && issue.expected !== undefined) {
      setEditedReceipt({
        ...editedReceipt,
        subtotal: issue.expected
      });
    }
  };
  
  const fixTotalIssue = () => {
    if (!editedReceipt) return;
    
    const issue = validationIssues.find(i => i.type === 'total_mismatch');
    if (issue && issue.expected !== undefined) {
      setEditedReceipt({
        ...editedReceipt,
        total: issue.expected
      });
    }
  };
  
  const getIssueForField = (field: string): ValidationIssue | undefined => {
    return validationIssues.find(issue => issue.field === field);
  };

  const handleAcceptReceipt = () => {
    if (editedReceipt) {
      setReceipt(editedReceipt);
      router.push('/split-receipt');
    }
  };
  
  const EditableCell = ({ 
    value, 
    isEditing, 
    onChange, 
    onEditStart, 
    onEditEnd, 
    isNumber = false,
    className = "",
    field = ""
  }: { 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any; 
    isEditing: boolean; 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onChange: (value: any) => void; 
    onEditStart: () => void; 
    onEditEnd: () => void; 
    isNumber?: boolean; 
    className?: string;
    field?: string;
  }) => {
    const issue = field ? getIssueForField(field) : undefined;
    
    if (isEditing) {
      return (
        <input
          type={isNumber ? "number" : "text"}
          value={value !== undefined ? value : ''}
          onChange={(e) => onChange(isNumber ? parseStringToNumber(e.target.value) : e.target.value)}
          onBlur={onEditEnd}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onEditEnd();
            if (e.key === 'Escape') onEditEnd();
          }}
          autoFocus
          step={isNumber ? "0.01" : undefined}
          min={isNumber ? "0" : undefined}
          className={`w-full border dark:border-gray-700 bg-transparent px-2 py-1 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${className} ${issue ? 'border-yellow-500 dark:border-yellow-400' : ''}`}
        />
      );
    }
    
    return (
      <div 
        onClick={onEditStart}
        className={`cursor-pointer hover:bg-black/[.03] dark:hover:bg-white/[.03] px-2 py-1 rounded ${className} ${issue ? 'text-yellow-600 dark:text-yellow-400' : ''}`}
        title={issue?.message}
      >
        {isNumber && value !== undefined ? formatNumber(value) : (value || '-')}
        {issue && <span className="ml-1 text-yellow-500">⚠️</span>}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl">
      {imagePreview && (
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-semibold">Receipt Image</h3>
          <div className="relative border border-solid border-black/[.08] dark:border-white/[.145] rounded-lg overflow-hidden">
            <img 
              src={imagePreview} 
              alt="Receipt" 
              className="w-full object-contain max-h-[400px]" 
            />
          </div>
        </div>
      )}
      
      {editedReceipt && (
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Receipt Details</h3>
            <span className="text-xs text-gray-500">(Click on any value to edit)</span>
          </div>
          
          {validationIssues.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded-lg text-sm">
              <div className="font-medium text-yellow-700 dark:text-yellow-400 mb-1">
                Found {validationIssues.length} issue{validationIssues.length !== 1 ? 's' : ''} with this receipt:
              </div>
              <ul className="list-disc pl-5 space-y-1 text-yellow-600 dark:text-yellow-300">
                {validationIssues.map((issue, index) => (
                  <li key={index} className="flex items-center justify-between">
                    <span>{issue.message}</span>
                    {issue.type === 'subtotal_mismatch' && issue.expected !== undefined && (
                      <button 
                        onClick={fixSubtotalIssue}
                        className="text-xs bg-yellow-100 dark:bg-yellow-800 hover:bg-yellow-200 dark:hover:bg-yellow-700 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded transition-colors"
                      >
                        Fix (set to {formatNumber(issue.expected)})
                      </button>
                    )}
                    {issue.type === 'total_mismatch' && issue.expected !== undefined && (
                      <button 
                        onClick={fixTotalIssue}
                        className="text-xs bg-yellow-100 dark:bg-yellow-800 hover:bg-yellow-200 dark:hover:bg-yellow-700 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded transition-colors"
                      >
                        Fix (set to {formatNumber(issue.expected)})
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          
          <div className="overflow-x-auto mt-2">
            <table className="w-full border-collapse font-[family-name:var(--font-geist-mono)] text-sm">
              <thead>
                <tr className="border-b border-black/[.08] dark:border-white/[.145]">
                  <th className="py-2 px-4 text-left">Item</th>
                  <th className="py-2 px-4 text-right">Qty</th>
                  <th className="py-2 px-4 text-right">Unit Price</th>
                  <th className="py-2 px-4 text-right">Total</th>
                  <th className="py-2 px-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {editedReceipt.items.map((item, index) => (
                  <tr key={index} className="border-b border-black/[.04] dark:border-white/[.07]">
                    <td className="py-2 px-4">
                      <EditableCell 
                        value={item.description} 
                        isEditing={editingItem === index && editingField === 'description'} 
                        onChange={(value) => handleItemChange(index, 'description', value)} 
                        onEditStart={() => handleEditStart(index, 'description')} 
                        onEditEnd={handleEditEnd}
                        field={`items[${index}].description`}
                      />
                    </td>
                    <td className="py-2 px-4 text-right">
                      <EditableCell 
                        value={item.quantity} 
                        isEditing={editingItem === index && editingField === 'quantity'} 
                        onChange={(value) => handleItemChange(index, 'quantity', value)} 
                        onEditStart={() => handleEditStart(index, 'quantity')} 
                        onEditEnd={handleEditEnd}
                        isNumber={true}
                        className="text-right"
                        field={`items[${index}].quantity`}
                      />
                    </td>
                    <td className="py-2 px-4 text-right">
                      <EditableCell 
                        value={item.unitPrice} 
                        isEditing={editingItem === index && editingField === 'unitPrice'} 
                        onChange={(value) => handleItemChange(index, 'unitPrice', value)} 
                        onEditStart={() => handleEditStart(index, 'unitPrice')} 
                        onEditEnd={handleEditEnd}
                        isNumber={true}
                        className="text-right"
                        field={`items[${index}].unitPrice`}
                      />
                    </td>
                    <td className="py-2 px-4 text-right">
                      <EditableCell 
                        value={item.totalPrice} 
                        isEditing={editingItem === index && editingField === 'totalPrice'} 
                        onChange={(value) => handleItemChange(index, 'totalPrice', value)} 
                        onEditStart={() => handleEditStart(index, 'totalPrice')} 
                        onEditEnd={handleEditEnd}
                        isNumber={true}
                        className="text-right"
                        field={`items[${index}].totalPrice`}
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <button
                        onClick={() => deleteItem(index)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                        title="Delete item"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5} className="py-2 px-4">
                    <button
                      onClick={addNewItem}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                    >
                      + Add Item
                    </button>
                  </td>
                </tr>
                <tr>
                  <td colSpan={3} className="py-2 px-4 text-right font-medium">Subtotal</td>
                  <td className="py-2 px-4 text-right">
                    <EditableCell 
                      value={editedReceipt.subtotal} 
                      isEditing={isEditingHeader && editingField === 'subtotal'} 
                      onChange={(value) => handleHeaderChange('subtotal', value)} 
                      onEditStart={() => handleHeaderEditStart('subtotal')} 
                      onEditEnd={handleEditEnd}
                      isNumber={true}
                      className="text-right"
                      field="subtotal"
                    />
                  </td>
                  <td></td>
                </tr>
                <tr>
                  <td colSpan={3} className="py-2 px-4 text-right font-medium">Tax</td>
                  <td className="py-2 px-4 text-right">
                    <EditableCell 
                      value={editedReceipt.tax} 
                      isEditing={isEditingHeader && editingField === 'tax'} 
                      onChange={(value) => handleHeaderChange('tax', value)} 
                      onEditStart={() => handleHeaderEditStart('tax')} 
                      onEditEnd={handleEditEnd}
                      isNumber={true}
                      className="text-right"
                      field="tax"
                    />
                  </td>
                  <td></td>
                </tr>
                <tr>
                  <td colSpan={3} className="py-2 px-4 text-right font-medium">Service Charge</td>
                  <td className="py-2 px-4 text-right">
                    <EditableCell 
                      value={editedReceipt.serviceCharge} 
                      isEditing={isEditingHeader && editingField === 'serviceCharge'} 
                      onChange={(value) => handleHeaderChange('serviceCharge', value)} 
                      onEditStart={() => handleHeaderEditStart('serviceCharge')} 
                      onEditEnd={handleEditEnd}
                      isNumber={true}
                      className="text-right"
                      field="serviceCharge"
                    />
                  </td>
                  <td></td>
                </tr>
                <tr className="border-t border-black/[.08] dark:border-white/[.145]">
                  <td colSpan={3} className="py-2 px-4 text-right font-medium">Total</td>
                  <td className="py-2 px-4 text-right font-bold">
                    <EditableCell 
                      value={editedReceipt.total} 
                      isEditing={isEditingHeader && editingField === 'total'} 
                      onChange={(value) => handleHeaderChange('total', value)} 
                      onEditStart={() => handleHeaderEditStart('total')} 
                      onEditEnd={handleEditEnd}
                      isNumber={true}
                      className="text-right font-bold"
                      field="total"
                    />
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleAcceptReceipt}
              disabled={validationIssues.some(issue => issue.severity === 'error')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span>Accept Receipt & Continue</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {result && (
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Raw Extracted Text</h3>
            <span className="text-xs font-[family-name:var(--font-geist-mono)] bg-black/[.05] dark:bg-white/[.06] px-2 py-1 rounded">
              Confidence: {result.confidence.toFixed(2)}%
            </span>
          </div>
          <details className="group">
            <summary className="list-none flex items-center cursor-pointer hover:opacity-80">
              <div className="mr-2 text-xs">▶</div>
              <span className="text-sm text-gray-500">Show raw text</span>
            </summary>
            <pre className="whitespace-pre-wrap bg-black/[.03] dark:bg-white/[.03] p-4 rounded-lg font-[family-name:var(--font-geist-mono)] text-sm overflow-x-auto mt-2">
              {result.text}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default ReceiptResults;