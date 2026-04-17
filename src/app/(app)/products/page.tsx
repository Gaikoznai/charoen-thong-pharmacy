'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Search, Edit, Trash2, Package, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Product, Category, Supplier } from '@/types';

const UNITS = ['เม็ด', 'แคปซูล', 'ขวด', 'กล่อง', 'ซอง', 'หลอด', 'ชิ้น', 'แผง', 'มล', 'กรัม'];

const emptyProduct = (): Partial<Product> => ({
  name: '', genericName: '', barcode: '', categoryId: '', price: 0, costPrice: 0, stock: 0,
  unit: 'เม็ด', minStock: 5, expiryDate: '', supplierId: '', description: '',
  requirePrescription: false, status: 'active',
});

export default function ProductsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Partial<Product>>(emptyProduct());
  const [isEditing, setIsEditing] = useState(false);

  const { data: products = [], isLoading, refetch } = useQuery<Product[]>({
    queryKey: ['products', search],
    queryFn: () => fetch(`/api/products?search=${encodeURIComponent(search)}`).then((r) => r.json()),
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => fetch('/api/categories').then((r) => r.json()),
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ['suppliers'],
    queryFn: () => fetch('/api/suppliers').then((r) => r.json()),
  });

  const saveMutation = useMutation({
    mutationFn: (data: Partial<Product>) => {
      if (isEditing && data.id) {
        return fetch(`/api/products/${data.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then((r) => r.json());
      }
      return fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then((r) => r.json());
    },
    onSuccess: (data) => {
      if (data.error) { toast.error(data.error); return; }
      toast.success(isEditing ? 'แก้ไขสินค้าสำเร็จ' : 'เพิ่มสินค้าสำเร็จ');
      qc.invalidateQueries({ queryKey: ['products'] });
      setShowModal(false);
    },
    onError: () => toast.error('เกิดข้อผิดพลาด'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/products/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => { toast.success('ลบสินค้าสำเร็จ'); qc.invalidateQueries({ queryKey: ['products'] }); },
    onError: () => toast.error('เกิดข้อผิดพลาด'),
  });

  const openAdd = () => { setEditProduct(emptyProduct()); setIsEditing(false); setShowModal(true); };
  const openEdit = (p: Product) => { setEditProduct({ ...p }); setIsEditing(true); setShowModal(true); };
  const handleDelete = (p: Product) => {
    if (confirm(`ลบสินค้า "${p.name}" ?`)) deleteMutation.mutate(p.id);
  };

  const getCatName = (id: string) => categories.find((c) => c.id === id)?.name || '-';

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">สินค้า / ยา</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw size={14} /> รีเฟรช
          </Button>
          <Button onClick={openAdd} className="gap-1.5">
            <Plus size={16} /> เพิ่มสินค้า
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" placeholder="ค้นหาชื่อยา, บาร์โค้ด..." />
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />)}</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">ชื่อสินค้า</th>
                <th className="px-4 py-3 text-left">บาร์โค้ด</th>
                <th className="px-4 py-3 text-left">หมวดหมู่</th>
                <th className="px-4 py-3 text-right">ราคาขาย</th>
                <th className="px-4 py-3 text-right">ทุน</th>
                <th className="px-4 py-3 text-center">สต็อก</th>
                <th className="px-4 py-3 text-center">วันหมดอายุ</th>
                <th className="px-4 py-3 text-center">สถานะ</th>
                <th className="px-4 py-3 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">ไม่พบสินค้า</td></tr>
              ) : products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.genericName}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.barcode || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{getCatName(p.categoryId)}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(p.price)}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{formatCurrency(p.costPrice)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-medium ${p.stock <= 0 ? 'text-red-600' : p.stock <= p.minStock ? 'text-yellow-600' : 'text-gray-700'}`}>
                      {p.stock} {p.unit}
                    </span>
                    {p.stock <= p.minStock && p.stock > 0 && <AlertTriangle size={12} className="inline ml-1 text-yellow-500" />}
                    {p.stock <= 0 && <span className="ml-1 text-xs text-red-500">(หมด)</span>}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500 text-xs">{p.expiryDate ? formatDate(p.expiryDate) : '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={p.status === 'active' ? 'success' : 'secondary'}>{p.status === 'active' ? 'ใช้งาน' : 'ปิด'}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-blue-50 rounded text-gray-400 hover:text-blue-600 transition-colors"><Edit size={14} /></button>
                      <button onClick={() => handleDelete(p)} className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={isEditing ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'} size="lg">
        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(editProduct); }} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700">ชื่อสินค้า *</label>
              <Input className="mt-1" value={editProduct.name || ''} onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })} required />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">ชื่อสามัญ (Generic Name)</label>
              <Input className="mt-1" value={editProduct.genericName || ''} onChange={(e) => setEditProduct({ ...editProduct, genericName: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">บาร์โค้ด</label>
              <Input className="mt-1" value={editProduct.barcode || ''} onChange={(e) => setEditProduct({ ...editProduct, barcode: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">ราคาขาย (฿) *</label>
              <Input type="number" className="mt-1" value={editProduct.price || ''} onChange={(e) => setEditProduct({ ...editProduct, price: parseFloat(e.target.value) || 0 })} min={0} step="0.01" required />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">ราคาทุน (฿)</label>
              <Input type="number" className="mt-1" value={editProduct.costPrice || ''} onChange={(e) => setEditProduct({ ...editProduct, costPrice: parseFloat(e.target.value) || 0 })} min={0} step="0.01" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">จำนวนในสต็อก</label>
              <Input type="number" className="mt-1" value={editProduct.stock || ''} onChange={(e) => setEditProduct({ ...editProduct, stock: parseInt(e.target.value) || 0 })} min={0} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">หน่วย</label>
              <select className="mt-1 w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={editProduct.unit || 'เม็ด'} onChange={(e) => setEditProduct({ ...editProduct, unit: e.target.value })}>
                {UNITS.map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">สต็อกขั้นต่ำ</label>
              <Input type="number" className="mt-1" value={editProduct.minStock || ''} onChange={(e) => setEditProduct({ ...editProduct, minStock: parseInt(e.target.value) || 0 })} min={0} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">วันหมดอายุ</label>
              <Input type="date" className="mt-1" value={editProduct.expiryDate || ''} onChange={(e) => setEditProduct({ ...editProduct, expiryDate: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">หมวดหมู่</label>
              <select className="mt-1 w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={editProduct.categoryId || ''} onChange={(e) => setEditProduct({ ...editProduct, categoryId: e.target.value })}>
                <option value="">-- เลือกหมวดหมู่ --</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">ผู้จัดจำหน่าย</label>
              <select className="mt-1 w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={editProduct.supplierId || ''} onChange={(e) => setEditProduct({ ...editProduct, supplierId: e.target.value })}>
                <option value="">-- เลือกผู้จัดจำหน่าย --</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">สถานะ</label>
              <select className="mt-1 w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={editProduct.status || 'active'} onChange={(e) => setEditProduct({ ...editProduct, status: e.target.value as 'active' | 'inactive' })}>
                <option value="active">ใช้งาน</option>
                <option value="inactive">ปิดการใช้งาน</option>
              </select>
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="rx" checked={!!editProduct.requirePrescription} onChange={(e) => setEditProduct({ ...editProduct, requirePrescription: e.target.checked })} className="w-4 h-4 rounded" />
              <label htmlFor="rx" className="text-sm text-gray-700">ต้องมีใบสั่งแพทย์</label>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700">รายละเอียด</label>
              <textarea className="mt-1 w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" rows={3} value={editProduct.description || ''} onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>ยกเลิก</Button>
            <Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? 'กำลังบันทึก...' : 'บันทึก'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
