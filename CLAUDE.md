# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn install         # Install dependencies
yarn dev             # Start dev server with Turbopack (http://localhost:3000)
yarn build           # Production build
yarn lint            # Run ESLint
```

## Architecture

Receiptly is a receipt scanning and bill splitting app built with Next.js 15 (App Router), TypeScript, Tailwind CSS 4, and Tesseract.js for browser-based OCR.

### User Flow (5 Pages)

1. **`/`** - Image capture (camera/file upload), stores base64 in localStorage
2. **`/receipt`** - OCR processing, editable receipt table with validation
3. **`/split-receipt`** - Add people who will split the bill
4. **`/split-receipt/items`** - Assign items to people with fractional splits (1, 0.75, 0.5, 0.33, 0.25)
5. **`/split-receipt/result`** - Final breakdown showing each person's total

### Key Architecture Patterns

**Global State**: `ReceiptContext` (`/src/contexts/ReceiptContext.tsx`) manages all state via React Context:
- `receipt` - Parsed receipt data (items, tax, subtotal, total)
- `people` - People splitting the bill
- `attributions` - Maps items to people with fractional ownership
- `calculateSplits()` - Computes final amounts, proportionally splitting tax/service charge

**Services Layer** (`/src/services/`): Factory pattern with interfaces for extensibility:
- `OcrServiceFactory` → `TesseractOcrService` - Browser-based OCR via tesseract.js
- `ReceiptParserFactory` → `TextReceiptParserService` - Regex-based line parsing
- `ValidationService` - Validates receipt math (subtotal, total calculations)

### Data Models

```typescript
LineItem { description, quantity?, unitPrice?, totalPrice }
ReceiptData { items, subtotal?, tax?, serviceCharge?, total?, establishmentName?, date? }
```

### Important Notes

- All components are client-side (`'use client'`) - no server components
- No backend required - uses localStorage and browser APIs only
- OCR runs entirely in browser via Tesseract.js WASM
- Validation issues are non-blocking warnings, except critical errors prevent flow continuation
- Tax and service charge are split proportionally by each person's subtotal percentage
