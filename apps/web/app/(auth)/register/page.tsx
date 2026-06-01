'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { useAuth } from '../../../lib/auth';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateEmail = (email: string): boolean => {
    // Check for basic email format with a period in domain
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError(null);

    if (!validateEmail(email)) {
      setValidationError('有効なメールアドレスを入力してください');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('パスワードが一致しません');
      return;
    }

    if (password.length < 8) {
      setValidationError('パスワードは8文字以上で入力してください');
      return;
    }

    try {
      await register({ email, password, name });
      router.push('/');
    } catch {
      // Error is handled by auth context
    }
  };

  const displayError = validationError || error;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F1F5F9',
        fontFamily:
          "'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif",
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          padding: '32px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          width: '100%',
          maxWidth: '400px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
            SpecForge
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.875rem', marginTop: '8px' }}>
            新規アカウント登録
          </p>
        </div>

        {displayError && (
          <div
            style={{
              padding: '12px',
              backgroundColor: '#FEE2E2',
              border: '1px solid #FECACA',
              borderRadius: '6px',
              marginBottom: '16px',
              color: '#DC2626',
              fontSize: '0.875rem',
            }}
          >
            {displayError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="name"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '6px',
              }}
            >
              名前
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '0.875rem',
                boxSizing: 'border-box',
                outline: 'none',
              }}
              placeholder="山田 太郎"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '6px',
              }}
            >
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '0.875rem',
                boxSizing: 'border-box',
                outline: 'none',
              }}
              placeholder="email@example.com"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '6px',
              }}
            >
              パスワード
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '0.875rem',
                boxSizing: 'border-box',
                outline: 'none',
              }}
              placeholder="8文字以上"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label
              htmlFor="confirmPassword"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '6px',
              }}
            >
              パスワード（確認）
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '0.875rem',
                boxSizing: 'border-box',
                outline: 'none',
              }}
              placeholder="パスワードを再入力"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: isLoading ? '#93C5FD' : '#3B82F6',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.15s',
            }}
          >
            {isLoading ? '登録中...' : '登録'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <p style={{ color: '#64748B', fontSize: '0.875rem' }}>
            既にアカウントをお持ちの方は{' '}
            <Link
              href="/login"
              style={{ color: '#3B82F6', textDecoration: 'none', fontWeight: 500 }}
            >
              ログイン
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
