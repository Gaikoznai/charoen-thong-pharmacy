'use client';
import { useState, useEffect } from 'react';
import { Member } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (m: Member) => void;
}

export function MemberSearchModal({ open, onClose, onSelect }: Props) {
  const [search, setSearch] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSearch('');
    setMembers([]);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/members?search=${encodeURIComponent(search)}`);
        const d = await r.json();
        setMembers(Array.isArray(d) ? d : []);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [search, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-[720px] max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="bg-blue-900 text-white px-4 py-2.5 rounded-t-lg flex items-center justify-between">
          <h3 className="font-bold">ค้นหาสมาชิก (F2)</h3>
          <button onClick={onClose} className="hover:bg-white/20 w-7 h-7 rounded">✕</button>
        </div>

        <div className="p-4 border-b border-gray-200">
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="พิมพ์ชื่อ / เบอร์โทร / รหัสสมาชิก..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">รหัส</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">ชื่อ-นามสกุล</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">เบอร์โทร</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">ที่อยู่</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">กำลังค้นหา...</td></tr>
              ) : members.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">{search ? 'ไม่พบสมาชิก' : 'พิมพ์เพื่อค้นหา'}</td></tr>
              ) : members.map((m) => (
                <tr
                  key={m.id}
                  onClick={() => { onSelect(m); onClose(); }}
                  className="hover:bg-blue-50 cursor-pointer border-b border-gray-100"
                >
                  <td className="px-4 py-2 font-mono text-blue-700">{m.code}</td>
                  <td className="px-4 py-2">{m.name}</td>
                  <td className="px-4 py-2 font-mono">{m.phone}</td>
                  <td className="px-4 py-2 text-gray-600 truncate max-w-[240px]">{m.address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
