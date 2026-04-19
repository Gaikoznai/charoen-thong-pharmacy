import { NextRequest, NextResponse } from 'next/server';
import { gasApi } from '@/lib/gas-api';

export async function GET(req: NextRequest) {
  try {
    const sp = new URL(req.url).searchParams;
    return NextResponse.json(await gasApi.getReportSummary(sp.get('dateFrom') ?? undefined, sp.get('dateTo') ?? undefined));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
