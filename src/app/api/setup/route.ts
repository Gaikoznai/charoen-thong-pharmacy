import { NextResponse } from 'next/server';
import { gasApi } from '@/lib/gas-api';

export async function POST() {
  try {
    const result = await gasApi.ensureSheets();
    return NextResponse.json({ success: true, result });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
