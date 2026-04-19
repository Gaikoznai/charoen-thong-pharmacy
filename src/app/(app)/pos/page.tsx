'use client';

const COLORS = {
  headerBg: '#1d3a8a',
  headerTitle: '#e85a5a',
  billBadge: '#0f1e5a',
  billText: '#fff',
  panelBg: '#ffffff',
  panelBorder: '#c8d0dc',
  fieldBg: '#e8e8e8',
  cream: '#fffae8',
  creamBorder: '#d8c878',
  yellow: '#f0d050',
  yellowBorder: '#c0a020',
  redBtn: '#f08080',
  navy: '#1a2080',
  navyDark: '#0a1050',
  navyText: '#aaccff',
  greenHeader: '#2a7a2a',
  orange: '#e07020',
  cyan: '#44ddff',
  sectionTitle: '#444',
  underline: '#5588cc',
};

const labelStyle: React.CSSProperties = {
  fontSize: '11px', color: '#555', flexShrink: 0,
};
const inputStyle: React.CSSProperties = {
  flex: 1, padding: '3px 8px', border: '1px solid #c0c8d0', borderRadius: '3px',
  fontSize: '11px', background: COLORS.fieldBg, color: '#333', minHeight: '22px',
};

const sectionHeader = (title: string): React.CSSProperties => ({
  fontSize: '12px', fontWeight: 700, color: COLORS.sectionTitle,
  padding: '4px 0 2px', borderBottom: `2px solid ${COLORS.underline}`,
  marginBottom: '6px',
});

const FieldRow = ({ label, value, taller }: { label: string; value?: string; taller?: boolean }) => (
  <div style={{ display: 'flex', gap: '6px', marginBottom: '4px', alignItems: 'flex-start' }}>
    <label style={{ ...labelStyle, width: '64px', paddingTop: '4px' }}>{label}</label>
    <div style={{ ...inputStyle, minHeight: taller ? '40px' : '22px', whiteSpace: 'pre-wrap' }}>{value || ''}</div>
  </div>
);

export default function POSPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', background: '#fff' }}>

      {/* POS HEADER BAR */}
      <div style={{
        background: COLORS.headerBg, color: '#fff',
        display: 'flex', alignItems: 'center', height: '40px',
        padding: '0 12px', flexShrink: 0, gap: '10px',
      }}>
        <div style={{
          background: COLORS.billBadge, color: COLORS.billText,
          fontWeight: 700, fontSize: '13px', padding: '5px 12px', borderRadius: '3px',
          fontFamily: 'monospace', letterSpacing: '1px',
        }}>
          ORR-26-04-0001
        </div>

        <div style={{ flex: 1, textAlign: 'center', fontSize: '20px', fontWeight: 700, letterSpacing: '4px', color: COLORS.headerTitle }}>
          ขายปลีก
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px' }}>
          <span>ผู้ใช้งาน: admin</span>
          <span style={{ color: '#aac', fontSize: '10px' }}>[เครื่องขาย]</span>
          <span style={{ display: 'flex', gap: '3px' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#e04040', display: 'inline-block' }} />
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#e0a020', display: 'inline-block' }} />
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#40c040', display: 'inline-block' }} />
          </span>
          <button style={{
            background: COLORS.orange, color: '#fff', border: 'none', borderRadius: '3px',
            padding: '5px 14px', fontWeight: 700, fontSize: '12px', cursor: 'pointer',
          }}>
            เก็บเงิน &amp;จ่ายสด
          </button>
        </div>
      </div>

      {/* TWO-PANEL BODY */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* LEFT PANEL */}
        <div style={{
          width: '340px', flexShrink: 0,
          background: '#fff', borderRight: `1px solid ${COLORS.panelBorder}`,
          display: 'flex', flexDirection: 'column', overflow: 'auto', padding: '8px',
        }}>

          {/* ลูกค้า */}
          <div style={{ marginBottom: '10px' }}>
            <div style={sectionHeader('ลูกค้า')}>ลูกค้า</div>

            <div style={{ display: 'flex', gap: '6px', marginBottom: '4px', alignItems: 'center' }}>
              <label style={{ ...labelStyle, width: '64px' }}>เบอร์โทร</label>
              <div style={{ ...inputStyle, flex: 1 }}></div>
              <button style={{
                background: COLORS.redBtn, color: '#fff', border: 'none', borderRadius: '3px',
                padding: '3px 10px', fontSize: '11px', fontWeight: 700, cursor: 'pointer',
              }}>ลบ</button>
              <button style={{
                background: COLORS.yellow, color: '#333', border: `1px solid ${COLORS.yellowBorder}`,
                borderRadius: '3px', padding: '3px 8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer',
              }}>F2:ค้นหา</button>
            </div>

            <FieldRow label="ชื่อ-สกุล" />
            <FieldRow label="ที่อยู่" taller />
            <FieldRow label="โรคประจำตัว" />
            <FieldRow label="แพ้ยา" />
            <FieldRow label="หมายเหตุ" />

            <button style={{
              width: '100%', marginTop: '4px', padding: '5px',
              background: '#f0f0f0', border: '1px solid #c8c8c8',
              borderRadius: '3px', fontSize: '11px', cursor: 'pointer', color: '#444',
            }}>
              แก้ไขรายละเอียดลูกค้า
            </button>
          </div>

          {/* 4 action buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '4px', marginBottom: '8px' }}>
            {[
              { label: 'F4\nพักบิล' },
              { label: 'F8\nเริ่มขายใหม่' },
              { label: 'F11\nส่วนลด' },
              { label: 'โปรโมชั่น' },
            ].map((b) => (
              <button key={b.label} style={{
                background: COLORS.cream, border: `1px solid ${COLORS.creamBorder}`,
                borderRadius: '3px', padding: '8px 4px', fontSize: '11px', fontWeight: 700,
                cursor: 'pointer', color: '#553300', whiteSpace: 'pre-wrap',
                textAlign: 'center', lineHeight: '1.3', minHeight: '46px',
              }}>{b.label}</button>
            ))}
          </div>

          {/* F5 + ลิ้นชัก */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px' }}>
            <button style={{
              position: 'relative',
              background: COLORS.cream, border: `1px solid ${COLORS.creamBorder}`,
              borderRadius: '3px', padding: '8px 4px', fontSize: '11px', fontWeight: 700,
              cursor: 'pointer', color: '#553300', textAlign: 'center', lineHeight: '1.3',
            }}>
              F5 รายการ<br />เตรียมรายการ
              <span style={{
                position: 'absolute', top: '-6px', right: '-6px',
                background: COLORS.orange, color: '#fff', borderRadius: '50%',
                width: '20px', height: '20px', fontSize: '11px', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>1</span>
            </button>
            <button style={{
              background: '#f0f0f0', border: '1px solid #c8c8c8',
              borderRadius: '3px', padding: '8px 4px', fontSize: '11px', fontWeight: 700,
              cursor: 'pointer', color: '#444', textAlign: 'center', lineHeight: '1.3',
            }}>
              เปิดลิ้นชัก<br />เก็บเงิน
            </button>
          </div>

          {/* รายละเอียดการขาย */}
          <div>
            <div style={sectionHeader('รายละเอียดการขาย')}>รายละเอียดการขาย</div>

            <FieldRow label="เลขที่" value="ORR-26-04-0001" />
            <FieldRow label="วันที่ขาย" value="19/4/2569" />
            <FieldRow label="ระดับราคาขาย" value="ราคาปกติ" />
            <FieldRow label="พนักงานขาย" value="admin" />
            <FieldRow label="เครื่องขาย" value="POS-01" />

            <div style={{ display: 'flex', gap: '6px', marginTop: '4px', alignItems: 'flex-start' }}>
              <button style={{
                padding: '4px 8px', background: '#e0e8f0', border: '1px solid #b0c0d0',
                borderRadius: '3px', fontSize: '11px', cursor: 'pointer', color: '#1a3a6a',
                flexShrink: 0, fontWeight: 600,
              }}>บันทึกช่วยจำ</button>
              <div style={{ ...inputStyle, minHeight: '40px', flex: 1 }}></div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fff' }}>

          {/* Status radios */}
          <div style={{
            padding: '8px 12px', borderBottom: `1px solid ${COLORS.panelBorder}`,
            display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', flexShrink: 0,
          }}>
            <span style={{ fontWeight: 700, color: '#444' }}>สถานะการขาย</span>
            {[
              { label: 'เตรียมรายการ', selected: false },
              { label: 'รอชำระเงิน', selected: true },
              { label: 'เสร็จสมบูรณ์', selected: false },
              { label: 'ยกเลิก', selected: false },
            ].map((r) => (
              <label key={r.label} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: r.selected ? '#1a3a8a' : '#666', fontWeight: r.selected ? 700 : 400 }}>
                <input type="radio" name="sale-status" defaultChecked={r.selected} />
                {r.label}
              </label>
            ))}
            <span style={{ fontWeight: 700, color: '#444', marginLeft: '8px' }}>การตรวจเช็ค</span>
            {[
              { label: 'ผ่าน', selected: true },
              { label: 'ไม่ผ่าน', selected: false },
            ].map((r) => (
              <label key={r.label} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: r.selected ? '#1a3a8a' : '#666', fontWeight: r.selected ? 700 : 400 }}>
                <input type="radio" name="check-status" defaultChecked={r.selected} />
                {r.label}
              </label>
            ))}
          </div>

          {/* รายละเอียดยอดเงิน */}
          <div style={{ padding: '8px 12px', flexShrink: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#444', marginBottom: '4px' }}>รายละเอียดยอดเงิน</div>

            {/* 5-col header */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', background: COLORS.navy, color: '#fff' }}>
              {['มูลค่าสินค้า', 'ภาษี 7.00%', 'ค่าบริการ', 'ส่วนลด', 'ชำระแล้ว'].map((h, i) => (
                <div key={h} style={{
                  padding: '5px 4px', textAlign: 'center', fontSize: '12px', fontWeight: 600,
                  borderRight: i < 4 ? '1px solid rgba(255,255,255,0.15)' : 'none',
                }}>{h}</div>
              ))}
            </div>

            {/* Values */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', background: COLORS.navyDark }}>
              {['0.00', '0.00', '0.00', '0.00', '0.00'].map((v, i) => (
                <div key={i} style={{
                  padding: '5px 4px', textAlign: 'center', color: COLORS.navyText,
                  fontSize: '13px', fontFamily: 'monospace',
                  borderRight: i < 4 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                }}>{v}</div>
              ))}
            </div>

            {/* Total row */}
            <div style={{ display: 'flex', alignItems: 'stretch', background: COLORS.navyDark, marginTop: '6px' }}>
              <button style={{
                background: COLORS.redBtn, color: '#fff', border: 'none', padding: '6px 18px',
                fontWeight: 700, fontSize: '13px', cursor: 'pointer', flexShrink: 0,
                borderRadius: '3px 0 0 3px',
              }}>รวมเงิน</button>
              <div style={{
                flex: 1, textAlign: 'right', padding: '6px 16px',
                color: COLORS.cyan, fontSize: '22px', fontWeight: 700, fontFamily: 'monospace',
              }}>0.00</div>
            </div>
          </div>

          {/* Search bar */}
          <div style={{
            padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '11px', flexShrink: 0,
          }}>
            <span style={{ color: '#444' }}>ค้นหาสินค้า Barcode</span>
            <span style={{ color: '#888', cursor: 'help' }}>❓</span>
            <input type="checkbox" />
            <input
              placeholder="สแกนหรือพิมพ์..."
              style={{ flex: 1, padding: '4px 8px', border: '1px solid #b0b8c0', borderRadius: '3px', fontSize: '12px', background: COLORS.fieldBg }}
            />
            <button style={{
              padding: '4px 12px', background: '#5588cc', color: '#fff', border: '1px solid #4477bb',
              borderRadius: '3px', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
            }}>ค้นหา</button>
            <button style={{
              padding: '4px 10px', background: '#eee', border: '1px solid #bbb',
              borderRadius: '3px', fontSize: '11px', cursor: 'pointer',
            }}>ค้นหาละเอียด</button>
            <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer', color: '#444' }}>
              <input type="checkbox" defaultChecked /> แสดงรายละเอียดสินค้า
            </label>
          </div>

          {/* รายการสินค้า */}
          <div style={{ padding: '0 12px 8px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ ...sectionHeader('รายการสินค้า'), marginBottom: 0 }}>รายการสินค้า</div>

            <div style={{ flex: 1, overflow: 'auto', border: `1px solid ${COLORS.panelBorder}`, borderTop: 'none' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: COLORS.greenHeader, color: '#fff' }}>
                    <th style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 600, width: '32px' }}>#</th>
                    <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, width: '80px' }}>รหัส</th>
                    <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600 }}>รายการ</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 600, width: '70px' }}>จำนวน</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, width: '80px' }}>ราคา</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, width: '80px' }}>ส่วนลด</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, width: '90px' }}>รวม</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={7} style={{
                      textAlign: 'center', padding: '32px', color: '#aaa', fontSize: '12px',
                    }}>
                      ไม่มีรายการที่จะแสดง
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
