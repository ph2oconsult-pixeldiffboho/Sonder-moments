import { NextRequest } from 'next/server';
import { bookGET, bookPOST } from '@/lib/services/secondary';
export const GET = (req: NextRequest) => bookGET(req);
export const POST = (req: NextRequest) => bookPOST(req);
