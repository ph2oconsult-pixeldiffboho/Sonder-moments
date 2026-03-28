import { NextRequest } from 'next/server';
import { POST_logout } from '@/lib/services/auth';
export const POST = (req: NextRequest) => POST_logout(req);
