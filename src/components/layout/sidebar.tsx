'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  History,
  Settings,
  Pill,
  Truck,
  Tag,
  Home,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'หน้าหลัก', icon: Home },
  { href: '/pos', label: 'หน้าขาย (POS)', icon: ShoppingCart },
  { href: '/products', label: 'สินค้า/ยา', icon: Pill },
  { href: '/members', label: 'สมาชิก', icon: Users },
  { href: '/sales', label: 'ประวัติการขาย', icon: History },
  { href: '/reports', label: 'รายงาน', icon: BarChart3 },
  { href: '/categories', label: 'หมวดหมู่', icon: Tag },
  { href: '/suppliers', label: 'ผู้จัดจำหน่าย', icon: Truck },
  { href: '/inventory', label: 'สต็อกสินค้า', icon: Package },
  { href: '/settings', label: 'ตั้งค่า', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0 z-40">
      <div className="px-4 py-5 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Pill size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-tight">เจริญทองเภสัช</p>
            <p className="text-xs text-gray-500">ร้านขายยา</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-colors',
                active
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-3 border-t border-gray-200">
        <p className="text-xs text-gray-400 text-center">v1.0.0 · Google Sheets Sync</p>
      </div>
    </aside>
  );
}
