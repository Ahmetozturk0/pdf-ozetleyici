'use client';

import React, { useState, useEffect, useRef } from 'react';
import { NotebookView } from '@/app/components/NotebookView';
import { signOut } from 'next-auth/react';
import { Plus, ArrowLeft, BookOpen, Trash2, MoreVertical, Upload, Loader2 } from 'lucide-react';

interface Notebook {
  id: string;
  title: string;
  emoji: string;
  created_at: string;
}

export default function Home() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [selectedNotebook, setSelectedNotebook] = useState<Notebook | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchNotebooks = async () => {
    try {
      const res = await fetch('/api/notebooks');
      const data = await res.json();
      if (data.notebooks) setNotebooks(data.notebooks);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchNotebooks(); }, []);

  // Re-fetch when coming back from notebook view
  useEffect(() => {
    if (!selectedNotebook) fetchNotebooks();
  }, [selectedNotebook]);

  const handleNewNotebook = async (file: File) => {
    setIsCreating(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/summarize', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok && data.notebook) {
        setSelectedNotebook(data.notebook);
      }
    } catch (e) { console.error(e); }
    finally { setIsCreating(false); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') handleNewNotebook(file);
    if (e.target) e.target.value = '';
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu not defterini silmek istediğinize emin misiniz?')) return;
    try {
      await fetch(`/api/notebooks?id=${id}`, { method: 'DELETE' });
      setNotebooks(prev => prev.filter(n => n.id !== id));
    } catch (e) { console.error(e); }
    setMenuOpen(null);
  };

  const formatDate = (d: string) =>
    new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d));

  /* ========== NOTEBOOK VIEW ========== */
  if (selectedNotebook) {
    return (
      <div className="dashboard-layout">
        <div className="bg-layer"><div className="bg-aurora-top" /><div className="bg-aurora-bottom" /></div>
        <main className="dashboard-main">
          <header className="dashboard-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button className="back-btn" onClick={() => setSelectedNotebook(null)}>
                <ArrowLeft size={18} />
              </button>
              <div className="header-title">
                <h1>{selectedNotebook.emoji} {selectedNotebook.title}</h1>
              </div>
            </div>
            <button className="signout-btn" onClick={() => signOut({ callbackUrl: '/login' })}>
              Çıkış Yap
            </button>
          </header>
          <div className="nb-view-wrapper">
            <NotebookView
              notebookId={selectedNotebook.id}
              notebookTitle={selectedNotebook.title}
              notebookEmoji={selectedNotebook.emoji}
            />
          </div>
        </main>
      </div>
    );
  }

  /* ========== HOMEPAGE: NOTEBOOK GRID ========== */
  return (
    <div className="dashboard-layout">
      <div className="bg-layer"><div className="bg-aurora-top" /><div className="bg-aurora-bottom" /></div>

      <main className="home-main">
        {/* Header */}
        <header className="home-header">
          <div className="home-logo">
            <BookOpen size={22} />
            <span>NotebookLM</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              className="home-new-btn"
              onClick={() => fileRef.current?.click()}
              disabled={isCreating}
            >
              {isCreating
                ? <><Loader2 size={16} className="animate-spin" /> Oluşturuluyor...</>
                : <><Plus size={16} /> Yeni oluştur</>
              }
            </button>
            <button className="signout-btn" onClick={() => signOut({ callbackUrl: '/login' })}>
              Çıkış Yap
            </button>
          </div>
        </header>

        <input ref={fileRef} type="file" accept=".pdf" onChange={handleFileSelect} className="hidden-input" />

        {/* Section title */}
        <div className="home-content">
          <h2 className="home-section-title">Not defterlerim</h2>

          {isLoading ? (
            <div className="home-loading">Yükleniyor...</div>
          ) : (
            <div className="notebook-grid">
              {/* Create new card */}
              <div
                className="notebook-card notebook-card-new"
                onClick={() => fileRef.current?.click()}
              >
                <div className="nb-card-new-icon">
                  <Plus size={28} />
                </div>
                <span className="nb-card-new-text">Yeni not defteri oluştur</span>
              </div>

              {/* Existing notebooks */}
              {notebooks.map(nb => (
                <div
                  key={nb.id}
                  className="notebook-card"
                  onClick={() => setSelectedNotebook(nb)}
                >
                  <div className="nb-card-top">
                    <span className="nb-card-emoji">{nb.emoji}</span>
                    <button
                      className="nb-card-menu"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(menuOpen === nb.id ? null : nb.id);
                      }}
                    >
                      <MoreVertical size={16} />
                    </button>

                    {menuOpen === nb.id && (
                      <div className="nb-card-dropdown">
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(nb.id); }}>
                          <Trash2 size={14} /> Sil
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="nb-card-title">{nb.title}</div>
                  <div className="nb-card-meta">{formatDate(nb.created_at)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
