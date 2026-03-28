import { NextRequest } from 'next/server';
import { GET_worlds } from '@/lib/services/lessons';
export const GET = (req: NextRequest) => GET_worlds(req);
