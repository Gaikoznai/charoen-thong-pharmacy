'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useParkedBillsStore } from '@/store/parked-bills';
import { formatCurrency } from '@/lib/utils';

interface Summary {
  totalRevenue: number;
  totalTransactions: number;
  totalItemsSold: number;
  grossProfit: number;
  totalMembers?: number;
  lowStock?: unknown[];
}

interface MenuTile {
  label: string;
  sub?: string;
  icon: string;
  color: string;
  href?: string;
  onClick?: () => void;
  badge?: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { username, logout } = useAuthStore();
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

  const handleLogout = () => { logout(); router.replace('/login'); };
  const handleComingSoon = (label: string) => alert(`${label}: กำลังพัฒนา`);

  const tiles: MenuTile[] = [
    { label: 'ขายปลีก', sub: 'POS หน้าขาย', icon: '🛒', color: 'from-green-500 to-emerald-600', href: '/pos' },
    { label: 'ขายส่ง', sub: 'Wholesale', icon: '📦', color: 'from-teal-500 to-teal-600', onClick: () => handleComingSoon('ขายส่ง') },
    { label: 'ค้นหาสินค้า', sub: 'Product Search', icon: '🔍', color: 'from-cyan-500 to-blue-500', href: '/products' },
    { label: 'สมาชิก', sub: 'Members', icon: '👥', color: 'from-blue-500 to-blue-600', href: '/members' },
    { label: 'สินค้า/ยา', sub: 'Drug Catalog', icon: '💊', color: 'from-indigo-500 to-indigo-600', href: '/products' },
    { label: 'หมวดหมู่', sub: 'Categories', icon: '🏷️', color: 'from-purple-500 to-purple-600', href: '/categories' },
    { label: 'ผู้จัดจำหน่าย', sub: 'Suppliers', icon: '🚚', color: 'from-pink-500 to-rose-500', href: '/suppliers' },
    { label: 'คลังสินค้า', sub: 'Inventory', icon: '🏪', color: 'from-orange-500 to-orange-600', href: '/inventory' },
    { label: 'บิลค้าง', sub: `${parkedCount} บิล`, icon: '📌', color: 'from-yellow-500 to-amber-500', href: '/pos', badge: parkedCount },
    { label: 'รายงานขาย', sub: 'Sales Report', icon: '📊', color: 'from-red-500 to-red-600', href: '/reports' },
    { label: 'กำไร-ขาดทุน', sub: 'Profit & Loss', icon: '📈', color: 'from-emerald-500 to-green-600', href: '/reports' },
    { label: 'ประวัติการขาย', sub: 'Sales History', icon: '📜', color: 'from-slate-500 to-slate-600', href: '/sales' },
    { label: 'ยาใกล้หมดอายุ', sub: 'Expiry Check', icon: '⏰', color: 'from-amber-500 to-orange-600', href: '/inventory' },
    { label: 'สต็อกใกล้หมด', sub: 'Low Stock', icon: '⚠️', color: 'from-rose-500 to-red-600', href: '/inventory' },
    { label: 'เปิดลิ้นชัก', sub: 'Open Drawer', icon: '🗄️', color: 'from-gray-500 to-gray-700', onClick: () => handleComingSoon('เปิดลิ้นชัก') },
    { label: 'พิมพ์ซ้ำ', sub: 'Reprint Receipt', icon: '🖨️', color: 'from-violet-500 to-purple-600', onClick: () => handleComingSoon('พิมพ์ซ้ำ') },
    { label: 'ตั้งค่า', sub: 'Settings', icon: '⚙️', color: 'from-zinc-500 to-gray-600', href: '/settings' },
    { label: 'ออกจากระบบ', sub: 'Logout', icon: '🚪', color: 'from-red-600 to-red-700', onClick: handleLogout },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100" style={{ marginLeft: 0 }}>
      {/* Top Header */}
      <header className="bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-2xl">💊</div>
            <div>
              <h1 className="font-bold text-xl">เจริญทองเภสัช</h1>
              <p className="text-xs opacity-70">ระบบบริหารร้านขายยา • Dashboard v1.20</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="opacity-80">ผู้ใช้: <b className="text-yellow-300">{username || '—'}</b></span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600/80 hover:bg-red-600 rounded font-semibold text-xs"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </header>

      {/* Today Stats */}
      <section className="max-w-7xl mx-auto px-6 py-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">สรุปยอดวันนี้</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="ยอดขาย" value={formatCurrency(summary?.totalRevenue || 0)} icon="💰" bg="from-green-500 to-emerald-500" />
          <StatCard label="จำนวนบิล" value={`${summary?.totalTransactions || 0} บิล`} icon="🧾" bg="from-blue-500 to-cyan-500" />
          <StatCard label="ชิ้นที่ขาย" value={`${summary?.totalItemsSold || 0} ชิ้น`} icon="📦" bg="from-purple-500 to-pink-500" />
          <StatCard label="กำไรขั้นต้น" value={formatCurrency(summary?.grossProfit || 0)} icon="📈" bg="from-orange-500 to-red-500" />
        </div>
      </section>

      {/* 18-Icon Menu Grid */}
      <section className="max-w-7xl mx-auto px-6 pb-10">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">เมนูหลัก</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {tiles.map((t) => (
            <TileButton key={t.label} tile={t} />
          ))}
        </div>
      </section>

      <footer className="text-center py-4 text-xs text-gray-400">
        © เจริญทองเภสัช POS v1.20 • Connected to Google Sheets
      </footer>
    </div>
  );
}

function StatCard({ label, value, icon, bg }: { label: string; value: string; icon: string; bg: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${bg} flex items-center justify-center text-xl shadow-sm`}>{icon}</div>
      <div className="min-w-0">
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-lg font-bold text-gray-900 leading-tight truncate">{value}</div>
      </div>
    </div>
  );
}

function TileButton({ tile }: { tile: MenuTile }) {
  const content = (
    <div className={`relative group bg-gradient-to-br ${tile.color} rounded-xl p-4 h-32 flex flex-col items-center justify-center text-white shadow hover:shadow-xl hover:scale-105 transition-all cursor-pointer`}>
      <div className="text-4xl mb-1.5">{tile.icon}</div>
      <div className="text-xs font-bold text-center leading-tight">{tile.label}</div>
      {tile.sub && <div className="text-[10px] opacity-80 mt-0.5">{tile.sub}</div>}
      {tile.badge && tile.badge > 0 && (
        <span className="absolute top-2 right-2 min-w-[22px] h-[22px] bg-red-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
          {tile.badge}
        </span>
      )}
    </div>
  );

  if (tile.href) return <Link href={tile.href}>{content}</Link>;
  return <button onClick={tile.onClick} className="text-left">{content}</button>;
}
