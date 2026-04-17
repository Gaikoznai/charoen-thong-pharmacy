import { NextRequest, NextResponse } from 'next/server';
import { readSheet, writeSheet, clearSheetRange } from '@/lib/google-sheets';
import { Member } from '@/types';

const SHEET = 'Members';

function rowToMember(r: string[]): Member {
  return {
    id: r[0] || '',
    code: r[1] || '',
    name: r[2] || '',
    phone: r[3] || '',
    email: r[4] || '',
    address: r[5] || '',
    birthDate: r[6] || '',
    points: parseInt(r[7]) || 0,
    totalSpent: parseFloat(r[8]) || 0,
    joinDate: r[9] || '',
    status: (r[10] as 'active' | 'inactive') || 'active',
    notes: r[11] || '',
    createdAt: r[12] || '',
  };
}

async function findRow(id: string): Promise<{ rowIndex: number; member: Member } | null> {
  const rows = await readSheet(`${SHEET}!A2:M`);
  const idx = rows.findIndex((r) => r[0] === id);
  if (idx === -1) return null;
  return { rowIndex: idx + 2, member: rowToMember(rows[idx]) };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await findRow(id);
    if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(result.member);
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
    const updated: Member = { ...result.member, ...body, id };
    await writeSheet(`${SHEET}!A${result.rowIndex}:M${result.rowIndex}`, [
      [updated.id, updated.code, updated.name, updated.phone, updated.email, updated.address, updated.birthDate, updated.points, updated.totalSpent, updated.joinDate, updated.status, updated.notes, updated.createdAt],
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
    await clearSheetRange(`${SHEET}!A${result.rowIndex}:M${result.rowIndex}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
