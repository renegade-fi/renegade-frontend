import { NextRequest, NextResponse } from 'next/server';

const AMBERDATA_BASE_URL = "https://api.amberdata.com";
const API_KEY_HEADER = "x-api-key";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // Get the path and search params from the request
        const { searchParams } = new URL(request.url);
        const path = searchParams.get('path');

        if (!path) {
            return NextResponse.json({ error: 'Path parameter is required' }, { status: 400 });
        }

        // Construct the full Amberdata URL
        const amberdataUrl = new URL(`${AMBERDATA_BASE_URL}${path}`);

        // Copy all other search params to the new URL
        searchParams.forEach((value, key) => {
            if (key !== 'path') {
                amberdataUrl.searchParams.append(key, value);
            }
        });

        // Create a new request with the Amberdata API key
        const amberdataRequest = new Request(amberdataUrl, {
            headers: {
                [API_KEY_HEADER]: process.env.AMBERDATA_API_KEY as string,
            },
        });

        // Forward the request to Amberdata
        const response = await fetch(amberdataRequest);

        if (!response.ok) {
            throw new Error(`Amberdata API responded with status: ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in Amberdata proxy:', error);
        return NextResponse.json(
            { error: 'An error occurred while processing your request' },
            { status: 500 }
        );
    }
}