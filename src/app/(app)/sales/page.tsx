'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Search, Eye, X, RefreshCw, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Sale } from '@/types';

const PAY_LABELS: Record<string, string> = { cash: 'เงินสด', transfer: 'โอนเงิน', credit: 'บัตรเครดิต' };

export default function SalesPage() {
  const qc = useQueryClient();
  const today = new Date().toISOString().split('T')[0];
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [viewSale, setViewSale] = useState<Sale | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const { data: sales = [], isLoading, refetch } = useQuery<Sale[]>({
    queryKey: ['sales', dateFrom, dateTo],
    queryFn: () => fetch(`/api/sales?dateFrom=${dateFrom}&dateTo=${dateTo}`).then((r) => r.json()),
  });

  const voidMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/sales/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'voided' }) }).then((r) => r.json()),
    onSuccess: () => { toast.success('ยกเลิกบิลสำเร็จ'); qc.invalidateQueries({ queryKey: ['sales'] }); setViewSale(null); },
    onError: () => toast.error('เกิดข้อผิดพลาด'),
  });

  const handleView = async (sale: Sale) => {
    setLoadingDetail(true);
    const detail = await fetch(`/api/sales/${sale.id}`).then((r) => r.json());
    setViewSale(detail);
    setLoadingDetail(false);
  };

  const totalRevenue = sales.filter((s) => s.status !== 'voided').reduce((sum, s) => sum + s.finalAmount, 0);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">ประวัติการขาย</h1>
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
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">จำนวนบิล</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{sales.filter((s) => s.status !== 'voided').length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">ยอดขายรวม</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">บิลเฉลี่ย</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(sales.filter((s) => s.status !== 'voided').length ? totalRevenue / sales.filter((s) => s.status !== 'voided').length : 0)}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />)}</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">เลขบิล</th>
                <th className="px-4 py-3 text-left">วันเวลา</th>
                <th className="px-4 py-3 text-left">สมาชิก</th>
                <th className="px-4 py-3 text-right">ยอดรวม</th>
                <th className="px-4 py-3 text-right">ส่วนลด</th>
                <th className="px-4 py-3 text-right">ยอดสุทธิ</th>
                <th className="px-4 py-3 text-center">วิธีชำระ</th>
                <th className="px-4 py-3 text-center">สถานะ</th>
                <th className="px-4 py-3 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sales.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">ไม่พบข้อมูลการขาย</td></tr>
              ) : sales.map((s) => (
                <tr key={s.id} className={`hover:bg-gray-50 transition-colors ${s.status === 'voided' ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 font-mono text-xs font-medium text-blue-600">{s.invoiceNo}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatDateTime(s.createdAt)}</td>
                  <td className="px-4 py-3 text-gray-700">{s.memberName || '-'}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(s.subtotal)}</td>
                  <td className="px-4 py-3 text-right text-red-500">{s.discount > 0 ? `-${formatCurrency(s.discount)}` : '-'}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(s.finalAmount)}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="secondary">{PAY_LABELS[s.paymentMethod]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={s.status === 'voided' ? 'destructive' : 'success'}>{s.status === 'voided' ? 'ยกเลิก' : 'สำเร็จ'}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleView(s)} className="p-1.5 hover:bg-blue-50 rounded text-gray-400 hover:text-blue-600 transition-colors"><Eye size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!viewSale} onClose={() => setViewSale(null)} title={`รายละเอียดบิล ${viewSale?.invoiceNo}`} size="md">
        {viewSale && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">วันเวลา:</span> <span className="font-medium">{formatDateTime(viewSale.createdAt)}</span></div>
              <div><span className="text-gray-500">สมาชิก:</span> <span className="font-medium">{viewSale.memberName || '-'}</span></div>
              <div><span className="text-gray-500">ชำระด้วย:</span> <span className="font-medium">{PAY_LABELS[viewSale.paymentMethod]}</span></div>
              <div><span className="text-gray-500">สถานะ:</span> <Badge variant={viewSale.status === 'voided' ? 'destructive' : 'success'}>{viewSale.status === 'voided' ? 'ยกเลิก' : 'สำเร็จ'}</Badge></div>
            </div>

            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-3 py-2 text-left">สินค้า</th>
                    <th className="px-3 py-2 text-center">จำนวน</th>
                    <th className="px-3 py-2 text-right">ราคา</th>
                    <th className="px-3 py-2 text-right">รวม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {viewSale.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2">{item.productName}</td>
                      <td className="px-3 py-2 text-center">{item.quantity}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-3 py-2 text-right font-medium">{formatCurrency(item.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-2 text-sm border-t border-gray-200 pt-3">
              <div className="flex justify-between"><span className="text-gray-500">ยอดรวม</span><span>{formatCurrency(viewSale.subtotal)}</span></div>
              {viewSale.discount > 0 && <div className="flex justify-between"><span className="text-gray-500">ส่วนลด</span><span className="text-red-500">-{formatCurrency(viewSale.discount)}</span></div>}
              <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2"><span>ยอดสุทธิ</span><span className="text-blue-600">{formatCurrency(viewSale.finalAmount)}</span></div>
              {viewSale.paymentMethod === 'cash' && (
                <>
                  <div className="flex justify-between text-xs text-gray-400"><span>รับเงิน</span><span>{formatCurrency(viewSale.cashReceived)}</span></div>
                  <div className="flex justify-between text-xs text-gray-400"><span>เงินทอน</span><span>{formatCurrency(viewSale.change)}</span></div>
                </>
              )}
            </div>

            {viewSale.status !== 'voided' && (
              <div className="pt-2 border-t border-gray-200">
                <Button variant="destructive" size="sm" onClick={() => { if (confirm('ยืนยันการยกเลิกบิลนี้?')) voidMutation.mutate(viewSale.id); }}>
                  ยกเลิกบิล
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
