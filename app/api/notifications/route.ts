import { NextRequest } from 'next/server';
import { notifGET, notifPOST } from '@/lib/services/secondary';
export const GET = (req: NextRequest) => notifGET(req);
export const POST = (req: NextRequest) => notifPOST(req);
