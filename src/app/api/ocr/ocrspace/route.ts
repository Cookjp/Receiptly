import { NextRequest, NextResponse } from 'next/server';
import { ReceiptParserFactory } from '@/services/receiptParser/ReceiptParserServiceFactory';

const OCRSPACE_API_KEY = process.env.OCRSPACE_API_KEY;
const OCRSPACE_API_URL = 'https://api.ocr.space/parse/image';

interface OcrSpaceParsedResult {
    TextOverlay?: {
        Lines: unknown[];
        HasOverlay: boolean;
    };
    TextOrientation?: string;
    FileParseExitCode: number;
    ParsedText: string;
    ErrorMessage?: string;
    ErrorDetails?: string;
}

interface OcrSpaceResponse {
    ParsedResults: OcrSpaceParsedResult[];
    OCRExitCode: number;
    IsErroredOnProcessing: boolean;
    ErrorMessage?: string[];
    ErrorDetails?: string;
    ProcessingTimeInMilliseconds: string;
}

export async function POST(request: NextRequest) {
    if (!OCRSPACE_API_KEY) {
        return NextResponse.json(
            { error: 'OCRSPACE_API_KEY not configured' },
            { status: 500 }
        );
    }

    try {
        const { imageData } = await request.json();

        if (!imageData) {
            return NextResponse.json(
                { error: 'No image data provided' },
                { status: 400 }
            );
        }

        // OCR.space accepts base64 with data URL prefix directly
        const formData = new FormData();
        formData.append('base64Image', imageData);
        formData.append('language', 'eng');
        formData.append('OCREngine', '2');
        formData.append('isTable', 'true');
        formData.append('scale', 'true');

        const response = await fetch(OCRSPACE_API_URL, {
            method: 'POST',
            headers: {
                'apikey': OCRSPACE_API_KEY,
            },
            body: formData,
        });

        const result: OcrSpaceResponse = await response.json();

        if (result.IsErroredOnProcessing || result.OCRExitCode !== 1) {
            const errorMsg = result.ErrorMessage?.join(', ') ||
                             result.ParsedResults?.[0]?.ErrorMessage ||
                             'OCR processing failed';
            return NextResponse.json(
                { error: errorMsg },
                { status: 400 }
            );
        }

        // Extract text from all parsed results
        const text = result.ParsedResults
            .map(r => r.ParsedText)
            .join('\n')
            .trim();

        if (!text) {
            return NextResponse.json(
                { error: 'No text could be extracted from the image' },
                { status: 400 }
            );
        }

        // Parse the OCR text into structured receipt data
        const parserService = ReceiptParserFactory.getReceiptParserService();
        const parsedReceipt = parserService.parseReceipt(text);

        return NextResponse.json({
            text,
            confidence: 85, // OCR.space doesn't provide confidence scores
            parsedReceipt,
        });

    } catch (error) {
        console.error('OCR.space API error:', error);
        return NextResponse.json(
            { error: 'Failed to process receipt' },
            { status: 500 }
        );
    }
}
