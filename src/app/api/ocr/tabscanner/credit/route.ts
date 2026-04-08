import { NextResponse } from 'next/server';

const TABSCANNER_API_KEY = process.env.TABSCANNER_API_KEY;

export async function GET() {
    if (!TABSCANNER_API_KEY) {
        return NextResponse.json(
            { error: 'TABSCANNER_API_KEY not configured' },
            { status: 500 }
        );
    }

    try {
        const response = await fetch('https://api.tabscanner.com/api/credit', {
            method: 'GET',
            headers: {
                'apikey': TABSCANNER_API_KEY,
            },
        });

        const credit = await response.json();

        return NextResponse.json({ credit });
    } catch (error) {
        console.error('Tabscanner credit API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch credit' },
            { status: 500 }
        );
    }
}
