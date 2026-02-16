'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    FileText, Plus, Trash2, Send, Check,
    Sparkles, ClipboardList, Save, BookOpen,
    Copy, ThumbsUp, ThumbsDown,
    PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen,
    MessageCircle
} from 'lucide-react';

/* ---------- Types ---------- */
interface Document { id: string; title: string; summary: string; created_at: string; }
interface Note { id: string; content: string; created_at: string; }
interface ChatMessage { role: 'user' | 'assistant'; content: string; }
interface FlashCard { term: string; definition: string; }
interface QuizQuestion { question: string; options: string[]; answer: number; }

interface Props {
    notebookId: string;
    notebookTitle: string;
    notebookEmoji: string;
}

export function NotebookView({ notebookId, notebookTitle, notebookEmoji }: Props) {
    /* ---- Sources ---- */
    const [sources, setSources] = useState<Document[]>([]);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [loadingSrc, setLoadingSrc] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    /* ---- Chat ---- */
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [sending, setSending] = useState(false);
    const [overview, setOverview] = useState('');
    const [loadingOverview, setLoadingOverview] = useState(false);
    const endRef = useRef<HTMLDivElement>(null);

    /* ---- Studio ---- */
    const [studioMode, setStudioMode] = useState<'cards' | 'test' | null>(null);
    const [cards, setCards] = useState<FlashCard[]>([]);
    const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [showAnswers, setShowAnswers] = useState(false);
    const [generating, setGenerating] = useState(false);

    /* ---- Notes ---- */
    const [notes, setNotes] = useState<Note[]>([]);
    const [noteInput, setNoteInput] = useState('');
    const [showNoteForm, setShowNoteForm] = useState(false);

    /* ---- Panel collapse ---- */
    const [leftOpen, setLeftOpen] = useState(true);
    const [rightOpen, setRightOpen] = useState(true);

    /* ======== Data Fetching ======== */
    useEffect(() => {
        fetchSources();
        fetchNotes();
        setMessages([]);
        setOverview('');
        setStudioMode(null);
        setCards([]);
        setQuiz([]);
    }, [notebookId]);

    useEffect(() => {
        if (sources.length > 0 && !overview) generateOverview();
    }, [sources]);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchSources = async () => {
        setLoadingSrc(true);
        try {
            const res = await fetch('/api/documents');
            const data = await res.json();
            const docs = (data.documents || []).filter((d: any) => d.notebook_id === notebookId);
            setSources(docs);
            setSelected(new Set(docs.map((d: any) => d.id)));
        } catch (e) { console.error(e); }
        finally { setLoadingSrc(false); }
    };

    const fetchNotes = async () => {
        try {
            const res = await fetch(`/api/notes?notebookId=${notebookId}`);
            const data = await res.json();
            if (data.notes) setNotes(data.notes);
        } catch (e) { console.error(e); }
    };

    /* ======== Overview ======== */
    const generateOverview = async () => {
        setLoadingOverview(true);
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    notebookId,
                    message: 'Bu not defterindeki tüm kaynakları analiz et ve kapsamlı bir genel bakış paragrafı yaz. Ana temaları, önemli kavramları ve kaynaklar arasındaki bağlantıları açıkla. Sadece genel bakış metnini döndür.'
                })
            });
            const data = await res.json();
            if (data.reply) setOverview(data.reply);
        } catch (e) { console.error(e); }
        finally { setLoadingOverview(false); }
    };

    /* ======== Helper: build chat request body using selected sources ======== */
    const buildChatBody = (message: string) => {
        const selectedIds = Array.from(selected);
        if (selectedIds.length > 0) {
            return { docIds: selectedIds, message };
        }
        return { notebookId, message };
    };

    /* ======== Source Actions ======== */
    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fd = new FormData();
                fd.append('file', file);
                fd.append('notebookId', notebookId);

                try {
                    await fetch('/api/summarize', { method: 'POST', body: fd });
                } catch (err) {
                    console.error(`Error uploading ${file.name}:`, err);
                }
            }
            fetchSources();
            setOverview('');
        } catch (e) { console.error(e); }
        finally { setUploading(false); if (e.target) e.target.value = ''; }
    };

    const deleteSource = async (id: string) => {
        try {
            const res = await fetch(`/api/documents?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setSources(p => p.filter(s => s.id !== id));
                setSelected(p => { const n = new Set(p); n.delete(id); return n; });
            }
        } catch (e) { console.error(e); }
    };

    const toggle = (id: string) => {
        setSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
    };

    const toggleAll = () => {
        setSelected(selected.size === sources.length ? new Set() : new Set(sources.map(s => s.id)));
    };

    /* ======== Chat ======== */
    const handleSend = async (text?: string) => {
        const msg = text || chatInput.trim();
        if (!msg) return;
        setChatInput('');
        setMessages(p => [...p, { role: 'user', content: msg }]);
        setSending(true);
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(buildChatBody(msg))
            });
            const data = await res.json();
            if (data.reply) setMessages(p => [...p, { role: 'assistant', content: data.reply }]);
        } catch (e) { console.error(e); }
        finally { setSending(false); }
    };

    /* ======== Notes ======== */
    const saveNote = async (content: string) => {
        try {
            const res = await fetch('/api/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notebookId, content })
            });
            const data = await res.json();
            if (data.note) setNotes(p => [data.note, ...p]);
        } catch (e) { console.error(e); }
    };

    const addNote = async () => {
        if (!noteInput.trim()) return;
        await saveNote(noteInput);
        setNoteInput('');
        setShowNoteForm(false);
    };

    const deleteNote = async (id: string) => {
        try {
            const res = await fetch(`/api/notes?id=${id}`, { method: 'DELETE' });
            if (res.ok) setNotes(p => p.filter(n => n.id !== id));
        } catch (e) { console.error(e); }
    };

    /* ======== Studio: Bilgi Kartları ======== */
    const genCards = async () => {
        setStudioMode('cards');
        setGenerating(true);
        setCards([]);
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(buildChatBody('Bu kaynaklara dayanarak 6 adet bilgi kartı oluştur. Her kart bir kavram (term) ve kısa tanım (definition) içersin. SADECE JSON array döndür, markdown code block kullanma: [{"term":"Kavram","definition":"Tanım"}]'))
            });
            const data = await res.json();
            if (data.reply) {
                try {
                    const m = data.reply.match(/\[[\s\S]*\]/);
                    if (m) setCards(JSON.parse(m[0]));
                } catch { setCards([{ term: 'Bilgi Kartları', definition: data.reply }]); }
            }
        } catch (e) { console.error(e); }
        finally { setGenerating(false); }
    };

    /* ======== Studio: Test ======== */
    const genTest = async () => {
        setStudioMode('test');
        setGenerating(true);
        setQuiz([]);
        setAnswers({});
        setShowAnswers(false);
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(buildChatBody('Bu kaynaklara dayanarak 5 adet çoktan seçmeli test sorusu oluştur. SADECE JSON array döndür, markdown code block kullanma: [{"question":"Soru?","options":["A şıkkı","B şıkkı","C şıkkı","D şıkkı"],"answer":0}] — answer doğru şıkkın 0-indexed numarasıdır.'))
            });
            const data = await res.json();
            if (data.reply) {
                try {
                    const m = data.reply.match(/\[[\s\S]*\]/);
                    if (m) setQuiz(JSON.parse(m[0]));
                } catch { /* fail silently */ }
            }
        } catch (e) { console.error(e); }
        finally { setGenerating(false); }
    };

    /* ======== Suggested Questions ======== */
    const suggestions = [
        'Kaynakların ana temalarını özetle',
        'En önemli kavramları listele',
        'Kaynaklar arasındaki bağlantıları açıkla'
    ];

    /* ======== Render ======== */
    const layoutClass = `nb-layout ${!leftOpen ? 'left-collapsed' : ''} ${!rightOpen ? 'right-collapsed' : ''}`;

    return (
        <div className={layoutClass}>

            {/* Hidden file input — always in DOM */}
            <input ref={fileRef} type="file" multiple accept=".pdf" onChange={handleUpload} className="hidden-input" />

            {/* ========== LEFT: KAYNAKLAR ========== */}
            {leftOpen ? (
                <div className="nb-panel nb-sources">
                    <div className="nb-panel-header">
                        <span className="nb-panel-title">Kaynaklar</span>
                        <button className="nb-panel-toggle" onClick={() => setLeftOpen(false)} title="Paneli daralt">
                            <PanelLeftClose size={16} />
                        </button>
                    </div>

                    <button
                        className="nb-source-add"
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                    >
                        {uploading ? '⏳ Yükleniyor...' : '+ Kaynak ekle'}
                    </button>

                    {sources.length > 0 && (
                        <label className="nb-select-all" onClick={toggleAll}>
                            <span>Tüm kaynakları seçin</span>
                            <div className={`nb-check-circle ${selected.size === sources.length ? 'checked' : ''}`}>
                                {selected.size === sources.length && <Check size={11} />}
                            </div>
                        </label>
                    )}

                    <div className="nb-source-list">
                        {loadingSrc ? (
                            <div className="nb-empty-text">Yükleniyor...</div>
                        ) : sources.length === 0 ? (
                            <div className="nb-empty-text">Henüz kaynak yok</div>
                        ) : sources.map(s => (
                            <div key={s.id} className={`nb-source-item ${selected.has(s.id) ? 'selected' : ''}`} onClick={() => toggle(s.id)}>
                                <FileText size={14} className="nb-source-icon" />
                                <span className="nb-source-name">{s.title}</span>
                                <div className={`nb-check-circle ${selected.has(s.id) ? 'checked' : ''}`}>
                                    {selected.has(s.id) && <Check size={11} />}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="nb-collapsed-strip nb-collapsed-left">
                    <button className="nb-strip-btn" onClick={() => setLeftOpen(true)} title="Kaynakları göster">
                        <PanelLeftOpen size={18} />
                    </button>
                    <button className="nb-strip-btn" onClick={() => { setLeftOpen(true); fileRef.current?.click(); }} title="Kaynak ekle">
                        <Plus size={18} />
                    </button>
                    {sources.map(s => (
                        <button key={s.id} className={`nb-strip-btn nb-strip-source ${selected.has(s.id) ? 'active' : ''}`} onClick={() => toggle(s.id)} title={s.title}>
                            <FileText size={16} />
                        </button>
                    ))}
                </div>
            )}

            {/* ========== CENTER: SOHBET ========== */}
            <div className="nb-panel nb-chat">
                <div className="nb-panel-header">
                    <span className="nb-panel-title">Sohbet</span>
                </div>

                <div className="nb-chat-scroll">
                    {/* Overview when no messages */}
                    {messages.length === 0 && (
                        <div className="nb-overview-section">
                            <h2 className="nb-overview-title">{notebookTitle}</h2>
                            <span className="nb-overview-count">{sources.length} kaynak</span>

                            {loadingOverview ? (
                                <div className="nb-overview-loading">
                                    <Sparkles size={16} className="animate-pulse" />
                                    <span>Genel bakış oluşturuluyor...</span>
                                </div>
                            ) : overview ? (
                                <div className="nb-overview-text">{overview}</div>
                            ) : sources.length === 0 ? (
                                <div className="nb-overview-text" style={{ color: '#475569' }}>
                                    Kaynak ekleyerek başlayın.
                                </div>
                            ) : null}

                            {overview && (
                                <div className="nb-overview-actions">
                                    <button className="nb-btn-outline" onClick={() => saveNote(overview)}>
                                        <Save size={14} /> Notlara kaydet
                                    </button>
                                    <button className="nb-action-icon" onClick={() => navigator.clipboard.writeText(overview)} title="Kopyala">
                                        <Copy size={14} />
                                    </button>
                                    <button className="nb-action-icon" title="Beğen">
                                        <ThumbsUp size={14} />
                                    </button>
                                    <button className="nb-action-icon" title="Beğenme">
                                        <ThumbsDown size={14} />
                                    </button>
                                </div>
                            )}

                            {sources.length > 0 && (
                                <div className="nb-suggestions">
                                    {suggestions.map((q, i) => (
                                        <button key={i} className="nb-suggestion-btn" onClick={() => handleSend(q)}>
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Chat messages */}
                    {messages.map((m, i) => (
                        <div key={i} className={`nb-message ${m.role}`}>
                            <div className="nb-message-content">
                                {m.content}
                                {m.role === 'assistant' && (
                                    <button className="nb-save-msg" onClick={() => saveNote(m.content)} title="Notlara kaydet">
                                        <Save size={12} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}

                    {sending && (
                        <div className="nb-message assistant">
                            <div className="nb-message-content nb-typing">
                                <span /><span /><span />
                            </div>
                        </div>
                    )}
                    <div ref={endRef} />
                </div>

                {/* Chat input */}
                <div className="nb-chat-input-area">
                    <div className="nb-chat-input-wrap">
                        <textarea
                            className="nb-chat-input"
                            placeholder="Yazmaya başlayın..."
                            value={chatInput}
                            onChange={e => setChatInput(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                            }}
                            rows={1}
                        />
                        <span className="nb-source-badge">{selected.size} kaynak</span>
                        <button className="nb-send-btn" onClick={() => handleSend()} disabled={!chatInput.trim() || sending}>
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ========== RIGHT: STUDIO ========== */}
            {rightOpen ? (
                <div className="nb-panel nb-studio">
                    <div className="nb-panel-header">
                        <span className="nb-panel-title">Studio</span>
                        <button className="nb-panel-toggle" onClick={() => setRightOpen(false)} title="Paneli daralt">
                            <PanelRightClose size={16} />
                        </button>
                    </div>

                    {/* Studio cards grid */}
                    <div className="studio-cards-grid">
                        <button
                            className={`studio-feature-card ${studioMode === 'cards' ? 'active' : ''}`}
                            onClick={genCards}
                            disabled={generating || sources.length === 0}
                        >
                            <Sparkles size={18} />
                            <span>Bilgi kartları</span>
                        </button>
                        <button
                            className={`studio-feature-card ${studioMode === 'test' ? 'active' : ''}`}
                            onClick={genTest}
                            disabled={generating || sources.length === 0}
                        >
                            <ClipboardList size={18} />
                            <span>Test</span>
                        </button>
                    </div>

                    {/* Studio output */}
                    <div className="studio-output">
                        {generating ? (
                            <div className="studio-loading">
                                <Sparkles size={20} className="animate-pulse" />
                                <span>{studioMode === 'cards' ? 'Bilgi kartları oluşturuluyor...' : 'Test oluşturuluyor...'}</span>
                            </div>
                        ) : studioMode === 'cards' && cards.length > 0 ? (
                            <div className="flashcard-list">
                                {cards.map((c, i) => (
                                    <div key={i} className="flashcard">
                                        <div className="flashcard-term">{c.term}</div>
                                        <div className="flashcard-def">{c.definition}</div>
                                    </div>
                                ))}
                            </div>
                        ) : studioMode === 'test' && quiz.length > 0 ? (
                            <div className="quiz-list">
                                {quiz.map((q, i) => (
                                    <div key={i} className="quiz-question">
                                        <div className="quiz-q-text">{i + 1}. {q.question}</div>
                                        <div className="quiz-options">
                                            {q.options.map((o, j) => (
                                                <button
                                                    key={j}
                                                    className={`quiz-option ${answers[i] === j ? 'selected' : ''} ${showAnswers ? (j === q.answer ? 'correct' : answers[i] === j ? 'wrong' : '') : ''}`}
                                                    onClick={() => !showAnswers && setAnswers(p => ({ ...p, [i]: j }))}
                                                >
                                                    {o}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {!showAnswers && (
                                    <button className="nb-btn-primary" onClick={() => setShowAnswers(true)}>
                                        Cevapları Kontrol Et
                                    </button>
                                )}
                                {showAnswers && (
                                    <div className="quiz-result">
                                        ✅ {Object.keys(answers).filter(i => answers[Number(i)] === quiz[Number(i)]?.answer).length} / {quiz.length} doğru
                                    </div>
                                )}
                            </div>
                        ) : !studioMode ? (
                            <div className="studio-placeholder">
                                <Sparkles size={24} style={{ opacity: 0.3 }} />
                                <p>Studio çıktısı buraya kaydedilir.</p>
                                <p className="studio-placeholder-sub">Kaynakları ekledikten sonra bilgi kartları ve test oluşturmak için tıklayın</p>
                            </div>
                        ) : null}
                    </div>

                    {/* Notes */}
                    <div className="studio-notes">
                        {notes.length > 0 && (
                            <div className="studio-notes-list">
                                {notes.map(n => (
                                    <div key={n.id} className="studio-note-item">
                                        <p>{n.content.length > 80 ? n.content.slice(0, 80) + '…' : n.content}</p>
                                        <button className="nb-source-delete" onClick={() => deleteNote(n.id)}>
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {showNoteForm ? (
                            <div className="studio-note-form">
                                <textarea
                                    className="note-textarea"
                                    value={noteInput}
                                    onChange={e => setNoteInput(e.target.value)}
                                    placeholder="Notunuzu yazın..."
                                    autoFocus
                                />
                                <div className="studio-note-actions">
                                    <button className="note-save-btn" onClick={addNote}>Kaydet</button>
                                    <button className="note-cancel-btn" onClick={() => { setShowNoteForm(false); setNoteInput(''); }}>İptal</button>
                                </div>
                            </div>
                        ) : (
                            <button className="nb-note-add-btn" onClick={() => setShowNoteForm(true)}>
                                <Plus size={14} /> Not ekle
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="nb-collapsed-strip nb-collapsed-right">
                    <button className="nb-strip-btn" onClick={() => setRightOpen(true)} title="Studio'yu göster">
                        <PanelRightOpen size={18} />
                    </button>
                    <button className={`nb-strip-btn ${studioMode === 'cards' ? 'active' : ''}`} onClick={() => { setRightOpen(true); genCards(); }} title="Bilgi kartları">
                        <Sparkles size={16} />
                    </button>
                    <button className={`nb-strip-btn ${studioMode === 'test' ? 'active' : ''}`} onClick={() => { setRightOpen(true); genTest(); }} title="Test">
                        <ClipboardList size={16} />
                    </button>
                    <div style={{ flex: 1 }} />
                    <button className="nb-strip-btn" onClick={() => { setRightOpen(true); setShowNoteForm(true); }} title="Not ekle">
                        <MessageCircle size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}
