import { ReceiptData } from '@/services/receiptParser/ReceiptParserService';

export interface ValidationIssue {
  type: string;
  message: string;
  severity: 'warning' | 'error';
  field?: string;
  expected?: number;
  actual?: number;
}

export class ValidationService {
  static validateReceipt(receipt: ReceiptData): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    // Check if line items sum up to subtotal
    issues.push(...this.validateSubtotal(receipt));
    
    // Check if subtotal + tax + service charge = total
    issues.push(...this.validateTotal(receipt));
    
    // Check for missing required fields
    issues.push(...this.validateRequiredFields(receipt));
    
    return issues;
  }
  
  private static validateSubtotal(receipt: ReceiptData): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    if (receipt.subtotal !== undefined) {
      const calculatedSubtotal = this.calculateSubtotal(receipt);
      const tolerance = 0.01; // Allow for small rounding differences
      
      if (Math.abs(calculatedSubtotal - receipt.subtotal) > tolerance) {
        issues.push({
          type: 'subtotal_mismatch',
          message: 'Line items total does not match subtotal',
          severity: 'warning',
          field: 'subtotal',
          expected: calculatedSubtotal,
          actual: receipt.subtotal
        });
      }
    }
    
    return issues;
  }
  
  private static validateTotal(receipt: ReceiptData): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    if (receipt.total !== undefined && 
        (receipt.subtotal !== undefined || 
         receipt.tax !== undefined || 
         receipt.serviceCharge !== undefined)) {
      
      const subtotal = receipt.subtotal || 0;
      const tax = receipt.tax || 0;
      const serviceCharge = receipt.serviceCharge || 0;
      const calculatedTotal = subtotal + tax + serviceCharge;
      const tolerance = 0.01; // Allow for small rounding differences
      
      if (Math.abs(calculatedTotal - receipt.total) > tolerance) {
        issues.push({
          type: 'total_mismatch',
          message: 'Subtotal + tax + service charge does not match total',
          severity: 'warning',
          field: 'total',
          expected: calculatedTotal,
          actual: receipt.total
        });
      }
    }
    
    return issues;
  }
  
  private static validateRequiredFields(receipt: ReceiptData): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    if (receipt.items.length === 0) {
      issues.push({
        type: 'empty_receipt',
        message: 'Receipt has no line items',
        severity: 'error'
      });
    } else {
      // Check each line item
      receipt.items.forEach((item, index) => {
        if (!item.description) {
          issues.push({
            type: 'missing_description',
            message: `Item #${index + 1} has no description`,
            severity: 'warning',
            field: `items[${index}].description`
          });
        }
        
        if (item.totalPrice === undefined && (item.quantity === undefined || item.unitPrice === undefined)) {
          issues.push({
            type: 'incomplete_pricing',
            message: `Item #${index + 1} has incomplete pricing information`,
            severity: 'warning',
            field: `items[${index}]`
          });
        }
      });
    }
    
    return issues;
  }
  
  private static calculateSubtotal(receipt: ReceiptData): number {
    return receipt.items.reduce((sum, item) => {
      return sum + (item.totalPrice || 0);
    }, 0);
  }
}