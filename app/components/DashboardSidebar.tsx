'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Plus, Trash2, BookOpen, Loader2 } from 'lucide-react';

interface Notebook {
    id: string;
    title: string;
    emoji: string;
    created_at: string;
}

interface DashboardSidebarProps {
    onSelectNotebook: (notebook: Notebook | null) => void;
    currentNotebookId: string | null;
    onNewNotebookUpload: (file: File) => void;
    isUploading: boolean;
}

export function DashboardSidebar({ onSelectNotebook, currentNotebookId, onNewNotebookUpload, isUploading }: DashboardSidebarProps) {
    const [notebooks, setNotebooks] = useState<Notebook[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchNotebooks = async () => {
        try {
            const res = await fetch('/api/notebooks');
            const data = await res.json();
            if (data.notebooks) setNotebooks(data.notebooks);
        } catch (error) {
            console.error('Failed to fetch notebooks', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotebooks();
    }, [currentNotebookId]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === 'application/pdf') {
            onNewNotebookUpload(file);
        }
        // Reset input so same file can be selected again
        if (e.target) e.target.value = '';
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('Bu not defterini ve tüm içeriğini silmek istediğinize emin misiniz?')) return;
        try {
            const res = await fetch(`/api/notebooks?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setNotebooks(prev => prev.filter(n => n.id !== id));
                if (currentNotebookId === id) onSelectNotebook(null);
            }
        } catch (e) {
            console.error('Delete error:', e);
        }
    };

    const formatDate = (dateString: string) => {
        return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' }).format(new Date(dateString));
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden-input"
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="new-chat-btn"
                    disabled={isUploading}
                >
                    {isUploading ? (
                        <><Loader2 size={20} className="animate-spin" /><span>Oluşturuluyor...</span></>
                    ) : (
                        <><Plus size={20} /><span>Yeni Not Defteri</span></>
                    )}
                </button>
            </div>

            <div className="sidebar-content">
                <div className="sidebar-section-title">Not Defterleri</div>

                {isLoading ? (
                    <div className="sidebar-loading">Yükleniyor...</div>
                ) : notebooks.length === 0 ? (
                    <div className="sidebar-empty">
                        Henüz not defteriniz yok.
                    </div>
                ) : (
                    <div className="document-list">
                        {notebooks.map((nb) => (
                            <div
                                key={nb.id}
                                onClick={() => onSelectNotebook(nb)}
                                className={`document-item ${currentNotebookId === nb.id ? 'active' : ''}`}
                            >
                                <div className="doc-icon">
                                    <span style={{ fontSize: '16px' }}>{nb.emoji}</span>
                                </div>
                                <div className="doc-info">
                                    <div className="doc-title">{nb.title}</div>
                                    <div className="doc-date">{formatDate(nb.created_at)}</div>
                                </div>
                                <button
                                    className="doc-delete-btn"
                                    onClick={(e) => handleDelete(e, nb.id)}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="user-avatar">
                        <BookOpen size={16} />
                    </div>
                    <div className="user-info">
                        <span className="user-plan">NotebookLM</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
