'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp, ShoppingCart, Package, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';

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

export default function ReportsPage() {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const today = now.toISOString().split('T')[0];
  const [dateFrom, setDateFrom] = useState(firstDay);
  const [dateTo, setDateTo] = useState(today);
  const [applied, setApplied] = useState({ from: firstDay, to: today });

  const { data, isLoading, refetch } = useQuery<Summary>({
    queryKey: ['reports-summary-full', applied.from, applied.to],
    queryFn: () => fetch(`/api/reports/summary?dateFrom=${applied.from}&dateTo=${applied.to}`).then((r) => r.json()),
  });

  const maxRevenue = Math.max(...(data?.daily?.map((d) => d.revenue) || [1]));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">รายงาน</h1>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
          <RefreshCw size={14} /> รีเฟรช
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">ตั้งแต่</label>
          <Input type="date" className="w-36" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">ถึง</label>
          <Input type="date" className="w-36" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <Button onClick={() => setApplied({ from: dateFrom, to: dateTo })}>ค้นหา</Button>
        <div className="flex gap-2 ml-2">
          {['วันนี้', 'สัปดาห์นี้', 'เดือนนี้'].map((label, i) => {
            const d = new Date();
            let from = today;
            if (i === 1) { const day = d.getDay(); d.setDate(d.getDate() - day); from = d.toISOString().split('T')[0]; }
            if (i === 2) from = firstDay;
            return (
              <button key={label} onClick={() => { setDateFrom(from); setDateTo(today); setApplied({ from, to: today }); }} className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded animate-pulse" />)}</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="ยอดขายรวม" value={formatCurrency(data?.totalRevenue || 0)} icon={<TrendingUp size={20} className="text-green-600" />} bg="bg-green-50" />
            <StatCard label="จำนวนบิล" value={`${data?.totalTransactions || 0} บิล`} icon={<ShoppingCart size={20} className="text-blue-600" />} bg="bg-blue-50" />
            <StatCard label="กำไรขั้นต้น" value={formatCurrency(data?.grossProfit || 0)} icon={<BarChart3 size={20} className="text-orange-600" />} bg="bg-orange-50" />
            <StatCard label="รายการที่ขาย" value={`${data?.totalItemsSold || 0} รายการ`} icon={<Package size={20} className="text-purple-600" />} bg="bg-purple-50" />
          </div>

          {/* Daily Chart */}
          <Card>
            <CardHeader><CardTitle>ยอดขายรายวัน</CardTitle></CardHeader>
            <CardContent>
              {data?.daily?.length ? (
                <div className="overflow-x-auto">
                  <div className="flex items-end gap-2 min-w-max h-48 pb-6 relative">
                    {data.daily.map((d) => (
                      <div key={d.date} className="flex flex-col items-center gap-1 min-w-12">
                        <div className="relative group">
                          <div
                            className="w-10 bg-blue-500 rounded-t transition-all hover:bg-blue-600 cursor-pointer"
                            style={{ height: `${Math.max(4, (d.revenue / maxRevenue) * 160)}px` }}
                          />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            {formatCurrency(d.revenue)} ({d.transactions} บิล)
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 -rotate-45 origin-top-left">{d.date.slice(5)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-center text-sm text-gray-400 py-8">ไม่มีข้อมูล</p>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>สินค้าขายดี</CardTitle></CardHeader>
              <CardContent className="p-0">
                {data?.topProducts?.length ? (
                  <table className="w-full text-sm">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left">#</th>
                        <th className="px-4 py-2 text-left">สินค้า</th>
                        <th className="px-4 py-2 text-right">จำนวน</th>
                        <th className="px-4 py-2 text-right">ยอดขาย</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.topProducts.map((p, i) => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-400 text-xs font-bold">{i + 1}</td>
                          <td className="px-4 py-2 font-medium">{p.name}</td>
                          <td className="px-4 py-2 text-right text-gray-600">{p.quantity}</td>
                          <td className="px-4 py-2 text-right font-semibold text-green-600">{formatCurrency(p.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="px-4 py-8 text-center text-sm text-gray-400">ไม่มีข้อมูล</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>สรุปยอด</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Row label="ยอดขายรวม" value={formatCurrency(data?.totalRevenue || 0)} valueClass="font-bold text-gray-900" />
                <Row label="ส่วนลดรวม" value={`-${formatCurrency(data?.totalDiscount || 0)}`} valueClass="text-red-500" />
                <Row label="กำไรขั้นต้น" value={formatCurrency(data?.grossProfit || 0)} valueClass="font-bold text-green-600" />
                <div className="border-t border-gray-100 pt-3 mt-3">
                  <Row label="จำนวนบิลทั้งหมด" value={`${data?.totalTransactions || 0} บิล`} valueClass="text-gray-700" />
                  <Row label="รายการที่ขาย" value={`${data?.totalItemsSold || 0} รายการ`} valueClass="text-gray-700" />
                  <Row label="มูลค่าเฉลี่ยต่อบิล" value={formatCurrency((data?.totalTransactions || 0) > 0 ? (data?.totalRevenue || 0) / (data?.totalTransactions || 1) : 0)} valueClass="text-gray-700" />
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, bg }: { label: string; value: string; icon: React.ReactNode; bg: string }) {
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

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-gray-500">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}
