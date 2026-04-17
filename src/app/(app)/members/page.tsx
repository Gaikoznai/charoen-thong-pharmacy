'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Search, Edit, Trash2, RefreshCw, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Member } from '@/types';

const emptyMember = (): Partial<Member> => ({
  name: '', phone: '', email: '', address: '', birthDate: '', notes: '', status: 'active',
});

export default function MembersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editMember, setEditMember] = useState<Partial<Member>>(emptyMember());
  const [isEditing, setIsEditing] = useState(false);

  const { data: members = [], isLoading, refetch } = useQuery<Member[]>({
    queryKey: ['members', search],
    queryFn: () => fetch(`/api/members?search=${encodeURIComponent(search)}`).then((r) => r.json()),
  });

  const saveMutation = useMutation({
    mutationFn: (data: Partial<Member>) => {
      if (isEditing && data.id) {
        return fetch(`/api/members/${data.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then((r) => r.json());
      }
      return fetch('/api/members', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then((r) => r.json());
    },
    onSuccess: (data) => {
      if (data.error) { toast.error(data.error); return; }
      toast.success(isEditing ? 'แก้ไขสมาชิกสำเร็จ' : 'เพิ่มสมาชิกสำเร็จ');
      qc.invalidateQueries({ queryKey: ['members'] });
      setShowModal(false);
    },
    onError: () => toast.error('เกิดข้อผิดพลาด'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/members/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => { toast.success('ลบสมาชิกสำเร็จ'); qc.invalidateQueries({ queryKey: ['members'] }); },
    onError: () => toast.error('เกิดข้อผิดพลาด'),
  });

  const openAdd = () => { setEditMember(emptyMember()); setIsEditing(false); setShowModal(true); };
  const openEdit = (m: Member) => { setEditMember({ ...m }); setIsEditing(true); setShowModal(true); };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">สมาชิก</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw size={14} /> รีเฟรช
          </Button>
          <Button onClick={openAdd} className="gap-1.5">
            <Plus size={16} /> เพิ่มสมาชิก
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" placeholder="ค้นหาชื่อ, เบอร์โทร, รหัสสมาชิก..." />
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />)}</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">สมาชิก</th>
                <th className="px-4 py-3 text-left">เบอร์โทร</th>
                <th className="px-4 py-3 text-left">วันเกิด</th>
                <th className="px-4 py-3 text-center">แต้มสะสม</th>
                <th className="px-4 py-3 text-right">ยอดซื้อรวม</th>
                <th className="px-4 py-3 text-center">วันสมัคร</th>
                <th className="px-4 py-3 text-center">สถานะ</th>
                <th className="px-4 py-3 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">ไม่พบสมาชิก</td></tr>
              ) : members.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-medium shrink-0">
                        {m.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{m.name}</p>
                        <p className="text-xs text-gray-500">#{m.code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{m.phone || '-'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{m.birthDate ? formatDate(m.birthDate) : '-'}</td>
                  <td className="px-4 py-3 text-center"><Badge variant="default">{m.points} แต้ม</Badge></td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(m.totalSpent)}</td>
                  <td className="px-4 py-3 text-center text-xs text-gray-500">{formatDate(m.joinDate)}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={m.status === 'active' ? 'success' : 'secondary'}>{m.status === 'active' ? 'ใช้งาน' : 'ปิด'}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(m)} className="p-1.5 hover:bg-blue-50 rounded text-gray-400 hover:text-blue-600 transition-colors"><Edit size={14} /></button>
                      <button onClick={() => { if (confirm(`ลบสมาชิก "${m.name}" ?`)) deleteMutation.mutate(m.id); }} className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={isEditing ? 'แก้ไขข้อมูลสมาชิก' : 'เพิ่มสมาชิกใหม่'} size="md">
        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(editMember); }} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700">ชื่อ-นามสกุล *</label>
              <Input className="mt-1" value={editMember.name || ''} onChange={(e) => setEditMember({ ...editMember, name: e.target.value })} required />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">เบอร์โทร</label>
              <Input className="mt-1" value={editMember.phone || ''} onChange={(e) => setEditMember({ ...editMember, phone: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">อีเมล</label>
              <Input type="email" className="mt-1" value={editMember.email || ''} onChange={(e) => setEditMember({ ...editMember, email: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">วันเกิด</label>
              <Input type="date" className="mt-1" value={editMember.birthDate || ''} onChange={(e) => setEditMember({ ...editMember, birthDate: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">สถานะ</label>
              <select className="mt-1 w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={editMember.status || 'active'} onChange={(e) => setEditMember({ ...editMember, status: e.target.value as 'active' | 'inactive' })}>
                <option value="active">ใช้งาน</option>
                <option value="inactive">ปิดการใช้งาน</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700">ที่อยู่</label>
              <textarea className="mt-1 w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" rows={2} value={editMember.address || ''} onChange={(e) => setEditMember({ ...editMember, address: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700">หมายเหตุ</label>
              <textarea className="mt-1 w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" rows={2} value={editMember.notes || ''} onChange={(e) => setEditMember({ ...editMember, notes: e.target.value })} />
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
