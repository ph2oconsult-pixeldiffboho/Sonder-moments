import { NextRequest } from 'next/server';
import { bookDELETE } from '@/lib/services/secondary';
export const DELETE = (req: NextRequest, { params }: { params: { id: string } }) => bookDELETE(req, params.id);
