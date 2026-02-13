'use client';

import React, { useState } from 'react';
import { Copy, Check, Sparkles, RotateCcw } from 'lucide-react';

interface SummaryDisplayProps {
    summary: string;
    onRegenerate?: () => void;
}

export function SummaryDisplay({ summary, onRegenerate }: SummaryDisplayProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(summary);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

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
        <div className="animate-fade-up">
            {/* Header */}
            <div className="summary-header">
                <div className="summary-label">
                    <div className="summary-icon">
                        <Sparkles />
                    </div>
                    <span className="summary-title">Özet</span>
                </div>
                <div className="summary-actions">
                    {onRegenerate && (
                        <button onClick={onRegenerate} className="summary-action-btn">
                            <RotateCcw />
                            Yeniden Oluştur
                        </button>
                    )}
                    <button onClick={handleCopy} className="summary-action-btn bordered">
                        {copied ? (
                            <>
                                <Check className="copied" />
                                <span className="copied">Kopyalandı</span>
                            </>
                        ) : (
                            <>
                                <Copy />
                                Kopyala
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Card */}
            <div className="upload-card-wrapper">
                <div className="upload-card-inner">
                    <div className="summary-content">
                        {renderContent(summary)}
                    </div>
                </div>
            </div>
        </div>
    );
}
