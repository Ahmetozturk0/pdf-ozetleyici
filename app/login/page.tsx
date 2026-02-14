'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { authenticate } from '@/app/lib/actions';
import Link from 'next/link';
import { FileText } from 'lucide-react';

export default function LoginPage() {
    const [errorMessage, dispatch] = useActionState(authenticate, undefined);

    return (
        <div className="page-wrapper">
            {/* Background */}
            <div className="bg-layer">
                <div className="bg-aurora-top" />
                <div className="bg-aurora-bottom" />
                <div className="bg-glow-left" />
                <div className="bg-glow-right" />
            </div>

            {/* Header */}
            <header className="app-header">
                <div className="header-inner">
                    <Link href="/" className="logo-group" style={{ textDecoration: 'none' }}>
                        <div className="logo-icon">
                            <FileText />
                        </div>
                        <div className="logo-text">
                            <h1>PDF ÖZETLEYİCİ</h1>
                            <p>PREMIUM AI</p>
                        </div>
                    </Link>
                    <div className="auth-header-nav">
                        <Link href="/" className="auth-header-link">Ana Sayfa</Link>
                        <Link href="/register" className="auth-header-btn">Kayıt Ol</Link>
                    </div>
                </div>
            </header>

            {/* Main */}
            <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                <div className="auth-card animate-fade-up">
                    <h1 className="auth-title">Giriş Yap</h1>

                    <form action={dispatch} className="auth-form">
                        <div>
                            <label className="auth-label" htmlFor="email">Email</label>
                            <input
                                className="auth-input"
                                id="email"
                                type="email"
                                name="email"
                                placeholder="ornek@email.com"
                                required
                            />
                        </div>
                        <div>
                            <label className="auth-label" htmlFor="password">Şifre</label>
                            <input
                                className="auth-input"
                                id="password"
                                type="password"
                                name="password"
                                placeholder="••••••"
                                required
                                minLength={6}
                            />
                        </div>

                        <div aria-live="polite" aria-atomic="true">
                            {errorMessage && (
                                <p className="auth-error">{errorMessage}</p>
                            )}
                        </div>

                        <LoginButton />

                        <div className="auth-footer">
                            Hesabın yok mu? <Link href="/register" className="auth-link">Kayıt Ol</Link>
                        </div>
                    </form>
                </div>
            </main>

            {/* Footer */}
            <footer className="app-footer">
                <p className="footer-text">© 2026 PDF Özetleyici. Ahmet Öztürk.</p>
            </footer>
        </div>
    );
}

function LoginButton() {
    const { pending } = useFormStatus();

    return (
        <button className="auth-button" aria-disabled={pending}>
            {pending ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
        </button>
    );
}
