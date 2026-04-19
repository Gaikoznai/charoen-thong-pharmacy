import { NextRequest, NextResponse } from 'next/server';
import { gasApi } from '@/lib/gas-api';

export async function GET(req: NextRequest) {
  try {
    const search = new URL(req.url).searchParams.get('search') || '';
    return NextResponse.json(await gasApi.getProducts(search));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    return NextResponse.json(await gasApi.saveProduct(await req.json()), { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
