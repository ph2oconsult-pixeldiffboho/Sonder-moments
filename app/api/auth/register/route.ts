import { NextRequest } from 'next/server';
import { POST_register } from '@/lib/services/auth';
export const POST = (req: NextRequest) => POST_register(req);
