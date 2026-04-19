import { NextRequest, NextResponse } from 'next/server';
import { gasApi } from '@/lib/gas-api';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return NextResponse.json(await gasApi.getSaleDetail(id));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    if (body.status === 'voided') return NextResponse.json(await gasApi.voidSale(id));
    return NextResponse.json({ error: 'Unsupported update' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
