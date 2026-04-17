import { NextRequest, NextResponse } from 'next/server';
import { readSheet, writeSheet, clearSheetRange } from '@/lib/google-sheets';
import { Supplier } from '@/types';

const SHEET = 'Suppliers';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rows = await readSheet(`${SHEET}!A2:F`);
    const idx = rows.findIndex((r) => r[0] === id);
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const body = await req.json();
    const updated: Supplier = { id, name: body.name || '', phone: body.phone || '', email: body.email || '', address: body.address || '', notes: body.notes || '' };
    await writeSheet(`${SHEET}!A${idx + 2}:F${idx + 2}`, [[updated.id, updated.name, updated.phone, updated.email, updated.address, updated.notes]]);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rows = await readSheet(`${SHEET}!A2:A`);
    const idx = rows.findIndex((r) => r[0] === id);
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await clearSheetRange(`${SHEET}!A${idx + 2}:F${idx + 2}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
