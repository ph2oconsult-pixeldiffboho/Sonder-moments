import { NextResponse } from 'next/server';
export const GET = () => NextResponse.json({ status: 'ok', app: 'Sonder API', timestamp: new Date().toISOString() });
