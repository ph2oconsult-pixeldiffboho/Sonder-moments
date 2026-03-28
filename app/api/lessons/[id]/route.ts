import { NextRequest } from 'next/server';
import { GET_lesson } from '@/lib/services/lessons';
export const GET = (req: NextRequest, { params }: { params: { id: string } }) =>
  GET_lesson(req, params.id);
