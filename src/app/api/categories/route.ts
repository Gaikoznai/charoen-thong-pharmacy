import { NextRequest, NextResponse } from 'next/server';
import { gasApi } from '@/lib/gas-api';

export async function GET() {
  try {
    return NextResponse.json(await gasApi.getCategories());
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    return NextResponse.json(await gasApi.saveCategory(await req.json()), { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
