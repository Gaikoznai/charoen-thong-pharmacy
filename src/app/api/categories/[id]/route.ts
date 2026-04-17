import { NextRequest, NextResponse } from 'next/server';
import { readSheet, writeSheet, clearSheetRange } from '@/lib/google-sheets';
import { Category } from '@/types';

const SHEET = 'Categories';

async function findRowIndex(id: string): Promise<number> {
  const rows = await readSheet(`${SHEET}!A2:A`);
  const idx = rows.findIndex((r) => r[0] === id);
  return idx === -1 ? -1 : idx + 2;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const rowIndex = await findRowIndex(id);
    if (rowIndex === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const updated: Category = { id, name: body.name || '', description: body.description || '' };
    await writeSheet(`${SHEET}!A${rowIndex}:C${rowIndex}`, [[updated.id, updated.name, updated.description]]);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rowIndex = await findRowIndex(id);
    if (rowIndex === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await clearSheetRange(`${SHEET}!A${rowIndex}:C${rowIndex}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
