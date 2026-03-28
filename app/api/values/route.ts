import { NextRequest } from 'next/server';
import { valuesGET, valuesPOST } from '@/lib/services/secondary';
export const GET = (req: NextRequest) => valuesGET(req);
export const POST = (req: NextRequest) => valuesPOST(req);
