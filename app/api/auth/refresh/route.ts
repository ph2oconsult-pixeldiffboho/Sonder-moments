import { NextRequest } from 'next/server';
import { POST_refresh } from '@/lib/services/auth';
export const POST = (req: NextRequest) => POST_refresh(req);
