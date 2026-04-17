import { NextRequest, NextResponse } from 'next/server';
import { readSheet, appendSheet, generateId, now } from '@/lib/google-sheets';
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

function productToRow(p: Product): (string | number | boolean)[] {
  return [p.id, p.name, p.genericName, p.barcode, p.categoryId, p.price, p.costPrice, p.stock, p.unit, p.minStock, p.expiryDate, p.supplierId, p.description, p.requirePrescription, p.status, p.createdAt, p.updatedAt];
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const rows = await readSheet(`${SHEET}!A2:Q`);
    let products = rows.filter((r) => r[0]).map(rowToProduct);
    if (search) {
      const s = search.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          p.genericName.toLowerCase().includes(s) ||
          p.barcode.toLowerCase().includes(s)
      );
    }
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const product: Product = {
      id: generateId(),
      name: body.name || '',
      genericName: body.genericName || '',
      barcode: body.barcode || '',
      categoryId: body.categoryId || '',
      price: parseFloat(body.price) || 0,
      costPrice: parseFloat(body.costPrice) || 0,
      stock: parseInt(body.stock) || 0,
      unit: body.unit || 'เม็ด',
      minStock: parseInt(body.minStock) || 5,
      expiryDate: body.expiryDate || '',
      supplierId: body.supplierId || '',
      description: body.description || '',
      requirePrescription: Boolean(body.requirePrescription),
      status: body.status || 'active',
      createdAt: now(),
      updatedAt: now(),
    };
    await appendSheet(`${SHEET}!A:Q`, [productToRow(product)]);
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
