import { NextRequest, NextResponse } from 'next/server';
import { readSheet, appendSheet, generateId, now } from '@/lib/google-sheets';
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const rows = await readSheet(`${SHEET}!A2:M`);
    let members = rows.filter((r) => r[0]).map(rowToMember);
    if (search) {
      const s = search.toLowerCase();
      members = members.filter(
        (m) =>
          m.name.toLowerCase().includes(s) ||
          m.phone.includes(s) ||
          m.code.toLowerCase().includes(s)
      );
    }
    return NextResponse.json(members);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rows = await readSheet(`${SHEET}!B2:B`);
    const count = rows.filter((r) => r[0]).length;
    const member: Member = {
      id: generateId(),
      code: body.code || `M${String(count + 1).padStart(5, '0')}`,
      name: body.name || '',
      phone: body.phone || '',
      email: body.email || '',
      address: body.address || '',
      birthDate: body.birthDate || '',
      points: 0,
      totalSpent: 0,
      joinDate: now().split('T')[0],
      status: 'active',
      notes: body.notes || '',
      createdAt: now(),
    };
    await appendSheet(`${SHEET}!A:M`, [
      [member.id, member.code, member.name, member.phone, member.email, member.address, member.birthDate, member.points, member.totalSpent, member.joinDate, member.status, member.notes, member.createdAt],
    ]);
    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
