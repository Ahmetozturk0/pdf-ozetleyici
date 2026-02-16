'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Copy, Check, Sparkles, RotateCcw, MessageSquare, Send, BookOpen, Lightbulb } from 'lucide-react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface SummaryDisplayProps {
    summary: string;
    docId?: string;
    title?: string;
    onRegenerate?: () => void;
}

export function SummaryDisplay({ summary, docId, title, onRegenerate }: SummaryDisplayProps) {
    const [activeTab, setActiveTab] = useState<'summary' | 'chat'>('summary');
    const [copied, setCopied] = useState(false);

    // Chat State
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, activeTab]);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(summary);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSendMessage = async (text: string) => {
        if (!text.trim() || !docId) return;

        const userMessage: Message = { role: 'user', content: text };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsChatLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ docId, message: text })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Mesaj gönderilemedi');

            const aiMessage: Message = { role: 'assistant', content: data.reply };
            setMessages(prev => [...prev, aiMessage]);

        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage: Message = { role: 'assistant', content: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsChatLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(input);
        }
    };

    const suggestions = [
        { label: 'Sıkça Sorulan Sorular', prompt: 'Bu belgeden 5 maddelik bir Sıkça Sorulan Sorular (SSS) listesi oluştur.' },
        { label: 'Özet Tablo', prompt: 'Bu belgedeki önemli verileri içeren bir tablo oluştur.' },
        { label: 'Çalışma Rehberi', prompt: 'Bu belgeye çalışmak isteyen bir öğrenci için anahtar kavramları ve kısa açıklamalarını listele.' },
        { label: 'Kritik Analiz', prompt: 'Bu belgedeki argümanların güçlü ve zayıf yönlerini analiz et.' },
    ];

    const renderContent = (text: string) => {
        return text.split('\n').map((line, i) => {
            const boldLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

            // Bullet points
            if (line.trim().startsWith('- ') || line.trim().startsWith('* ') || line.trim().startsWith('• ')) {
                const content = line.trim().replace(/^[-*•]\s/, '');
                const boldContent = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                return (
                    <div key={i} className="summary-bullet">
                        <span className="summary-bullet-dot" />
                        <span className="summary-bullet-text" dangerouslySetInnerHTML={{ __html: boldContent }} />
                    </div>
                );
            }
            // Headings
            if (line.trim().startsWith('### ')) return <h4 key={i}>{line.replace('### ', '')}</h4>;
            if (line.trim().startsWith('## ')) return <h3 key={i}>{line.replace('## ', '')}</h3>;
            if (line.trim().startsWith('# ')) return <h2 key={i}>{line.replace('# ', '')}</h2>;
            // Empty lines
            if (!line.trim()) return <div key={i} className="spacer" />;
            // Paragraphs
            return <p key={i} dangerouslySetInnerHTML={{ __html: boldLine }} />;
        });
    };

    return (
        <div className="animate-fade-up" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Tabs */}
            <div className="tab-container">
                <button
                    className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
                    onClick={() => setActiveTab('summary')}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <Sparkles size={16} />
                    Özet
                </button>
                <button
                    className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
                    onClick={() => setActiveTab('chat')}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <MessageSquare size={16} />
                    Sohbet
                </button>
            </div>

            {/* Content Area */}
            {activeTab === 'summary' ? (
                /* Summary View */
                <div className="upload-card-wrapper">
                    <div className="summary-header">
                        <div className="summary-label">
                            <div className="summary-icon"><Sparkles /></div>
                            <span className="summary-title">Özet: {title}</span>
                        </div>
                        <div className="summary-actions">
                            {onRegenerate && (
                                <button onClick={onRegenerate} className="summary-action-btn">
                                    <RotateCcw /> Yeniden
                                </button>
                            )}
                            <button onClick={handleCopy} className="summary-action-btn bordered">
                                {copied ? <><Check className="copied" /><span className="copied">Kopyalandı</span></> : <><Copy /> Kopyala</>}
                            </button>
                        </div>
                    </div>
                    <div className="upload-card-inner">
                        <div className="summary-content">
                            {renderContent(summary)}
                        </div>
                    </div>
                </div>
            ) : (
                /* Chat View */
                <div className="chat-container">
                    <div className="chat-messages">
                        {messages.length === 0 && (
                            <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '40px' }}>
                                <BookOpen size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                                <h3 style={{ color: '#fff', marginBottom: '8px' }}>Belgenizle Sohbet Edin</h3>
                                <p>Aşağıdaki önerilerden birini seçin veya kendi sorunuzu sorun.</p>
                            </div>
                        )}

                        {messages.map((msg, idx) => (
                            <div key={idx} className={`chat-message ${msg.role}`}>
                                <div style={{ fontWeight: 600, marginBottom: '4px', fontSize: '12px', opacity: 0.7 }}>
                                    {msg.role === 'user' ? 'Siz' : 'NotebookLM'}
                                </div>
                                <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br />').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                            </div>
                        ))}
                        {isChatLoading && (
                            <div className="chat-message ai">
                                <span className="animate-pulse">Yazıyor...</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="chat-input-area">
                        {/* Suggestions Chips */}
                        {messages.length === 0 && (
                            <div className="suggested-actions">
                                {suggestions.map((s, i) => (
                                    <button key={i} className="action-chip" onClick={() => handleSendMessage(s.prompt)}>
                                        <Lightbulb size={12} />
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div style={{ position: 'relative' }}>
                            <textarea
                                className="chat-input"
                                placeholder="Belge hakkında bir soru sorun..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isChatLoading}
                            />
                            <button
                                className="chat-send-btn"
                                onClick={() => handleSendMessage(input)}
                                disabled={!input.trim() || isChatLoading}
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
