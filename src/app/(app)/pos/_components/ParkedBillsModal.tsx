'use client';
import { useParkedBillsStore, ParkedBill } from '@/store/parked-bills';
import { formatCurrency, formatDateTime } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  onRecall: (bill: ParkedBill) => void;
}

export function ParkedBillsModal({ open, onClose, onRecall }: Props) {
  const { bills, cancelBill } = useParkedBillsStore();

  if (!open) return null;

  const active = bills.filter((b) => b.status === 'parked' || b.status === 'recalled');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-[900px] max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="bg-blue-900 text-white px-4 py-2.5 rounded-t-lg flex items-center justify-between">
          <h3 className="font-bold">รายการบิลที่พัก (F5) — {active.length} บิล</h3>
          <button onClick={onClose} className="hover:bg-white/20 w-7 h-7 rounded">✕</button>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">เลขบิล</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">เวลาพัก</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">ลูกค้า</th>
                <th className="px-3 py-2 text-center font-semibold text-gray-700">รายการ</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-700">ยอดรวม</th>
                <th className="px-3 py-2 text-center font-semibold text-gray-700">สถานะ</th>
                <th className="px-3 py-2 text-center font-semibold text-gray-700">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {active.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">ยังไม่มีบิลที่พัก</td></tr>
              ) : active.map((b) => (
                <tr key={b.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono text-blue-700 font-bold">{b.billNo}</td>
                  <td className="px-3 py-2 text-gray-600">{formatDateTime(b.createdAt)}</td>
                  <td className="px-3 py-2">{b.member?.name || <span className="text-gray-400">—</span>}</td>
                  <td className="px-3 py-2 text-center">{b.items.length}</td>
                  <td className="px-3 py-2 text-right font-semibold">{formatCurrency(Math.max(0, b.subtotal - b.discount))}</td>
                  <td className="px-3 py-2 text-center">
                    {b.status === 'parked' ? (
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">พัก</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">เรียกคืนแล้ว</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center space-x-1">
                    <button
                      onClick={() => { onRecall(b); onClose(); }}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium"
                    >
                      เรียกคืน
                    </button>
                    <button
                      onClick={() => { if (confirm('ยกเลิกบิลนี้?')) cancelBill(b.id); }}
                      className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium"
                    >
                      ยกเลิก
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg text-xs text-gray-500 text-center">
          บิลจะอยู่ในรายการจนกว่าจะชำระเงินหรือยกเลิก • ข้อมูล sync ไปยัง Google Sheets อัตโนมัติ
        </div>
      </div>
    </div>
  );
}
