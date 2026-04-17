import { NextRequest, NextResponse } from 'next/server';
import { readSheet, writeSheet } from '@/lib/google-sheets';
import { Sale, SaleItem } from '@/types';

const SALES_SHEET = 'Sales';
const ITEMS_SHEET = 'SaleItems';

function rowToSale(r: string[]): Sale {
  return {
    id: r[0] || '',
    invoiceNo: r[1] || '',
    memberId: r[2] || '',
    memberName: r[3] || '',
    subtotal: parseFloat(r[4]) || 0,
    discount: parseFloat(r[5]) || 0,
    finalAmount: parseFloat(r[6]) || 0,
    paymentMethod: (r[7] as Sale['paymentMethod']) || 'cash',
    cashReceived: parseFloat(r[8]) || 0,
    change: parseFloat(r[9]) || 0,
    pointsEarned: parseInt(r[10]) || 0,
    pointsUsed: parseInt(r[11]) || 0,
    notes: r[12] || '',
    status: (r[13] as Sale['status']) || 'completed',
    createdAt: r[14] || '',
  };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rows = await readSheet(`${SALES_SHEET}!A2:O`);
    const saleRow = rows.find((r) => r[0] === id);
    if (!saleRow) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const sale = rowToSale(saleRow);
    const itemRows = await readSheet(`${ITEMS_SHEET}!A2:I`);
    sale.items = itemRows
      .filter((r) => r[1] === id)
      .map((r) => ({
        id: r[0] || '',
        saleId: r[1] || '',
        productId: r[2] || '',
        productName: r[3] || '',
        barcode: r[4] || '',
        quantity: parseInt(r[5]) || 0,
        unitPrice: parseFloat(r[6]) || 0,
        discount: parseFloat(r[7]) || 0,
        totalPrice: parseFloat(r[8]) || 0,
      }));
    return NextResponse.json(sale);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rows = await readSheet(`${SALES_SHEET}!A2:O`);
    const idx = rows.findIndex((r) => r[0] === id);
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json();
    const existing = rowToSale(rows[idx]);
    const updated: Sale = { ...existing, ...body, id };
    await writeSheet(`${SALES_SHEET}!A${idx + 2}:O${idx + 2}`, [
      [updated.id, updated.invoiceNo, updated.memberId, updated.memberName, updated.subtotal, updated.discount, updated.finalAmount, updated.paymentMethod, updated.cashReceived, updated.change, updated.pointsEarned, updated.pointsUsed, updated.notes, updated.status, updated.createdAt],
    ]);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
