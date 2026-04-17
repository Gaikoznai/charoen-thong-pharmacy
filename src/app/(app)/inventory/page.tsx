'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Search, AlertTriangle, RefreshCw, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { formatDate } from '@/lib/utils';
import { Product } from '@/types';

export default function InventoryPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
  const [editStock, setEditStock] = useState<{ product: Product; newStock: number } | null>(null);

  const { data: products = [], isLoading, refetch } = useQuery<Product[]>({
    queryKey: ['products', search],
    queryFn: () => fetch(`/api/products?search=${encodeURIComponent(search)}`).then((r) => r.json()),
  });

  const updateStockMutation = useMutation({
    mutationFn: ({ id, stock }: { id: string; stock: number }) =>
      fetch(`/api/products/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stock }) }).then((r) => r.json()),
    onSuccess: () => {
      toast.success('อัพเดทสต็อกสำเร็จ');
      qc.invalidateQueries({ queryKey: ['products'] });
      setEditStock(null);
    },
    onError: () => toast.error('เกิดข้อผิดพลาด'),
  });

  const filtered = products.filter((p) => {
    if (filter === 'low') return p.stock > 0 && p.stock <= p.minStock;
    if (filter === 'out') return p.stock <= 0;
    return true;
  });

  const outCount = products.filter((p) => p.stock <= 0).length;
  const lowCount = products.filter((p) => p.stock > 0 && p.stock <= p.minStock).length;

  const getExpiry = (dateStr: string) => {
    if (!dateStr) return null;
    const diff = new Date(dateStr).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">สต็อกสินค้า</h1>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
          <RefreshCw size={14} /> รีเฟรช
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4 max-w-lg">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{products.length}</p>
          <p className="text-xs text-gray-500 mt-1">สินค้าทั้งหมด</p>
        </div>
        <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{lowCount}</p>
          <p className="text-xs text-yellow-600 mt-1">สต็อกต่ำ</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{outCount}</p>
          <p className="text-xs text-red-600 mt-1">หมดสต็อก</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-64" placeholder="ค้นหาสินค้า..." />
        </div>
        <div className="flex gap-1">
          {[['all', 'ทั้งหมด'], ['low', 'สต็อกต่ำ'], ['out', 'หมดสต็อก']].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v as typeof filter)} className={`px-3 py-1.5 text-sm rounded-md transition-colors ${filter === v ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>{l}</button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">สินค้า</th>
                <th className="px-4 py-3 text-center">สต็อกปัจจุบัน</th>
                <th className="px-4 py-3 text-center">สต็อกขั้นต่ำ</th>
                <th className="px-4 py-3 text-center">วันหมดอายุ</th>
                <th className="px-4 py-3 text-center">สถานะ</th>
                <th className="px-4 py-3 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">ไม่พบสินค้า</td></tr>
              ) : filtered.map((p) => {
                const expDays = getExpiry(p.expiryDate);
                const isOut = p.stock <= 0;
                const isLow = !isOut && p.stock <= p.minStock;
                const isExpiringSoon = expDays !== null && expDays <= 90 && expDays > 0;
                const isExpired = expDays !== null && expDays <= 0;
                return (
                  <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${isOut ? 'bg-red-50' : isLow ? 'bg-yellow-50' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.genericName}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold text-lg ${isOut ? 'text-red-600' : isLow ? 'text-yellow-600' : 'text-gray-900'}`}>
                        {p.stock}
                      </span>
                      <span className="text-xs text-gray-400 ml-1">{p.unit}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500">{p.minStock}</td>
                    <td className="px-4 py-3 text-center">
                      {p.expiryDate ? (
                        <span className={`text-xs ${isExpired ? 'text-red-600 font-semibold' : isExpiringSoon ? 'text-yellow-600' : 'text-gray-500'}`}>
                          {formatDate(p.expiryDate)}
                          {isExpired && ' (หมดอายุ)'}
                          {isExpiringSoon && !isExpired && ` (${expDays} วัน)`}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isOut ? <Badge variant="destructive">หมดสต็อก</Badge>
                        : isLow ? <Badge variant="warning"><AlertTriangle size={11} className="mr-1" />ใกล้หมด</Badge>
                        : <Badge variant="success">ปกติ</Badge>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button size="sm" variant="outline" onClick={() => setEditStock({ product: p, newStock: p.stock })}>
                        อัพเดทสต็อก
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!editStock} onClose={() => setEditStock(null)} title="อัพเดทสต็อก" size="sm">
        {editStock && (
          <div className="p-5 space-y-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="font-medium text-gray-900">{editStock.product.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">สต็อกปัจจุบัน: {editStock.product.stock} {editStock.product.unit}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">จำนวนสต็อกใหม่</label>
              <Input
                type="number"
                className="mt-1 text-center text-lg font-bold"
                value={editStock.newStock}
                onChange={(e) => setEditStock({ ...editStock, newStock: parseInt(e.target.value) || 0 })}
                min={0}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button variant="outline" onClick={() => setEditStock(null)}>ยกเลิก</Button>
              <Button onClick={() => updateStockMutation.mutate({ id: editStock.product.id, stock: editStock.newStock })} disabled={updateStockMutation.isPending}>
                {updateStockMutation.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
