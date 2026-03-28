import { NextRequest } from 'next/server';
import { GET_next } from '@/lib/services/lessons';
export const GET = (req: NextRequest, { params }: { params: { childId: string } }) =>
  GET_next(req, params.childId);
