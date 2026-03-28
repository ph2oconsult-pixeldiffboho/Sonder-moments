import { NextRequest } from 'next/server';
import { packsGET, packsPOST } from '@/lib/services/secondary';
export const GET = (req: NextRequest) => packsGET(req);
export const POST = (req: NextRequest) => packsPOST(req);
