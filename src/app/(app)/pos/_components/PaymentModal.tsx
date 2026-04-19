'use client';
import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';

interface Props {
  open: boolean;
  finalAmount: number;
  memberName?: string;
  onClose: () => void;
  onConfirm: (cashReceived: number, method: 'cash' | 'transfer' | 'credit') => void;
  isSubmitting: boolean;
}

const COINS = [1, 2, 5, 10];
const NOTES = [20, 50, 100, 500, 1000];

export function PaymentModal({ open, finalAmount, memberName, onClose, onConfirm, isSubmitting }: Props) {
  const [method, setMethod] = useState<'cash' | 'transfer' | 'credit'>('cash');
  const [cashReceived, setCashReceived] = useState(0);

  useEffect(() => {
    if (open) {
      setMethod('cash');
      setCashReceived(0);
    }
  }, [open]);

  const addCoin = (v: number) => setCashReceived((c) => Math.round((c + v) * 100) / 100);
  const setNote = (v: number) => setCashReceived(v);
  const exactAmount = () => setCashReceived(finalAmount);
  const clear = () => setCashReceived(0);

  const change = Math.max(0, cashReceived - finalAmount);
  const canConfirm = method !== 'cash' || cashReceived >= finalAmount;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-[560px]" onClick={(e) => e.stopPropagation()}>
        <div className="bg-blue-900 text-white px-4 py-2.5 rounded-t-lg flex items-center justify-between">
          <h3 className="font-bold">ชำระเงิน</h3>
          <button onClick={onClose} disabled={isSubmitting} className="hover:bg-white/20 w-7 h-7 rounded disabled:opacity-40">✕</button>
        </div>

        <div className="p-5">
          {/* Amount display */}
          <div className="bg-gradient-to-br from-blue-900 to-blue-800 text-white rounded-lg p-4 mb-4">
            <div className="text-xs uppercase tracking-wider opacity-80">ยอดที่ต้องชำระ</div>
            <div className="text-4xl font-bold mt-1">{formatCurrency(finalAmount)}</div>
            {memberName && <div className="text-xs mt-1 opacity-80">สมาชิก: {memberName}</div>}
          </div>

          {/* Payment Method */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {([
              { v: 'cash', label: 'เงินสด', icon: '💵' },
              { v: 'transfer', label: 'โอนเงิน', icon: '📱' },
              { v: 'credit', label: 'บัตรเครดิต', icon: '💳' },
            ] as const).map((m) => (
              <button
                key={m.v}
                onClick={() => setMethod(m.v)}
                className={`py-2.5 rounded-lg border-2 transition-all text-sm font-semibold ${
                  method === m.v
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <span className="mr-1">{m.icon}</span> {m.label}
              </button>
            ))}
          </div>

          {method === 'cash' && (
            <>
              {/* Cash received display */}
              <div className="bg-gray-900 text-white rounded-lg p-4 mb-3 grid grid-cols-2">
                <div>
                  <div className="text-[10px] opacity-60 uppercase">รับเงิน</div>
                  <div className="text-2xl font-bold text-yellow-300">{formatCurrency(cashReceived)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] opacity-60 uppercase">เงินทอน</div>
                  <div className={`text-2xl font-bold ${change > 0 ? 'text-green-300' : 'text-gray-400'}`}>
                    {formatCurrency(change)}
                  </div>
                </div>
              </div>

              {/* Coins */}
              <div className="mb-3">
                <div className="text-xs font-semibold text-gray-500 mb-1.5">เหรียญ (บวกสะสม)</div>
                <div className="grid grid-cols-4 gap-2">
                  {COINS.map((c) => (
                    <button
                      key={c}
                      onClick={() => addCoin(c)}
                      className="py-2.5 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded text-sm font-bold text-amber-900 transition-colors"
                    >
                      + ฿{c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Banknotes */}
              <div className="mb-3">
                <div className="text-xs font-semibold text-gray-500 mb-1.5">ธนบัตร</div>
                <div className="grid grid-cols-5 gap-2">
                  {NOTES.map((n) => (
                    <button
                      key={n}
                      onClick={() => setNote(n)}
                      className="py-2.5 bg-green-100 hover:bg-green-200 border border-green-300 rounded text-sm font-bold text-green-900 transition-colors"
                    >
                      ฿{n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  onClick={exactAmount}
                  className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-bold"
                >
                  พอดี
                </button>
                <button
                  onClick={clear}
                  className="py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-sm font-bold"
                >
                  ล้าง
                </button>
              </div>
            </>
          )}

          <button
            onClick={() => onConfirm(method === 'cash' ? cashReceived : finalAmount, method)}
            disabled={!canConfirm || isSubmitting}
            className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg font-bold text-lg transition-colors"
          >
            {isSubmitting ? 'กำลังบันทึก...' : 'ยืนยันการชำระเงิน ▶'}
          </button>
        </div>
      </div>
    </div>
  );
}
