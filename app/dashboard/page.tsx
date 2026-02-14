'use client';

import React, { useState } from 'react';
import { FileUpload } from '@/app/components/FileUpload';
import { SummaryDisplay } from '@/app/components/SummaryDisplay';
import { Loader2, Sparkles, FileText } from 'lucide-react';
import { handleSignOut } from '@/app/lib/actions';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (f: File) => {
    setFile(f);
    setError(null);
    setSummary(null);
  };

  const handleClearFile = () => {
    setFile(null);
    setSummary(null);
    setError(null);
  };

  const handleSummarize = async () => {
    if (!file) return;
    setIsLoading(true);
    setError(null);
    setSummary(null);

    const fd = new FormData();
    fd.append('file', file);

    try {
      const res = await fetch('/api/summarize', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'İşlem başarısız oldu');
      setSummary(data.summary);
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

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
          <div className="logo-group">
            <div className="logo-icon">
              <FileText />
            </div>
            <div className="logo-text">
              <h1>PDF Özetleyici</h1>
              <p>Akıllı Özet Aracı</p>
            </div>
          </div>
          <div className="auth-header-nav">
            <div className="ai-badge">
              <div className="ai-badge-dot" />
              <span>Gemini AI Destekli</span>
            </div>
            <form action={handleSignOut}>
              <button type="submit" className="signout-btn">
                Çıkış Yap
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="main-content">
        <FileUpload
          onFileSelect={handleFileSelect}
          selectedFile={file}
          onClearFile={handleClearFile}
          isLoading={isLoading}
        />

        {/* CTA */}
        {file && !summary && !isLoading && (
          <div className="cta-wrapper animate-fade-up">
            <button onClick={handleSummarize} className="cta-button">
              <Sparkles />
              Özetle
            </button>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="loading-container animate-fade-in">
            <div className="loading-spinner-wrap">
              <div className="loading-ring" />
              <Loader2 className="loading-spinner" />
            </div>
            <p className="loading-title">Belge analiz ediliyor</p>
            <p className="loading-subtitle">Bu işlem genellikle 5–15 saniye sürer</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="error-box animate-fade-up">
            <p className="error-text">{error}</p>
          </div>
        )}

        {/* Summary */}
        {summary && <SummaryDisplay summary={summary} onRegenerate={handleSummarize} />}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p className="footer-text">PDF Özetleyici — Gemini AI ile akıllı özetleme 🤖</p>
      </footer>
    </div>
  );
}
