import Link from 'next/link';
import { ArrowRight, FileText, Zap, Shield, Sparkles } from 'lucide-react';

export default function LandingPage() {
    return (
        <div className="page-wrapper">
            {/* Background Layers */}
            <div className="bg-layer" />
            <div className="bg-aurora-top" />
            <div className="bg-aurora-bottom" />
            <div className="bg-glow-left" />
            <div className="bg-glow-right" />

            {/* Header */}
            <header className="app-header">
                <div className="header-inner">
                    <div className="logo-group">
                        <div className="logo-icon">
                            <FileText />
                        </div>
                        <div className="logo-text">
                            <h1>PDF ÖZETLEYİCİ</h1>
                            <p>PREMIUM AI</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <Link href="/login" style={{ color: '#e4e4ed', fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}>
                            Giriş Yap
                        </Link>
                        <Link href="/register" className="cta-button" style={{ padding: '8px 20px', fontSize: '13px' }}>
                            Kayıt Ol
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <main className="main-content" style={{ textAlign: 'center', paddingTop: '60px' }}>

                <div className="animate-fade-up" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '99px', background: 'rgba(52, 211, 153, 0.06)', border: '1px solid rgba(52, 211, 153, 0.25)', marginBottom: '32px' }}>
                    <div className="ai-badge-dot" />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#34d399' }}>Gemini 3 Flash Power</span>
                </div>

                <h1 className="animate-fade-up" style={{ fontSize: '48px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: '1.1', marginBottom: '24px', background: 'linear-gradient(135deg, #fff 0%, #94a3b8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Uzun PDF'leri saniyeler <br /> içinde özetleyin.
                </h1>

                <p className="animate-fade-up" style={{ fontSize: '18px', color: '#8b8b9e', maxWidth: '500px', margin: '0 auto 48px', lineHeight: '1.6' }}>
                    Yapay zeka gücüyle belgelerinizdeki karmaşık bilgileri anında analiz edin. Doğrudan tarayıcınızdan.
                </p>

                <div className="animate-fade-up" style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                    <Link href="/register" className="cta-button">
                        Hemen Başla <ArrowRight size={18} />
                    </Link>
                    <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '13px 32px', fontSize: '14px', fontWeight: 600, color: '#e4e4ed', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', textDecoration: 'none', transition: 'all 0.2s ease' }}>
                        Giriş Yap
                    </Link>
                </div>

                {/* Features Grid using Glass Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '80px', textAlign: 'left' }}>
                    <FeatureCard title="Hızlı Analiz" desc="Saniyeler içinde sonuç alın." icon={<Zap size={20} color="#fbbf24" />} />
                    <FeatureCard title="Güvenli" desc="Verileriniz şifrelenir." icon={<Shield size={20} color="#34d399" />} />
                    <FeatureCard title="Yüksek Doğruluk" desc="Gemini 3 Flash modeli." icon={<Sparkles size={20} color="#a78bfa" />} />
                </div>

            </main>

            {/* Footer */}
            <footer className="app-footer">
                <p className="footer-text">© 2026 PDF Özetleyici. Ahmet Öztürk.</p>
            </footer>
        </div>
    );
}

function FeatureCard({ title, desc, icon }: { title: string, desc: string, icon: React.ReactNode }) {
    return (
        <div className="upload-card-wrapper" style={{ padding: '1px', animation: 'none', background: 'rgba(255,255,255,0.08)' }}>
            <div className="upload-card-inner" style={{ padding: '24px', height: '100%', cursor: 'default' }}>
                <div style={{ marginBottom: '16px', background: 'rgba(255,255,255,0.05)', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {icon}
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#f0f0f5', marginBottom: '8px' }}>{title}</h3>
                <p style={{ fontSize: '13px', color: '#8b8b9e', lineHeight: '1.5' }}>{desc}</p>
            </div>
        </div>
    )
}
