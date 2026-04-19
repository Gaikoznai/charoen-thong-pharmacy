'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
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
  iconColor?: string;
  href?: string;
  onClick?: () => void;
  icon: React.ReactNode;
}

const C = {
  teal:    '#b8e8de',
  active:  '#5bbfd4',
  blue:    '#b8d8f0',
  gray:    '#dde8f0',
  pink:    '#f0c8d8',
  purple:  '#d8c8f0',
  active2: '#4a90d4',
};

const Icon = ({ d, size = 28, color = 'currentColor' }: { d: string; size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const ICONS: Record<string, React.ReactNode> = {
  สินค้า:           <Icon d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />,
  ขายปลีก: (
    <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" fill="currentColor" stroke="none"/>
      <circle cx="20" cy="21" r="1" fill="currentColor" stroke="none"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  ),
  ขายส่ง:          <Icon d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />,
  ส่งสินค้าสาขา:   <Icon d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10" />,
  'รับ-ส่ง สาขา':  <Icon d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3" />,
  รับสินค้าสาขา:   <Icon d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10M12 7v5M9.5 9.5l2.5 2.5 2.5-2.5" />,
  บริษัท:           <Icon d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />,
  สั่งซื้อ:          <Icon d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.7A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.08 6.08l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />,
  รับสินค้า:        <Icon d="M20 6H4l1 14h14zM1 6h22M10 6V4a2 2 0 012-2h0a2 2 0 012 2v2M12 11v4M10 13h4" />,
  รายงาน:          <Icon d="M18 20V10M12 20V4M6 20v-6" />,
  โปรโมชั่น:        <Icon d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01" />,
  ตรวจรักษาผู้ป่วย: <Icon d="M22 12h-4l-3 9L9 3l-3 9H2" />,
  สมาชิก:          <Icon d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />,
  ลูกหนี้:          <Icon d="M1 4h22v16H1zM1 9h22M5 4v5" />,
  เจ้าหนี้:         <Icon d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />,
  ตั้งค่า:          <Icon d="M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />,
  ข้อมูลส่วนตัว:    <Icon d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8zM22 11c0 4.42-4.48 8-10 8" />,
  ช่วยเหลือ:        <Icon d="M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10zM9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" />,
};

export default function DashboardPage() {
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

  const handleComingSoon = (label: string) => alert(`${label}: กำลังพัฒนา`);

  const cards: Card[] = [
    { label: 'สินค้า',              color: C.teal,    href: '/products',                          icon: ICONS['สินค้า'] },
    { label: 'ขายปลีก',             color: C.active,  textColor: '#fff', href: '/pos',             icon: ICONS['ขายปลีก'] },
    { label: 'ขายส่ง',              color: C.blue,    onClick: () => handleComingSoon('ขายส่ง'),   icon: ICONS['ขายส่ง'] },
    { label: 'ส่งสินค้าสาขา',       color: C.gray,    onClick: () => handleComingSoon('ส่งสินค้าสาขา'), icon: ICONS['ส่งสินค้าสาขา'] },
    { label: 'รับ-ส่ง สาขา',        color: C.gray,    onClick: () => handleComingSoon('รับ-ส่ง สาขา'),  icon: ICONS['รับ-ส่ง สาขา'] },
    { label: 'รับสินค้าสาขา',       color: C.pink,    onClick: () => handleComingSoon('รับสินค้าสาขา'), icon: ICONS['รับสินค้าสาขา'] },
    { label: 'บริษัท',              color: C.teal,    onClick: () => handleComingSoon('บริษัท'),   icon: ICONS['บริษัท'] },
    { label: 'สั่งซื้อ',             color: C.teal,    onClick: () => handleComingSoon('สั่งซื้อ'),  icon: ICONS['สั่งซื้อ'] },
    { label: 'รับสินค้า',            color: C.blue,    href: '/inventory',                          icon: ICONS['รับสินค้า'] },
    { label: 'รายงาน',              color: C.active2, textColor: '#fff', href: '/reports',          icon: ICONS['รายงาน'] },
    { label: 'โปรโมชั่น',           color: C.purple,  onClick: () => handleComingSoon('โปรโมชั่น'), icon: ICONS['โปรโมชั่น'] },
    { label: 'ตรวจรักษาผู้ป่วย',    color: C.pink,    onClick: () => handleComingSoon('ตรวจรักษาผู้ป่วย'), icon: ICONS['ตรวจรักษาผู้ป่วย'] },
    { label: 'สมาชิก',              color: C.teal,    href: '/members',                             icon: ICONS['สมาชิก'] },
    { label: 'ลูกหนี้',             color: C.teal,    onClick: () => handleComingSoon('ลูกหนี้'),   icon: ICONS['ลูกหนี้'] },
    { label: 'เจ้าหนี้',            color: C.blue,    onClick: () => handleComingSoon('เจ้าหนี้'),   icon: ICONS['เจ้าหนี้'] },
    { label: 'ตั้งค่า',             color: C.gray,    href: '/settings',                            icon: ICONS['ตั้งค่า'] },
    { label: 'ข้อมูลส่วนตัว',       color: C.purple,  onClick: () => handleComingSoon('ข้อมูลส่วนตัว'), icon: ICONS['ข้อมูลส่วนตัว'] },
    { label: 'ช่วยเหลือ',           color: C.pink,    onClick: () => handleComingSoon('ช่วยเหลือ'),  icon: ICONS['ช่วยเหลือ'] },
  ];

  return (
    <div style={{ flex: 1, overflow: 'auto', background: '#eef5fb', display: 'flex', flexDirection: 'column' }}>

      <div style={{ textAlign: 'center', padding: '18px 16px 10px', fontSize: '18px', fontWeight: 700, color: '#2a5080', letterSpacing: '1px' }}>
        เจริญทองเภสัช
      </div>

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
          const textColor = card.textColor || '#444';
          const iconColor = card.textColor || '#2a6080';
          const inner = (
            <div style={{
              background: card.color,
              borderRadius: '8px',
              padding: '14px 8px 10px',
              textAlign: 'center',
              fontSize: '12px',
              fontWeight: 600,
              color: textColor,
              cursor: 'pointer',
              minHeight: '80px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              lineHeight: '1.3',
              boxSizing: 'border-box',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.06)',
            }}>
              <span style={{ color: iconColor, display: 'flex', alignItems: 'center' }}>
                {card.icon}
              </span>
              <span>{card.label}</span>
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
