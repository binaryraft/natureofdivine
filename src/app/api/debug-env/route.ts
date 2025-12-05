import { NextResponse } from 'next/server';

export async function GET() {
    const envVars = {
        ENVIA_IS_TEST: process.env.ENVIA_IS_TEST,
        ENVIA_API_KEY_EXISTS: !!process.env.ENVIA_API_KEY,
        ENVIA_API_KEY_LENGTH: process.env.ENVIA_API_KEY?.length || 0,
        ENVIA_TEST_API_KEY_EXISTS: !!process.env.ENVIA_TEST_API_KEY,
        ENVIA_TEST_API_KEY_LENGTH: process.env.ENVIA_TEST_API_KEY?.length || 0,
        SELECTED_KEY: process.env.ENVIA_IS_TEST === 'true' ? 'TEST_KEY' : 'PROD_KEY',
        SELECTED_KEY_EXISTS: process.env.ENVIA_IS_TEST === 'true'
            ? !!process.env.ENVIA_TEST_API_KEY
            : !!process.env.ENVIA_API_KEY,
    };

    return NextResponse.json(envVars);
}
