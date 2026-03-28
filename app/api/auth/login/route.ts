import { NextRequest } from 'next/server';
import { POST_login } from '@/lib/services/auth';
export const POST = (req: NextRequest) => POST_login(req);
