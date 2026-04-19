'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

export default function LoginPage() {
  const router = useRouter();
  const { isLoggedIn, login, devSkip } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn) router.replace('/dashboard');
  }, [isLoggedIn, router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setTimeout(() => {
      const ok = login(username.trim(), password);
      if (ok) {
        router.replace('/dashboard');
      } else {
        setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        setLoading(false);
      }
    }, 300);
  };

  const handleDev = () => {
    devSkip();
    router.replace('/dashboard');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(150deg,#d6eaff 0%,#eaf4ff 45%,#f2f8ff 70%,#d0e8ff 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
    }}>
      {/* Side-by-side layout: logo left, form right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '60px' }}>

        {/* Left: Logo */}
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: '72px', lineHeight: 1, marginBottom: '12px' }}>💊</div>
          <h1 style={{
            fontSize: '22px',
            fontWeight: 700,
            color: '#2a5080',
            margin: 0,
            letterSpacing: '1px',
          }}>เจริญทองเภสัช</h1>
          <p style={{ color: '#5588aa', fontSize: '13px', marginTop: '4px' }}>ระบบบริหารร้านยา</p>
        </div>

        {/* Right: Form */}
        <div style={{
          background: '#fff',
          borderRadius: '10px',
          boxShadow: '0 4px 24px rgba(40,100,180,0.13)',
          padding: '32px 36px',
          minWidth: '300px',
        }}>
          <h2 style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#2a5080',
            marginBottom: '20px',
            textAlign: 'center',
          }}>เข้าสู่ระบบ</h2>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#555', marginBottom: '4px' }}>
                ชื่อผู้ใช้
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                autoComplete="username"
                placeholder="admin"
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  border: '1px solid #b8cfe8',
                  borderRadius: '5px',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#555', marginBottom: '4px' }}>
                รหัสผ่าน
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••"
                autoComplete="current-password"
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  border: '1px solid #b8cfe8',
                  borderRadius: '5px',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            {error && (
              <p style={{ color: '#cc2020', fontSize: '12px', textAlign: 'center', marginBottom: '8px' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password}
              style={{
                width: '100%',
                padding: '9px',
                background: loading || !username || !password ? '#a0cce0' : '#2dadd4',
                color: '#fff',
                border: 'none',
                borderRadius: '5px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: loading || !username || !password ? 'not-allowed' : 'pointer',
                marginBottom: '10px',
              }}
            >
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '11px', color: '#888', margin: 0 }}>
            ผู้ใช้ : admin | รหัสผ่าน : 1234
          </p>
        </div>
      </div>

      {/* DEV button — dark, bottom-left */}
      <button
        onClick={handleDev}
        style={{
          position: 'fixed',
          bottom: '12px',
          left: '12px',
          padding: '6px 12px',
          background: '#222',
          color: '#eee',
          border: 'none',
          borderRadius: '5px',
          fontSize: '11px',
          fontWeight: 700,
          cursor: 'pointer',
          zIndex: 50,
        }}
      >
        [DEV] ข้ามเข้าระบบ
      </button>
    </div>
  );
}
