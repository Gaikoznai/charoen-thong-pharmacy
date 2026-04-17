'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Category } from '@/types';

export default function CategoriesPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [edit, setEdit] = useState<Partial<Category>>({});
  const [isEditing, setIsEditing] = useState(false);

  const { data: cats = [], isLoading, refetch } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => fetch('/api/categories').then((r) => r.json()),
  });

  const saveMutation = useMutation({
    mutationFn: (d: Partial<Category>) => {
      if (isEditing && d.id) return fetch(`/api/categories/${d.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) }).then((r) => r.json());
      return fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) }).then((r) => r.json());
    },
    onSuccess: (data) => {
      if (data.error) { toast.error(data.error); return; }
      toast.success(isEditing ? 'แก้ไขสำเร็จ' : 'เพิ่มสำเร็จ');
      qc.invalidateQueries({ queryKey: ['categories'] });
      setShowModal(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/categories/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => { toast.success('ลบสำเร็จ'); qc.invalidateQueries({ queryKey: ['categories'] }); },
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">หมวดหมู่สินค้า</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5"><RefreshCw size={14} /> รีเฟรช</Button>
          <Button onClick={() => { setEdit({ name: '', description: '' }); setIsEditing(false); setShowModal(true); }} className="gap-1.5"><Plus size={16} /> เพิ่มหมวดหมู่</Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden max-w-2xl">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">ชื่อหมวดหมู่</th>
              <th className="px-4 py-3 text-left">รายละเอียด</th>
              <th className="px-4 py-3 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={3} className="px-4 py-4 text-center text-gray-400">กำลังโหลด...</td></tr>
            ) : cats.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">ยังไม่มีหมวดหมู่</td></tr>
            ) : cats.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                <td className="px-4 py-3 text-gray-500">{c.description || '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => { setEdit({ ...c }); setIsEditing(true); setShowModal(true); }} className="p-1.5 hover:bg-blue-50 rounded text-gray-400 hover:text-blue-600 transition-colors"><Edit size={14} /></button>
                    <button onClick={() => { if (confirm(`ลบหมวดหมู่ "${c.name}" ?`)) deleteMutation.mutate(c.id); }} className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={isEditing ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่'} size="sm">
        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(edit); }} className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">ชื่อหมวดหมู่ *</label>
            <Input className="mt-1" value={edit.name || ''} onChange={(e) => setEdit({ ...edit, name: e.target.value })} required />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">รายละเอียด</label>
            <textarea className="mt-1 w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" rows={3} value={edit.description || ''} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
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
