import { NextRequest, NextResponse } from 'next/server';
import { gasApi } from '@/lib/gas-api';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    return NextResponse.json(await gasApi.saveProduct({ ...body, id }));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return NextResponse.json(await gasApi.deleteProduct(id));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
