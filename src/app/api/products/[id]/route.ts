import { NextRequest, NextResponse } from 'next/server';
import { readSheet, writeSheet, clearSheetRange, now } from '@/lib/google-sheets';
import { Product } from '@/types';

const SHEET = 'Products';

function rowToProduct(r: string[]): Product {
  return {
    id: r[0] || '',
    name: r[1] || '',
    genericName: r[2] || '',
    barcode: r[3] || '',
    categoryId: r[4] || '',
    price: parseFloat(r[5]) || 0,
    costPrice: parseFloat(r[6]) || 0,
    stock: parseInt(r[7]) || 0,
    unit: r[8] || 'เม็ด',
    minStock: parseInt(r[9]) || 0,
    expiryDate: r[10] || '',
    supplierId: r[11] || '',
    description: r[12] || '',
    requirePrescription: r[13] === 'true',
    status: (r[14] as 'active' | 'inactive') || 'active',
    createdAt: r[15] || '',
    updatedAt: r[16] || '',
  };
}

async function findRow(id: string): Promise<{ rowIndex: number; product: Product } | null> {
  const rows = await readSheet(`${SHEET}!A2:Q`);
  const idx = rows.findIndex((r) => r[0] === id);
  if (idx === -1) return null;
  return { rowIndex: idx + 2, product: rowToProduct(rows[idx]) };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await findRow(id);
    if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(result.product);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await findRow(id);
    if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json();
    const updated: Product = {
      ...result.product,
      ...body,
      id,
      updatedAt: now(),
    };
    await writeSheet(`${SHEET}!A${result.rowIndex}:Q${result.rowIndex}`, [
      [updated.id, updated.name, updated.genericName, updated.barcode, updated.categoryId, updated.price, updated.costPrice, updated.stock, updated.unit, updated.minStock, updated.expiryDate, updated.supplierId, updated.description, updated.requirePrescription, updated.status, updated.createdAt, updated.updatedAt],
    ]);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await findRow(id);
    if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await clearSheetRange(`${SHEET}!A${result.rowIndex}:Q${result.rowIndex}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
