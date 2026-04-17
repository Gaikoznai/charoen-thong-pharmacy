'use client';
import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Settings, Database, RefreshCw, CheckCircle, ExternalLink, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [credentials, setCredentials] = useState('');
  const [setupStatus, setSetupStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    setSpreadsheetId(process.env.NEXT_PUBLIC_SPREADSHEET_ID || '');
  }, []);

  const setupMutation = useMutation({
    mutationFn: () => fetch('/api/setup', { method: 'POST' }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast.error(data.error); setSetupStatus('error'); return; }
      toast.success('สร้าง Sheets สำเร็จ!');
      setSetupStatus('success');
    },
    onError: () => { toast.error('ไม่สามารถเชื่อมต่อ Google Sheets ได้'); setSetupStatus('error'); },
  });

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">ตั้งค่า</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database size={18} className="text-blue-600" />
            การเชื่อมต่อ Google Sheets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800 space-y-1">
            <p className="font-medium">วิธีตั้งค่า Google Sheets:</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-700">
              <li>สร้าง Google Spreadsheet ใหม่</li>
              <li>สร้าง Service Account ใน Google Cloud Console</li>
              <li>ดาวน์โหลด JSON credentials ของ Service Account</li>
              <li>แชร์ Spreadsheet ให้ Service Account email (Editor)</li>
              <li>ใส่ค่าในไฟล์ .env.local ตามตัวอย่างด้านล่าง</li>
            </ol>
          </div>

          <div className="bg-gray-900 rounded-lg p-4 text-sm font-mono text-green-400 space-y-1">
            <p className="text-gray-400"># .env.local</p>
            <p>GOOGLE_SPREADSHEET_ID=<span className="text-yellow-300">your_spreadsheet_id</span></p>
            <p>GOOGLE_SERVICE_ACCOUNT_KEY=<span className="text-yellow-300">{`'{"type":"service_account",...}'`}</span></p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Spreadsheet ID (จาก URL)</label>
            <Input className="mt-1 font-mono" value={spreadsheetId} onChange={(e) => setSpreadsheetId(e.target.value)} placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms" />
            <p className="text-xs text-gray-500 mt-1">
              หา ID จาก URL: docs.google.com/spreadsheets/d/<strong>ID_นี้</strong>/edit
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Service Account JSON (วางทั้ง JSON)</label>
            <textarea
              className="mt-1 w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-xs"
              rows={6}
              value={credentials}
              onChange={(e) => setCredentials(e.target.value)}
              placeholder='{"type": "service_account", "project_id": "...", ...}'
            />
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={() => setupMutation.mutate()} disabled={setupMutation.isPending} className="gap-2">
              {setupMutation.isPending ? <RefreshCw size={15} className="animate-spin" /> : <Database size={15} />}
              {setupMutation.isPending ? 'กำลังสร้าง...' : 'สร้าง / ตรวจสอบ Sheets'}
            </Button>
            {setupStatus === 'success' && (
              <div className="flex items-center gap-1.5 text-green-600 text-sm">
                <CheckCircle size={16} />
                <span>เชื่อมต่อสำเร็จ</span>
              </div>
            )}
            {setupStatus === 'error' && (
              <div className="flex items-center gap-1.5 text-red-500 text-sm">
                <AlertCircle size={16} />
                <span>เชื่อมต่อไม่สำเร็จ</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw size={18} className="text-green-600" />
            การซิงค์ข้อมูล Real-time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
              <p><strong>โปรแกรม → Google Sheets:</strong> ทุกการเพิ่ม/แก้ไข/ลบจากโปรแกรม จะอัพเดท Google Sheets ทันที</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
              <p><strong>Google Sheets → โปรแกรม:</strong> โปรแกรมดึงข้อมูลจาก Google Sheets ทุก 15 วินาที และอัพเดทหน้าจอโดยอัตโนมัติ</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
              <p><strong>แก้ไขใน Sheets:</strong> เมื่อแก้ไขข้อมูลใน Google Sheets โดยตรง โปรแกรมจะรับการเปลี่ยนแปลงภายใน 15 วินาที</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
              <p><strong>ลบจาก Sheets:</strong> การลบแถวใน Google Sheets จะมีผลในโปรแกรมเมื่อรีเฟรชครั้งถัดไป</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>โครงสร้าง Google Sheets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {[
              { name: 'Products', desc: 'ข้อมูลสินค้า/ยาทั้งหมด', cols: 'id, name, genericName, barcode, category, price, cost, stock...' },
              { name: 'Members', desc: 'ข้อมูลสมาชิก', cols: 'id, code, name, phone, email, points, totalSpent...' },
              { name: 'Sales', desc: 'ประวัติการขาย', cols: 'id, invoiceNo, member, total, discount, finalAmount, payment...' },
              { name: 'SaleItems', desc: 'รายการสินค้าในแต่ละบิล', cols: 'id, saleId, productId, name, quantity, price...' },
              { name: 'Categories', desc: 'หมวดหมู่สินค้า', cols: 'id, name, description' },
              { name: 'Suppliers', desc: 'ผู้จัดจำหน่าย', cols: 'id, name, phone, email, address...' },
            ].map((s) => (
              <div key={s.name} className="flex items-start gap-3 p-2.5 rounded-lg bg-gray-50">
                <span className="font-mono font-semibold text-blue-600 w-24 shrink-0">{s.name}</span>
                <div>
                  <p className="font-medium text-gray-700">{s.desc}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.cols}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
