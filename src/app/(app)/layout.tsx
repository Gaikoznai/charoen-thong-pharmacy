'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';

const NAV_ITEMS = [
  { label: 'หน้าหลัก', href: '/dashboard' },
  { label: 'บริการลูกค้า', href: '/pos' },
  { label: 'คลังสินค้า', href: '/inventory' },
  { label: 'สมาชิกการค้า', href: '/members' },
  { label: 'รายงาน', href: '/reports' },
  { label: 'ตั้งค่าระบบ', href: '/settings' },
  { label: 'ช่วยเหลือ', href: '/dashboard' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, username, logout } = useAuthStore();
  const [clock, setClock] = useState('');

  useEffect(() => {
    if (!isLoggedIn) router.replace('/login');
  }, [isLoggedIn, router]);

  // Clock tick
  useEffect(() => {
    const fmt = () => {
      const d = new Date();
      return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };
    setClock(fmt());
    const t = setInterval(() => setClock(fmt()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!isLoggedIn) return null;

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

      {/* Toolbar — white, 52px */}
      <div style={{
        height: '52px',
        background: '#fff',
        borderBottom: '1px solid #d0dae8',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: '12px',
        flexShrink: 0,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        {/* Logo */}
        <span style={{ fontSize: '22px' }}>💊</span>
        <span style={{
          fontSize: '15px',
          fontWeight: 700,
          color: '#2a5080',
          letterSpacing: '0.5px',
          marginRight: 'auto',
        }}>เจริญทองเภสัช</span>

        {/* Right side: user, logout, clock, version */}
        <span style={{ fontSize: '12px', color: '#555' }}>
          {username || '—'}
        </span>
        <button
          onClick={handleLogout}
          style={{
            fontSize: '11px',
            color: '#cc2020',
            background: 'none',
            border: '1px solid #e0a0a0',
            borderRadius: '4px',
            padding: '3px 8px',
            cursor: 'pointer',
          }}
        >
          ออกจากระบบ
        </button>
        <span style={{ fontSize: '12px', color: '#555', fontVariantNumeric: 'tabular-nums', minWidth: '72px', textAlign: 'right' }}>
          {clock}
        </span>
        <span style={{ fontSize: '10px', color: '#aaa', background: '#f0f4f8', borderRadius: '4px', padding: '2px 6px' }}>
          beta 1.20
        </span>
      </div>

      {/* Nav bar — teal, 36px */}
      <div style={{
        height: '36px',
        background: '#2a7fa8',
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px',
        gap: '2px',
        flexShrink: 0,
      }}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.label}
              href={item.href}
              style={{
                fontSize: '13px',
                color: '#fff',
                padding: '0 14px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                background: isActive ? '#1a5570' : 'transparent',
                borderRadius: '2px',
                fontWeight: isActive ? 600 : 400,
                whiteSpace: 'nowrap',
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
    </div>
  );
}
