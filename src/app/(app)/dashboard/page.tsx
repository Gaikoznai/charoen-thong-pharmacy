'use client';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, ShoppingCart, Users, Package, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';

interface Summary {
  totalRevenue: number;
  totalDiscount: number;
  totalTransactions: number;
  totalItemsSold: number;
  grossProfit: number;
  totalMembers: number;
  daily: { date: string; revenue: number; transactions: number }[];
  topProducts: { id: string; name: string; quantity: number; revenue: number }[];
  lowStock: { id: string; name: string; stock: number; minStock: number }[];
}

export default function DashboardPage() {
  const today = new Date().toISOString().split('T')[0];
  const { data: summary, isLoading } = useQuery<Summary>({
    queryKey: ['reports-summary'],
    queryFn: () => fetch(`/api/reports/summary?dateFrom=${today}&dateTo=${today}`).then((r) => r.json()),
  });

  const { data: monthlySummary } = useQuery<Summary>({
    queryKey: ['reports-summary-month'],
    queryFn: () => {
      const from = new Date();
      from.setDate(1);
      return fetch(`/api/reports/summary?dateFrom=${from.toISOString().split('T')[0]}&dateTo=${today}`).then((r) => r.json());
    },
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">หน้าหลัก</h1>
          <p className="text-sm text-gray-500 mt-0.5">วันที่ {formatDate(today)}</p>
        </div>
        <Link href="/pos">
          <Button size="lg" className="gap-2">
            <ShoppingCart size={18} />
            เปิดหน้าขาย
          </Button>
        </Link>
      </div>

      {/* Today Stats */}
      <div>
        <h2 className="text-sm font-medium text-gray-500 mb-3">ยอดวันนี้</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<TrendingUp size={20} className="text-green-600" />} label="ยอดขาย" value={formatCurrency(summary?.totalRevenue || 0)} bg="bg-green-50" />
          <StatCard icon={<ShoppingCart size={20} className="text-blue-600" />} label="จำนวนบิล" value={`${summary?.totalTransactions || 0} บิล`} bg="bg-blue-50" />
          <StatCard icon={<Package size={20} className="text-purple-600" />} label="รายการที่ขาย" value={`${summary?.totalItemsSold || 0} รายการ`} bg="bg-purple-50" />
          <StatCard icon={<BarChart3 size={20} className="text-orange-600" />} label="กำไรขั้นต้น" value={formatCurrency(summary?.grossProfit || 0)} bg="bg-orange-50" />
        </div>
      </div>

      {/* Monthly Stats */}
      <div>
        <h2 className="text-sm font-medium text-gray-500 mb-3">ยอดเดือนนี้</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<TrendingUp size={20} className="text-green-600" />} label="ยอดขาย" value={formatCurrency(monthlySummary?.totalRevenue || 0)} bg="bg-green-50" />
          <StatCard icon={<ShoppingCart size={20} className="text-blue-600" />} label="จำนวนบิล" value={`${monthlySummary?.totalTransactions || 0} บิล`} bg="bg-blue-50" />
          <StatCard icon={<Users size={20} className="text-teal-600" />} label="สมาชิก" value={`${monthlySummary?.totalMembers || 0} คน`} bg="bg-teal-50" />
          <StatCard icon={<BarChart3 size={20} className="text-orange-600" />} label="กำไรขั้นต้น" value={formatCurrency(monthlySummary?.grossProfit || 0)} bg="bg-orange-50" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>สินค้าขายดี (เดือนนี้)</CardTitle>
              <Link href="/reports" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                ดูทั้งหมด <ArrowRight size={12} />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {monthlySummary?.topProducts?.length ? (
              <div className="divide-y divide-gray-50">
                {monthlySummary.topProducts.slice(0, 8).map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="text-xs font-bold text-gray-400 w-5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                      <p className="text-xs text-gray-500">ขาย {p.quantity} ชิ้น</p>
                    </div>
                    <span className="text-sm font-semibold text-green-600">{formatCurrency(p.revenue)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-4 py-6 text-sm text-gray-400 text-center">ยังไม่มีข้อมูล</p>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-yellow-500" />
                สินค้าใกล้หมด
              </CardTitle>
              <Link href="/inventory" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                จัดการสต็อก <ArrowRight size={12} />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {monthlySummary?.lowStock?.length ? (
              <div className="divide-y divide-gray-50">
                {monthlySummary.lowStock.slice(0, 8).map((p) => (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                      <p className="text-xs text-gray-500">ขั้นต่ำ {p.minStock} ชิ้น</p>
                    </div>
                    <Badge variant={p.stock === 0 ? 'destructive' : 'warning'}>
                      เหลือ {p.stock} ชิ้น
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-4 py-6 text-sm text-gray-400 text-center">สต็อกปกติทุกรายการ</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: string; bg: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center`}>{icon}</div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-lg font-bold text-gray-900 leading-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
