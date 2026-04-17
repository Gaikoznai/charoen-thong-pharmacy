import { NextRequest, NextResponse } from 'next/server';
import { readSheet, appendSheet, writeSheet, generateId, now } from '@/lib/google-sheets';
import { Sale, SaleItem, CartItem } from '@/types';
import { generateInvoiceNo } from '@/lib/utils';

const SALES_SHEET = 'Sales';
const ITEMS_SHEET = 'SaleItems';
const PRODUCTS_SHEET = 'Products';
const MEMBERS_SHEET = 'Members';

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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const rows = await readSheet(`${SALES_SHEET}!A2:O`);
    let sales = rows.filter((r) => r[0]).map(rowToSale);

    if (dateFrom) sales = sales.filter((s) => s.createdAt >= dateFrom);
    if (dateTo) sales = sales.filter((s) => s.createdAt <= dateTo + 'T23:59:59');

    sales.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return NextResponse.json(sales);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, memberId, discount, paymentMethod, cashReceived, notes, pointsUsed } = body;

    const cartItems: CartItem[] = items;
    const subtotal = cartItems.reduce((sum: number, item: CartItem) => sum + item.totalPrice, 0);
    const finalAmount = Math.max(0, subtotal - (parseFloat(discount) || 0));
    const pointsEarned = Math.floor(finalAmount / 100);

    const sale: Sale = {
      id: generateId(),
      invoiceNo: generateInvoiceNo(),
      memberId: memberId || '',
      memberName: '',
      subtotal,
      discount: parseFloat(discount) || 0,
      finalAmount,
      paymentMethod: paymentMethod || 'cash',
      cashReceived: parseFloat(cashReceived) || 0,
      change: Math.max(0, (parseFloat(cashReceived) || 0) - finalAmount),
      pointsEarned,
      pointsUsed: parseInt(pointsUsed) || 0,
      notes: notes || '',
      status: 'completed',
      createdAt: now(),
    };

    // Lookup member name
    if (memberId) {
      const memberRows = await readSheet(`${MEMBERS_SHEET}!A2:C`);
      const memberRow = memberRows.find((r) => r[0] === memberId);
      if (memberRow) sale.memberName = memberRow[2] || '';
    }

    await appendSheet(`${SALES_SHEET}!A:O`, [
      [sale.id, sale.invoiceNo, sale.memberId, sale.memberName, sale.subtotal, sale.discount, sale.finalAmount, sale.paymentMethod, sale.cashReceived, sale.change, sale.pointsEarned, sale.pointsUsed, sale.notes, sale.status, sale.createdAt],
    ]);

    // Insert sale items and update stock
    const productRows = await readSheet(`${PRODUCTS_SHEET}!A2:Q`);
    for (const item of cartItems) {
      const saleItem: SaleItem = {
        id: generateId(),
        saleId: sale.id,
        productId: item.productId,
        productName: item.productName,
        barcode: item.barcode,
        quantity: item.quantity,
        unitPrice: item.price,
        discount: item.discount,
        totalPrice: item.totalPrice,
      };
      await appendSheet(`${ITEMS_SHEET}!A:I`, [
        [saleItem.id, saleItem.saleId, saleItem.productId, saleItem.productName, saleItem.barcode, saleItem.quantity, saleItem.unitPrice, saleItem.discount, saleItem.totalPrice],
      ]);

      // Update product stock
      const pIdx = productRows.findIndex((r) => r[0] === item.productId);
      if (pIdx !== -1) {
        const currentStock = parseInt(productRows[pIdx][7]) || 0;
        const newStock = Math.max(0, currentStock - item.quantity);
        await writeSheet(`${PRODUCTS_SHEET}!H${pIdx + 2}`, [[newStock]]);
        productRows[pIdx][7] = String(newStock);
      }
    }

    // Update member points & totalSpent
    if (memberId) {
      const memberRows = await readSheet(`${MEMBERS_SHEET}!A2:M`);
      const mIdx = memberRows.findIndex((r) => r[0] === memberId);
      if (mIdx !== -1) {
        const currentPoints = parseInt(memberRows[mIdx][7]) || 0;
        const currentSpent = parseFloat(memberRows[mIdx][8]) || 0;
        const newPoints = currentPoints + pointsEarned - (parseInt(pointsUsed) || 0);
        const newSpent = currentSpent + finalAmount;
        await writeSheet(`${MEMBERS_SHEET}!H${mIdx + 2}:I${mIdx + 2}`, [[newPoints, newSpent]]);
      }
    }

    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
