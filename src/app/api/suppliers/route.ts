import { NextRequest, NextResponse } from 'next/server';
import { readSheet, appendSheet, generateId } from '@/lib/google-sheets';
import { Supplier } from '@/types';

const SHEET = 'Suppliers';

function rowToSupplier(r: string[]): Supplier {
  return { id: r[0] || '', name: r[1] || '', phone: r[2] || '', email: r[3] || '', address: r[4] || '', notes: r[5] || '' };
}

export async function GET() {
  try {
    const rows = await readSheet(`${SHEET}!A2:F`);
    return NextResponse.json(rows.filter((r) => r[0]).map(rowToSupplier));
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const item: Supplier = { id: generateId(), name: body.name || '', phone: body.phone || '', email: body.email || '', address: body.address || '', notes: body.notes || '' };
    await appendSheet(`${SHEET}!A:F`, [[item.id, item.name, item.phone, item.email, item.address, item.notes]]);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
