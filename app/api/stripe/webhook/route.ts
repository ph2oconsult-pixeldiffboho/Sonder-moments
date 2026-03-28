import { NextRequest } from 'next/server';
import { POST as stripeHandler } from '../route';
export const POST = (req: NextRequest) => stripeHandler(req);
