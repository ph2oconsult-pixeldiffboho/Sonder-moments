import { NextRequest } from 'next/server';
import { GET_me } from '@/lib/services/auth';
export const GET = (req: NextRequest) => GET_me(req);
