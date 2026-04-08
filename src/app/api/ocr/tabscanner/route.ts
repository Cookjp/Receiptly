import { NextRequest, NextResponse } from 'next/server';

const TABSCANNER_API_KEY = process.env.TABSCANNER_API_KEY;
const TABSCANNER_PROCESS_URL = 'https://api.tabscanner.com/api/2/process';
const TABSCANNER_RESULT_URL = 'https://api.tabscanner.com/api/result';

interface TabscannerProcessResponse {
    success: boolean;
    status: string;
    status_code: number;
    token?: string;
    message?: string;
    code?: number;
}

interface TabscannerLineItem {
    lineTotal: number;
    desc: string;
    descClean: string;
    qty: number;
    price: number;
    unit?: number;
    productCode?: string;
}

interface TabscannerResultResponse {
    success: boolean;
    status: 'done' | 'pending' | 'failed';
    status_code: number;
    code?: number;
    message?: string;
    result?: {
        establishment?: string;
        date?: string;
        total?: number;
        subTotal?: number;
        tax?: number;
        tip?: number;
        serviceCharges?: number[];
        address?: string;
        phoneNumber?: string;
        currency?: string;
        lineItems?: TabscannerLineItem[];
        totalConfidence?: number;
    };
}

export async function POST(request: NextRequest) {
    if (!TABSCANNER_API_KEY) {
        return NextResponse.json(
            { error: 'TABSCANNER_API_KEY not configured' },
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

        // Convert base64 data URL to blob
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // Determine image type from data URL
        const mimeMatch = imageData.match(/^data:(image\/\w+);base64,/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const extension = mimeType.split('/')[1] || 'jpg';

        // Submit image to Tabscanner
        const formData = new FormData();
        const blob = new Blob([buffer], { type: mimeType });
        formData.append('file', blob, `receipt.${extension}`);

        const processResponse = await fetch(TABSCANNER_PROCESS_URL, {
            method: 'POST',
            headers: {
                'apikey': TABSCANNER_API_KEY,
            },
            body: formData,
        });

        const processResult: TabscannerProcessResponse = await processResponse.json();

        if (!processResult.success || !processResult.token) {
            return NextResponse.json(
                { error: processResult.message || 'Failed to process image' },
                { status: 400 }
            );
        }

        // Poll for result (max 30 seconds, polling every 2 seconds)
        const token = processResult.token;
        const maxAttempts = 15;
        let attempts = 0;

        while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000));

            const resultResponse = await fetch(`${TABSCANNER_RESULT_URL}/${token}`, {
                method: 'GET',
                headers: {
                    'apikey': TABSCANNER_API_KEY,
                },
            });

            const resultData: TabscannerResultResponse = await resultResponse.json();

            if (resultData.status === 'done' && resultData.result) {
                // Transform Tabscanner result to our format
                const result = resultData.result;

                const parsedReceipt = {
                    items: (result.lineItems || []).map(item => ({
                        description: item.descClean || item.desc,
                        quantity: item.qty > 0 ? item.qty : undefined,
                        unitPrice: item.price > 0 ? item.price : undefined,
                        totalPrice: item.lineTotal,
                    })),
                    subtotal: result.subTotal,
                    tax: result.tax,
                    serviceCharge: result.serviceCharges?.reduce((a, b) => a + b, 0) || result.tip,
                    total: result.total,
                    establishmentName: result.establishment,
                    date: result.date,
                    address: result.address,
                    phoneNumber: result.phoneNumber,
                    currency: result.currency,
                };

                return NextResponse.json({
                    text: '', // Tabscanner doesn't return raw text
                    confidence: (result.totalConfidence || 0.8) * 100,
                    parsedReceipt,
                });
            }

            if (resultData.status === 'failed') {
                return NextResponse.json(
                    { error: resultData.message || 'OCR processing failed' },
                    { status: 500 }
                );
            }

            attempts++;
        }

        return NextResponse.json(
            { error: 'OCR processing timed out' },
            { status: 504 }
        );

    } catch (error) {
        console.error('Tabscanner API error:', error);
        return NextResponse.json(
            { error: 'Failed to process receipt' },
            { status: 500 }
        );
    }
}
