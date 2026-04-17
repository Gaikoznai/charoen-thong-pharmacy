import { NextRequest, NextResponse } from 'next/server';
import { readSheet, appendSheet, generateId, now } from '@/lib/google-sheets';
import { Category } from '@/types';

const SHEET = 'Categories';

async function getAll(): Promise<Category[]> {
  const rows = await readSheet(`${SHEET}!A2:C`);
  return rows
    .filter((r) => r[0])
    .map((r) => ({
      id: r[0] || '',
      name: r[1] || '',
      description: r[2] || '',
    }));
}

export async function GET() {
  try {
    const data = await getAll();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const item: Category = {
      id: generateId(),
      name: body.name || '',
      description: body.description || '',
    };
    await appendSheet(`${SHEET}!A:C`, [[item.id, item.name, item.description]]);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
