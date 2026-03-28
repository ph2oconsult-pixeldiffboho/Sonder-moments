import { NextRequest } from 'next/server';
import { GET_worlds, GET_list } from '@/lib/services/lessons';
export const GET = (req: NextRequest) =>
  req.nextUrl.searchParams.has('worlds') ? GET_worlds(req) : GET_list(req);
