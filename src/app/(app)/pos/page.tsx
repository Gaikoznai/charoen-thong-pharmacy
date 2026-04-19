'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Product, CartItem } from '@/types';
import { useCartStore } from '@/store/cart';
import { useParkedBillsStore, ParkedBill } from '@/store/parked-bills';
import { useAuthStore } from '@/store/auth';
import { formatCurrency, generateInvoiceNo } from '@/lib/utils';
import { MemberSearchModal } from './_components/MemberSearchModal';
import { EditMemberModal } from './_components/EditMemberModal';
import { ParkedBillsModal } from './_components/ParkedBillsModal';
import { PaymentModal } from './_components/PaymentModal';

export default function POSPage() {
  const router = useRouter();
  const { username, logout } = useAuthStore();
  const {
    items, member, discount, notes,
    addItem, removeItem, updateQuantity,
    setMember, setDiscount, clearCart, subtotal, finalAmount,
  } = useCartStore();
  const parkedStore = useParkedBillsStore();

  const [billNo, setBillNo] = useState(() => generateInvoiceNo());
  const [recalledBillId, setRecalledBillId] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const [modalMember, setModalMember] = useState(false);
  const [modalEdit, setModalEdit] = useState(false);
  const [modalParked, setModalParked] = useState(false);
  const [modalPay, setModalPay] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);

  // Clock tick
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Toast auto-hide
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => setToast({ msg, type });

  // Product search
  useEffect(() => {
    if (!searchQuery.trim()) { setProducts([]); return; }
    const t = setTimeout(async () => {
      setLoadingSearch(true);
      try {
        const r = await fetch(`/api/products?search=${encodeURIComponent(searchQuery)}`);
        const d = await r.json();
        setProducts(Array.isArray(d) ? d : []);
      } finally {
        setLoadingSearch(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleAddProduct = useCallback((p: Product) => {
    if (Number(p.stock) <= 0) { showToast('สินค้าหมดสต็อก', 'err'); return; }
    const cartItem: CartItem = {
      productId: p.id,
      productName: p.name,
      barcode: p.barcode,
      price: Number(p.price),
      quantity: 1,
      discount: 0,
      totalPrice: Number(p.price),
      stock: Number(p.stock),
      requirePrescription: String(p.requirePrescription) === 'true',
    };
    addItem(cartItem);
    setSearchQuery('');
    setProducts([]);
    searchRef.current?.focus();
  }, [addItem]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (products.length === 1) handleAddProduct(products[0]);
      else if (products.length > 1) {
        const exact = products.find((p) => p.barcode === searchQuery.trim());
        if (exact) handleAddProduct(exact);
      }
    }
  };

  // F4: Park bill
  const handleParkBill = useCallback(() => {
    if (items.length === 0) { showToast('ไม่มีรายการในบิล', 'err'); return; }
    parkedStore.parkBill({
      member,
      items: [...items],
      discount,
      notes,
      subtotal: subtotal(),
    });
    clearCart();
    setBillNo(generateInvoiceNo());
    setRecalledBillId(null);
    showToast('พักบิลเรียบร้อย → F5 เพื่อดูรายการ');
  }, [items, member, discount, notes, subtotal, parkedStore, clearCart]);

  // Recall parked bill
  const handleRecall = (bill: ParkedBill) => {
    clearCart();
    bill.items.forEach((it) => addItem(it));
    if (bill.member) setMember(bill.member);
    setDiscount(bill.discount);
    setBillNo(bill.billNo);
    setRecalledBillId(bill.id);
    parkedStore.recallBill(bill.id);
    showToast('เรียกคืนบิลเรียบร้อย');
  };

  // F5
  const handleOpenParked = useCallback(() => setModalParked(true), []);

  // F2
  const handleOpenMemberSearch = useCallback(() => setModalMember(true), []);

  // F8: delete selected item
  const handleDeleteSelected = useCallback(() => {
    if (selectedItemId) removeItem(selectedItemId);
  }, [selectedItemId, removeItem]);

  // Cash drawer (mock)
  const handleOpenDrawer = () => showToast('เปิดลิ้นชักเงิน... 🗄️');

  // Payment
  const handleOpenPay = () => {
    if (items.length === 0) { showToast('ไม่มีรายการในบิล', 'err'); return; }
    setModalPay(true);
  };

  const handleConfirmPay = async (cashReceived: number, method: 'cash' | 'transfer' | 'credit') => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          memberId: member?.id || '',
          discount,
          paymentMethod: method,
          cashReceived,
          notes,
          pointsUsed: 0,
          parkedBillId: recalledBillId || undefined,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Error');

      if (recalledBillId) parkedStore.completeBill(recalledBillId);

      showToast(`ขายสำเร็จ ${d.invoiceNo || billNo}`);
      clearCart();
      setBillNo(generateInvoiceNo());
      setRecalledBillId(null);
      setModalPay(false);
      searchRef.current?.focus();
    } catch (e) {
      showToast('เกิดข้อผิดพลาด: ' + (e as Error).message, 'err');
    } finally {
      setSubmitting(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F2') { e.preventDefault(); handleOpenMemberSearch(); }
      else if (e.key === 'F4') { e.preventDefault(); handleParkBill(); }
      else if (e.key === 'F5') { e.preventDefault(); handleOpenParked(); }
      else if (e.key === 'F8') { e.preventDefault(); handleDeleteSelected(); }
      else if (e.key === 'F9') { e.preventDefault(); handleOpenDrawer(); }
      else if (e.key === 'F11') { e.preventDefault(); setModalEdit(true); }
      else if (e.key === 'F12') { e.preventDefault(); handleOpenPay(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleOpenMemberSearch, handleParkBill, handleOpenParked, handleDeleteSelected]);

  const activeParked = useMemo(
    () => parkedStore.bills.filter((b) => b.status === 'parked' || b.status === 'recalled').length,
    [parkedStore.bills]
  );

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const total = subtotal();
  const final = finalAmount();
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-100" style={{ marginLeft: 0 }}>
      {/* HEADER - Dark Blue */}
      <header className="bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 text-white px-5 py-2.5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80">
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-lg">💊</div>
            <div>
              <div className="font-bold text-base leading-tight">เจริญทองเภสัช</div>
              <div className="text-[10px] opacity-70 leading-tight">Pharmacy POS v1.20</div>
            </div>
          </Link>

          <div className="h-10 w-px bg-white/20" />

          <div className="flex gap-4 text-xs">
            <div>
              <div className="opacity-60 text-[10px] uppercase">เลขที่บิล</div>
              <div className="font-mono font-bold text-base text-yellow-300">{billNo}</div>
            </div>
            <div>
              <div className="opacity-60 text-[10px] uppercase">วันที่/เวลา</div>
              <div className="font-mono text-sm">{now.toLocaleString('th-TH')}</div>
            </div>
            <div>
              <div className="opacity-60 text-[10px] uppercase">สถานะ</div>
              <div className="text-sm font-semibold text-green-300">
                {recalledBillId ? '● เรียกคืนบิลค้าง' : '● กำลังขาย'}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="opacity-80">ผู้ใช้: <span className="font-semibold">{username || '—'}</span></span>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 rounded font-semibold"
          >
            ออกจากระบบ
          </button>
        </div>
      </header>

      {/* MAIN BODY */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT PANEL */}
        <aside className="w-[380px] bg-white border-r border-gray-300 flex flex-col">

          {/* Customer Info (readonly) */}
          <section className="p-3 border-b border-gray-200 bg-gradient-to-b from-slate-50 to-white">
            <h3 className="text-xs font-bold text-blue-900 mb-2 flex items-center gap-1">
              👤 ข้อมูลลูกค้า
            </h3>
            <div className="space-y-1.5 text-xs">
              <ReadonlyField label="รหัส" value={member?.code || ''} />
              <ReadonlyField label="ชื่อ" value={member?.name || ''} />
              <ReadonlyField label="โทร" value={member?.phone || ''} />
              <ReadonlyField label="ที่อยู่" value={member?.address || ''} multiline />
              {member && (
                <div className="flex justify-between text-[11px] text-gray-500 pt-1">
                  <span>คะแนนสะสม: <b className="text-blue-700">{member.points}</b></span>
                  <span>ยอดซื้อรวม: {formatCurrency(member.totalSpent)}</span>
                </div>
              )}
            </div>
          </section>

          {/* Medical Info (readonly) */}
          <section className="p-3 border-b border-gray-200 bg-red-50/30">
            <h3 className="text-xs font-bold text-red-900 mb-2 flex items-center gap-1">
              ⚕️ ข้อมูลทางการแพทย์
            </h3>
            <div className="space-y-1.5 text-xs">
              <ReadonlyField label="โรคประจำตัว" value={member?.chronicDisease || ''} />
              <ReadonlyField label="แพ้ยา" value={member?.drugAllergy || ''} danger />
              <ReadonlyField label="หมายเหตุ" value={member?.notes || ''} />
            </div>
          </section>

          {/* Action Buttons */}
          <section className="p-2 bg-gray-50 border-b border-gray-200 grid grid-cols-3 gap-1.5">
            <ActionBtn label="F2 ค้นหา" color="blue" onClick={handleOpenMemberSearch} />
            <ActionBtn label="แก้ไข" color="teal" onClick={() => setModalEdit(true)} />
            <ActionBtn label="F4 พักบิล" color="yellow" onClick={handleParkBill} disabled={items.length === 0} />
            <ActionBtn label={`F5 บิลค้าง${activeParked > 0 ? ` (${activeParked})` : ''}`} color="purple" onClick={handleOpenParked} badge={activeParked > 0} />
            <ActionBtn label="F9 เปิดลิ้นชัก" color="gray" onClick={handleOpenDrawer} />
            <ActionBtn label="F8 ลบรายการ" color="red" onClick={handleDeleteSelected} disabled={!selectedItemId} />
          </section>

          {/* Sale Details */}
          <section className="flex-1 flex flex-col overflow-hidden">
            <div className="px-3 py-1.5 bg-blue-900 text-white text-xs font-semibold flex items-center justify-between">
              <span>รายละเอียดการขาย</span>
              <span className="opacity-75">{itemCount} ชิ้น / {items.length} รายการ</span>
            </div>
            <div className="flex-1 overflow-auto">
              {items.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-xs">
                  ยังไม่มีรายการ<br />
                  ค้นหาสินค้าทางด้านขวา →
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-gray-100">
                    <tr className="text-left">
                      <th className="px-2 py-1 font-semibold">สินค้า</th>
                      <th className="px-2 py-1 font-semibold text-center w-12">จน</th>
                      <th className="px-2 py-1 font-semibold text-right w-16">ราคา</th>
                      <th className="px-2 py-1 font-semibold text-right w-16">รวม</th>
                      <th className="w-6" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it) => {
                      const selected = selectedItemId === it.productId;
                      return (
                        <tr
                          key={it.productId}
                          onClick={() => setSelectedItemId(it.productId)}
                          className={`border-b border-gray-100 cursor-pointer ${selected ? 'bg-blue-100' : 'hover:bg-gray-50'}`}
                        >
                          <td className="px-2 py-1.5">
                            <div className="truncate max-w-[140px] font-medium">{it.productName}</div>
                            {it.requirePrescription && <div className="text-[9px] text-orange-600">⚠ ใบสั่งยา</div>}
                          </td>
                          <td className="px-1 py-1.5 text-center">
                            <input
                              type="number"
                              value={it.quantity}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => updateQuantity(it.productId, parseInt(e.target.value) || 0)}
                              className="w-10 px-1 py-0.5 border border-gray-300 rounded text-center text-xs"
                              min={1}
                              max={it.stock}
                            />
                          </td>
                          <td className="px-2 py-1.5 text-right font-mono">{it.price.toFixed(2)}</td>
                          <td className="px-2 py-1.5 text-right font-mono font-semibold">{it.totalPrice.toFixed(2)}</td>
                          <td className="px-1 py-1.5 text-center">
                            <button
                              onClick={(e) => { e.stopPropagation(); removeItem(it.productId); }}
                              className="text-red-500 hover:bg-red-100 w-5 h-5 rounded text-xs"
                            >×</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </aside>

        {/* RIGHT PANEL */}
        <section className="flex-1 flex flex-col overflow-hidden bg-gray-50">

          {/* Status bar */}
          <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between text-xs">
            <div className="flex gap-5 text-gray-600">
              <span>⌨️ <b>F2</b> ค้นหาสมาชิก</span>
              <span><b>F4</b> พักบิล</span>
              <span><b>F5</b> บิลค้าง</span>
              <span><b>F8</b> ลบ</span>
              <span><b>F9</b> ลิ้นชัก</span>
              <span><b>F11</b> แก้ไขลูกค้า</span>
              <span><b>F12</b> ชำระเงิน</span>
            </div>
          </div>

          {/* 5-column Amount Display - black bg */}
          <div className="bg-black text-white grid grid-cols-5 divide-x divide-gray-700">
            <AmountCell label="รายการ" value={String(items.length)} color="text-cyan-300" />
            <AmountCell label="จำนวนชิ้น" value={String(itemCount)} color="text-blue-300" />
            <AmountCell label="รวม (฿)" value={total.toFixed(2)} color="text-white" />
            <AmountCell label="ส่วนลด (฿)" value={discount.toFixed(2)} color="text-orange-300" editable onChange={(v) => setDiscount(v)} />
            <AmountCell label="ยอดสุทธิ (฿)" value={final.toFixed(2)} color="text-green-300" large />
          </div>

          {/* Barcode search */}
          <div className="px-4 py-2.5 bg-white border-b border-gray-200 flex gap-2 items-center">
            <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">🔍 Barcode / ชื่อสินค้า:</span>
            <input
              ref={searchRef}
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="สแกนบาร์โค้ด หรือพิมพ์ค้นหา... (Enter = เพิ่ม)"
              className="flex-1 px-3 py-2 border-2 border-blue-500 rounded text-sm font-mono focus:outline-none focus:border-blue-700"
            />
          </div>

          {/* Product table - green header */}
          <div className="flex-1 overflow-auto bg-white">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-green-600 text-white shadow">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold w-24">บาร์โค้ด</th>
                  <th className="px-3 py-2 text-left font-semibold">ชื่อสินค้า</th>
                  <th className="px-3 py-2 text-left font-semibold w-32">ชื่อสามัญ</th>
                  <th className="px-3 py-2 text-center font-semibold w-20">คงเหลือ</th>
                  <th className="px-3 py-2 text-right font-semibold w-24">ราคาขาย</th>
                  <th className="px-3 py-2 text-center font-semibold w-20">เพิ่ม</th>
                </tr>
              </thead>
              <tbody>
                {loadingSearch ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">กำลังค้นหา...</td></tr>
                ) : products.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    {searchQuery ? 'ไม่พบสินค้า' : 'สแกนบาร์โค้ด หรือพิมพ์ชื่อสินค้าเพื่อค้นหา'}
                  </td></tr>
                ) : products.map((p) => {
                  const outOfStock = Number(p.stock) <= 0;
                  return (
                    <tr
                      key={p.id}
                      onDoubleClick={() => !outOfStock && handleAddProduct(p)}
                      className={`border-b border-gray-100 ${outOfStock ? 'opacity-50 bg-red-50' : 'hover:bg-blue-50 cursor-pointer'}`}
                    >
                      <td className="px-3 py-2 font-mono text-xs">{p.barcode || '—'}</td>
                      <td className="px-3 py-2 font-medium">
                        {p.name}
                        {String(p.requirePrescription) === 'true' && <span className="ml-2 px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[10px] rounded">ใบสั่งยา</span>}
                      </td>
                      <td className="px-3 py-2 text-gray-500 text-xs">{p.genericName}</td>
                      <td className={`px-3 py-2 text-center font-mono ${Number(p.stock) <= Number(p.minStock) ? 'text-red-600 font-bold' : ''}`}>
                        {p.stock} {p.unit}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-blue-700">{Number(p.price).toFixed(2)}</td>
                      <td className="px-3 py-2 text-center">
                        <button
                          disabled={outOfStock}
                          onClick={() => handleAddProduct(p)}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-xs font-bold rounded"
                        >+ เพิ่ม</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Payment button — shown only when items ≥ 1 */}
          {items.length > 0 && (
            <div className="p-3 bg-white border-t-2 border-gray-300">
              <button
                onClick={handleOpenPay}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg text-xl font-bold shadow-lg flex items-center justify-center gap-3"
              >
                <span>ชำระเงิน</span>
                <span className="text-3xl">{formatCurrency(final)}</span>
                <span>▶</span>
              </button>
            </div>
          )}

        </section>
      </div>

      {/* MODALS */}
      <MemberSearchModal
        open={modalMember}
        onClose={() => setModalMember(false)}
        onSelect={(m) => setMember(m)}
      />
      <EditMemberModal
        open={modalEdit}
        member={member}
        onClose={() => setModalEdit(false)}
        onSaved={(m) => setMember(m)}
      />
      <ParkedBillsModal
        open={modalParked}
        onClose={() => setModalParked(false)}
        onRecall={handleRecall}
      />
      <PaymentModal
        open={modalPay}
        finalAmount={final}
        memberName={member?.name}
        onClose={() => setModalPay(false)}
        onConfirm={handleConfirmPay}
        isSubmitting={submitting}
      />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-6 z-[100] px-5 py-3 rounded-lg shadow-lg text-white font-semibold text-sm animate-pulse ${
          toast.type === 'err' ? 'bg-red-600' : 'bg-green-600'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function ReadonlyField({ label, value, multiline, danger }: { label: string; value: string; multiline?: boolean; danger?: boolean }) {
  return (
    <div className="flex gap-2">
      <div className="w-16 text-[10px] font-semibold text-gray-500 shrink-0 pt-0.5">{label}</div>
      <div className={`flex-1 px-2 py-1 bg-gray-100 border border-gray-200 rounded text-xs ${multiline ? 'min-h-[1.5em]' : 'truncate'} ${danger && value ? 'text-red-700 font-semibold bg-red-50 border-red-200' : 'text-gray-800'}`}>
        {value || <span className="text-gray-400">—</span>}
      </div>
    </div>
  );
}

function ActionBtn({ label, color, onClick, disabled, badge }: { label: string; color: string; onClick: () => void; disabled?: boolean; badge?: boolean }) {
  const cls: Record<string, string> = {
    blue: 'bg-blue-600 hover:bg-blue-700 text-white',
    teal: 'bg-teal-600 hover:bg-teal-700 text-white',
    yellow: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    purple: 'bg-purple-600 hover:bg-purple-700 text-white',
    red: 'bg-red-500 hover:bg-red-600 text-white',
    gray: 'bg-gray-600 hover:bg-gray-700 text-white',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative py-2 px-2 rounded text-[11px] font-bold transition-colors disabled:bg-gray-300 disabled:text-gray-500 ${cls[color]}`}
    >
      {label}
      {badge && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />}
    </button>
  );
}

function AmountCell({ label, value, color, editable, onChange, large }: { label: string; value: string; color: string; editable?: boolean; onChange?: (v: number) => void; large?: boolean }) {
  return (
    <div className="p-2.5 text-center">
      <div className="text-[10px] uppercase tracking-wider opacity-60">{label}</div>
      {editable ? (
        <input
          type="number"
          value={value === '0.00' ? '' : value}
          placeholder="0.00"
          onChange={(e) => onChange?.(parseFloat(e.target.value) || 0)}
          className={`w-full bg-transparent text-center font-mono font-bold ${large ? 'text-3xl' : 'text-2xl'} ${color} focus:outline-none mt-0.5`}
          min={0}
        />
      ) : (
        <div className={`font-mono font-bold ${large ? 'text-3xl' : 'text-2xl'} ${color} mt-0.5`}>{value}</div>
      )}
    </div>
  );
}
