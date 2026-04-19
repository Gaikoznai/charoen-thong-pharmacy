'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useParkedBillsStore } from '@/store/parked-bills';

interface Summary {
  totalRevenue: number;
  totalTransactions: number;
  totalItemsSold: number;
  grossProfit: number;
  totalMembers?: number;
  lowStock?: unknown[];
}

interface Card {
  label: string;
  color: string;
  textColor?: string;
  href?: string;
  onClick?: () => void;
}

// Color palette
const C = {
  teal:    '#b8e8de',
  active:  '#5bbfd4',   // white text
  blue:    '#b8d8f0',
  gray:    '#dde8f0',
  pink:    '#f0c8d8',
  purple:  '#d8c8f0',
  active2: '#4a90d4',   // white text
};

export default function DashboardPage() {
  const router = useRouter();
  const { username } = useAuthStore();
  const { bills } = useParkedBillsStore();
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    fetch(`/api/reports/summary?dateFrom=${today}&dateTo=${today}`)
      .then((r) => r.json())
      .then((d) => setSummary(d))
      .catch(() => {});
  }, []);

  const parkedCount = bills.filter((b) => b.status === 'parked' || b.status === 'recalled').length;

  const handleComingSoon = (label: string) => alert(`${label}: กำลังพัฒนา`);

  const cards: Card[] = [
    { label: 'สินค้า',              color: C.teal,    href: '/products' },
    { label: 'ขายปลีก',             color: C.active,  textColor: '#fff', href: '/pos' },
    { label: 'ขายส่ง',              color: C.blue,    onClick: () => handleComingSoon('ขายส่ง') },
    { label: 'ส่งสินค้าสาขา',       color: C.gray,    onClick: () => handleComingSoon('ส่งสินค้าสาขา') },
    { label: 'รับ-ส่ง สาขา',        color: C.gray,    onClick: () => handleComingSoon('รับ-ส่ง สาขา') },
    { label: 'รับสินค้าสาขา',       color: C.pink,    onClick: () => handleComingSoon('รับสินค้าสาขา') },
    { label: 'บริษัท',              color: C.teal,    onClick: () => handleComingSoon('บริษัท') },
    { label: 'สั่งซื้อ',             color: C.teal,    onClick: () => handleComingSoon('สั่งซื้อ') },
    { label: 'รับสินค้า',            color: C.blue,    href: '/inventory' },
    { label: 'รายงาน',              color: C.active2, textColor: '#fff', href: '/reports' },
    { label: 'โปรโมชั่น',           color: C.purple,  onClick: () => handleComingSoon('โปรโมชั่น') },
    { label: 'ตรวจรักษาผู้ป่วย',    color: C.pink,    onClick: () => handleComingSoon('ตรวจรักษาผู้ป่วย') },
    { label: 'สมาชิก',              color: C.teal,    href: '/members' },
    { label: 'ลูกหนี้',             color: C.teal,    onClick: () => handleComingSoon('ลูกหนี้') },
    { label: 'เจ้าหนี้',            color: C.blue,    onClick: () => handleComingSoon('เจ้าหนี้') },
    { label: 'ตั้งค่า',             color: C.gray,    href: '/settings' },
    { label: 'ข้อมูลส่วนตัว',       color: C.purple,  onClick: () => handleComingSoon('ข้อมูลส่วนตัว') },
    { label: 'ช่วยเหลือ',           color: C.pink,    onClick: () => handleComingSoon('ช่วยเหลือ') },
  ];

  return (
    <div style={{ flex: 1, overflow: 'auto', background: '#eef5fb', display: 'flex', flexDirection: 'column' }}>

      {/* Store name centered */}
      <div style={{ textAlign: 'center', padding: '18px 16px 10px', fontSize: '18px', fontWeight: 700, color: '#2a5080', letterSpacing: '1px' }}>
        เจริญทองเภสัช
      </div>

      {/* 6-column card grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: '8px',
        padding: '0 16px 16px',
        maxWidth: '900px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
      }}>
        {cards.map((card) => {
          const textColor = card.textColor || '#333';
          const inner = (
            <div style={{
              background: card.color,
              borderRadius: '6px',
              padding: '16px 8px',
              textAlign: 'center',
              fontSize: '13px',
              fontWeight: 600,
              color: textColor,
              cursor: 'pointer',
              minHeight: '64px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: '1.3',
              boxSizing: 'border-box',
              whiteSpace: 'pre-wrap',
            }}>
              {card.label}
            </div>
          );
          if (card.href) {
            return (
              <Link key={card.label} href={card.href} style={{ textDecoration: 'none', display: 'block' }}>
                {inner}
              </Link>
            );
          }
          return (
            <div key={card.label} onClick={card.onClick} style={{ display: 'block' }}>
              {inner}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: 'auto',
        textAlign: 'center',
        fontSize: '11px',
        color: '#888',
        padding: '12px 16px',
        borderTop: '1px solid #d0dde8',
      }}>
        ©2025–2026 เจริญทองเภสัช — Charoen Thong Pharmacy. All rights reserved. | Version: beta 1.20
      </div>
    </div>
  );
}
