import { NextResponse } from 'next/server';
import { ensureSheets } from '@/lib/google-sheets';

export async function POST() {
  try {
    await ensureSheets();
    return NextResponse.json({ success: true, message: 'Sheets initialized' });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
