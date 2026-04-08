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

    // Check if subtotal + service charge = total (subtotal is now always calculated from items)
    issues.push(...this.validateTotal(receipt));

    // Check for missing required fields
    issues.push(...this.validateRequiredFields(receipt));

    return issues;
  }
  
  private static validateTotal(receipt: ReceiptData): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    if (receipt.total !== undefined && 
        (receipt.subtotal !== undefined || 
         receipt.serviceCharge !== undefined)) {
      
      const subtotal = receipt.subtotal || 0;
      const serviceCharge = receipt.serviceCharge || 0;
      const calculatedTotal = subtotal  + serviceCharge;
      const tolerance = 0.01; // Allow for small rounding differences
      
      if (Math.abs(calculatedTotal - receipt.total) > tolerance) {
        issues.push({
          type: 'total_mismatch',
          message: `Items sum (${subtotal.toFixed(2)}) + service charge (${serviceCharge.toFixed(2)}) = ${calculatedTotal.toFixed(2)}, but receipt total is ${receipt.total.toFixed(2)}`,
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
  
}