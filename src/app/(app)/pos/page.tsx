'use client';
import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Search, Trash2, Plus, Minus, ShoppingCart, User, X, CreditCard, Banknote, Smartphone, ChevronRight, Receipt, AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { useCartStore } from '@/store/cart';
import { formatCurrency } from '@/lib/utils';
import { Product, Member } from '@/types';

export default function POSPage() {
  const qc = useQueryClient();
  const [productSearch, setProductSearch] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [cashInput, setCashInput] = useState('');
  const [payMethod, setPayMethod] = useState<'cash' | 'transfer' | 'credit'>('cash');
  const [receiptData, setReceiptData] = useState<{ invoiceNo: string; finalAmount: number; change: number; memberName: string } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const { items, member, discount, addItem, removeItem, updateQuantity, updateItemDiscount, setMember, setDiscount, setNotes, notes, clearCart, subtotal, finalAmount } = useCartStore();

  const { data: products = [], isLoading: loadingProducts } = useQuery<Product[]>({
    queryKey: ['products', productSearch],
    queryFn: () => fetch(`/api/products?search=${encodeURIComponent(productSearch)}`).then((r) => r.json()),
    enabled: productSearch.length > 0,
  });

  const { data: members = [] } = useQuery<Member[]>({
    queryKey: ['members', memberSearch],
    queryFn: () => fetch(`/api/members?search=${encodeURIComponent(memberSearch)}`).then((r) => r.json()),
    enabled: memberSearch.length > 0,
  });

  const createSale = useMutation({
    mutationFn: (data: object) => fetch('/api/sales', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast.error(data.error); return; }
      setReceiptData({ invoiceNo: data.invoiceNo, finalAmount: data.finalAmount, change: data.change, memberName: data.memberName });
      clearCart();
      setCashInput('');
      setShowPayModal(false);
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['reports-summary'] });
      toast.success(`ขายสำเร็จ บิล ${data.invoiceNo}`);
    },
    onError: () => toast.error('เกิดข้อผิดพลาด'),
  });

  const handleAddProduct = useCallback((p: Product) => {
    if (p.stock <= 0) { toast.warning('สินค้าหมดสต็อก'); return; }
    if (p.requirePrescription) toast.warning('สินค้านี้ต้องใช้ใบสั่งยา');
    addItem({ productId: p.id, productName: p.name, barcode: p.barcode, price: p.price, quantity: 1, discount: 0, totalPrice: p.price, stock: p.stock, requirePrescription: p.requirePrescription });
    setProductSearch('');
    searchRef.current?.focus();
  }, [addItem]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && products.length === 1) handleAddProduct(products[0]);
  };

  const handleCheckout = () => {
    if (items.length === 0) { toast.warning('กรุณาเพิ่มสินค้า'); return; }
    setShowPayModal(true);
  };

  const handleConfirmPay = () => {
    const cash = payMethod === 'cash' ? parseFloat(cashInput) || 0 : finalAmount();
    if (payMethod === 'cash' && cash < finalAmount()) { toast.error('รับเงินไม่พอ'); return; }
    createSale.mutate({
      items,
      memberId: member?.id || '',
      discount,
      paymentMethod: payMethod,
      cashReceived: cash,
      notes,
      pointsUsed: 0,
    });
  };

  const cashRecv = parseFloat(cashInput) || 0;
  const change = Math.max(0, cashRecv - finalAmount());
  const quickAmounts = [20, 50, 100, 500, 1000].filter((a) => a >= finalAmount());

  return (
    <div className="flex h-screen">
      {/* LEFT: Product Search */}
      <div className="flex-1 flex flex-col bg-gray-50 border-r border-gray-200">
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              ref={searchRef}
              autoFocus
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="pl-9 h-11 text-base"
              placeholder="ค้นหาชื่อยา, บาร์โค้ด... (กด Enter เพื่อเพิ่ม)"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {productSearch.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Search size={48} strokeWidth={1} />
              <p className="mt-3 text-sm">ค้นหาสินค้าด้านบน</p>
            </div>
          ) : loadingProducts ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />)}
            </div>
          ) : products.length === 0 ? (
            <p className="text-center text-gray-400 mt-8 text-sm">ไม่พบสินค้า</p>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {products.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleAddProduct(p)}
                  disabled={p.stock <= 0}
                  className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                      {p.requirePrescription && <Badge variant="warning" className="text-xs shrink-0">ต้องใบสั่งยา</Badge>}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{p.genericName} · {p.barcode}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-blue-600">{formatCurrency(p.price)}</p>
                    <p className={`text-xs ${p.stock <= p.minStock ? 'text-red-500' : 'text-gray-400'}`}>
                      {p.stock <= 0 ? 'หมด' : `เหลือ ${p.stock} ${p.unit}`}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Cart */}
      <div className="w-96 flex flex-col bg-white">
        {/* Member Bar */}
        <div className="p-3 border-b border-gray-100 bg-gray-50">
          {member ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-blue-600 shrink-0" />
                  <p className="text-sm font-medium truncate">{member.name}</p>
                  <Badge variant="default" className="text-xs shrink-0">{member.points} แต้ม</Badge>
                </div>
                <p className="text-xs text-gray-500 ml-5">{member.phone} · #{member.code}</p>
              </div>
              <button onClick={() => setMember(null)} className="p-1 hover:bg-gray-200 rounded text-gray-400">
                <X size={14} />
              </button>
            </div>
          ) : (
            <button onClick={() => setShowMemberModal(true)} className="w-full flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors">
              <User size={14} />
              <span>+ เพิ่มสมาชิก</span>
            </button>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-300">
              <ShoppingCart size={40} strokeWidth={1} />
              <p className="mt-2 text-sm">ยังไม่มีสินค้า</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {items.map((item) => (
                <div key={item.productId} className="p-3">
                  <div className="flex items-start gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 leading-tight">{item.productName}</p>
                      <p className="text-xs text-gray-500">{formatCurrency(item.price)} / ชิ้น</p>
                    </div>
                    <button onClick={() => removeItem(item.productId)} className="p-1 hover:bg-red-50 rounded text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center rounded border border-gray-300 hover:bg-gray-100 transition-colors">
                        <Minus size={12} />
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 0)}
                        className="w-12 text-center text-sm border border-gray-300 rounded h-7 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        min={1}
                        max={item.stock}
                      />
                      <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} disabled={item.quantity >= item.stock} className="w-7 h-7 flex items-center justify-center rounded border border-gray-300 hover:bg-gray-100 transition-colors disabled:opacity-40">
                        <Plus size={12} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">ส่วนลด</span>
                        <input
                          type="number"
                          value={item.discount}
                          onChange={(e) => updateItemDiscount(item.productId, parseFloat(e.target.value) || 0)}
                          className="w-14 text-center text-xs border border-gray-300 rounded h-6 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          min={0}
                          max={100}
                          placeholder="%"
                        />
                        <span className="text-xs text-gray-400">%</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 w-20 text-right">{formatCurrency(item.totalPrice)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="border-t border-gray-200 p-4 space-y-3">
          <div className="flex justify-between text-sm text-gray-600">
            <span>ยอดรวม</span>
            <span className="font-medium">{formatCurrency(subtotal())}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-gray-600">ส่วนลดรวม (฿)</span>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={discount || ''}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-24 h-7 text-right text-sm"
                placeholder="0"
                min={0}
              />
            </div>
          </div>
          <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-3">
            <span>ยอดสุทธิ</span>
            <span className="text-blue-600">{formatCurrency(finalAmount())}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={clearCart} disabled={items.length === 0}>
              <Trash2 size={15} className="mr-1.5" /> ล้าง
            </Button>
            <Button size="default" onClick={handleCheckout} disabled={items.length === 0} className="bg-green-600 hover:bg-green-700">
              <CreditCard size={15} className="mr-1.5" /> ชำระเงิน
            </Button>
          </div>
        </div>
      </div>

      {/* Member Search Modal */}
      <Modal open={showMemberModal} onClose={() => setShowMemberModal(false)} title="เลือกสมาชิก" size="md">
        <div className="p-4 space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              autoFocus
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="pl-9"
              placeholder="ค้นหาชื่อ, เบอร์โทร, รหัสสมาชิก..."
            />
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {memberSearch.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-4">กรอกข้อมูลเพื่อค้นหา</p>
            ) : members.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-4">ไม่พบสมาชิก</p>
            ) : (
              members.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setMember(m); setShowMemberModal(false); setMemberSearch(''); }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-sm shrink-0">
                    {m.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{m.name}</p>
                    <p className="text-xs text-gray-500">{m.phone} · #{m.code}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant="default">{m.points} แต้ม</Badge>
                    <p className="text-xs text-gray-400 mt-0.5">ยอดซื้อ {formatCurrency(m.totalSpent)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* Payment Modal */}
      <Modal open={showPayModal} onClose={() => setShowPayModal(false)} title="ชำระเงิน" size="sm">
        <div className="p-5 space-y-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500">ยอดที่ต้องชำระ</p>
            <p className="text-3xl font-bold text-blue-700 mt-1">{formatCurrency(finalAmount())}</p>
            {member && <p className="text-xs text-gray-500 mt-1">สมาชิก: {member.name}</p>}
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">วิธีชำระเงิน</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'cash', label: 'เงินสด', icon: <Banknote size={18} /> },
                { value: 'transfer', label: 'โอนเงิน', icon: <Smartphone size={18} /> },
                { value: 'credit', label: 'บัตรเครดิต', icon: <CreditCard size={18} /> },
              ].map((m) => (
                <button
                  key={m.value}
                  onClick={() => setPayMethod(m.value as typeof payMethod)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${payMethod === m.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  {m.icon}
                  <span className="text-xs font-medium">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {payMethod === 'cash' && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">รับเงิน</p>
              <Input
                type="number"
                autoFocus
                value={cashInput}
                onChange={(e) => setCashInput(e.target.value)}
                className="text-right text-xl h-12 font-bold"
                placeholder="0.00"
              />
              <div className="flex flex-wrap gap-2">
                {quickAmounts.map((a) => (
                  <button key={a} onClick={() => setCashInput(String(a))} className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors">
                    {a}
                  </button>
                ))}
              </div>
              {cashInput && cashRecv >= finalAmount() && (
                <div className="bg-green-50 rounded-lg p-3 flex justify-between items-center">
                  <span className="text-sm text-gray-600">เงินทอน</span>
                  <span className="text-xl font-bold text-green-600">{formatCurrency(change)}</span>
                </div>
              )}
            </div>
          )}

          <Button
            className="w-full"
            size="lg"
            onClick={handleConfirmPay}
            disabled={createSale.isPending || (payMethod === 'cash' && cashRecv < finalAmount())}
          >
            {createSale.isPending ? 'กำลังบันทึก...' : 'ยืนยันการชำระเงิน'}
          </Button>
        </div>
      </Modal>

      {/* Receipt Modal */}
      {receiptData && (
        <Modal open={!!receiptData} onClose={() => setReceiptData(null)} title="บิลเสร็จสิ้น" size="sm">
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Receipt size={28} className="text-green-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">ขายสำเร็จ!</p>
              <p className="text-sm text-gray-500 mt-1">เลขบิล: {receiptData.invoiceNo}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">ยอดสุทธิ</span>
                <span className="font-bold">{formatCurrency(receiptData.finalAmount)}</span>
              </div>
              {receiptData.change > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">เงินทอน</span>
                  <span className="font-bold text-green-600">{formatCurrency(receiptData.change)}</span>
                </div>
              )}
              {receiptData.memberName && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">สมาชิก</span>
                  <span>{receiptData.memberName}</span>
                </div>
              )}
            </div>
            <Button className="w-full" onClick={() => { setReceiptData(null); searchRef.current?.focus(); }}>
              ขายต่อ
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
