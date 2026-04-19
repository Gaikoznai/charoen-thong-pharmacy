'use client';
import { useState, useEffect } from 'react';
import { Member } from '@/types';

interface Props {
  open: boolean;
  member: Member | null;
  onClose: () => void;
  onSaved: (m: Member) => void;
}

export function EditMemberModal({ open, member, onClose, onSaved }: Props) {
  const [form, setForm] = useState<Partial<Member>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(member ? { ...member } : {
        name: '', phone: '', address: '', email: '', birthDate: '',
        notes: '', chronicDisease: '', drugAllergy: '',
      });
    }
  }, [open, member]);

  const update = (k: keyof Member, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name || !form.phone) { alert('กรุณากรอกชื่อและเบอร์โทร'); return; }
    setSaving(true);
    try {
      const method = form.id ? 'PUT' : 'POST';
      const url = form.id ? `/api/members/${form.id}` : '/api/members';
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Error');

      const refreshed = await fetch(`/api/members?search=${form.phone}`).then((x) => x.json());
      const saved = Array.isArray(refreshed) ? refreshed.find((m: Member) => m.phone === form.phone) : null;
      if (saved) onSaved(saved);
      onClose();
    } catch (e) {
      alert('เกิดข้อผิดพลาด: ' + (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-[600px] max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="bg-blue-900 text-white px-4 py-2.5 rounded-t-lg flex items-center justify-between">
          <h3 className="font-bold">{form.id ? 'แก้ไขรายละเอียดลูกค้า' : 'เพิ่มสมาชิกใหม่'}</h3>
          <button onClick={onClose} className="hover:bg-white/20 w-7 h-7 rounded">✕</button>
        </div>

        <div className="p-5 overflow-auto space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="ชื่อ-นามสกุล *" value={form.name || ''} onChange={(v) => update('name', v)} />
            <Field label="เบอร์โทร *" value={form.phone || ''} onChange={(v) => update('phone', v)} />
          </div>
          <Field label="ที่อยู่" value={form.address || ''} onChange={(v) => update('address', v)} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="อีเมล" value={form.email || ''} onChange={(v) => update('email', v)} />
            <Field label="วันเกิด" type="date" value={form.birthDate || ''} onChange={(v) => update('birthDate', v)} />
          </div>
          <Field label="โรคประจำตัว" value={form.chronicDisease || ''} onChange={(v) => update('chronicDisease', v)} />
          <Field label="ยาที่แพ้" value={form.drugAllergy || ''} onChange={(v) => update('drugAllergy', v)} />
          <div>
            <label className="text-xs font-semibold text-gray-600">หมายเหตุ</label>
            <textarea
              value={form.notes || ''}
              onChange={(e) => update('notes', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50">ยกเลิก</button>
          <button onClick={save} disabled={saving} className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded text-sm font-semibold disabled:bg-blue-300">
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-600">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
