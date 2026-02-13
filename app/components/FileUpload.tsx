'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';

interface FileUploadProps {
    onFileSelect: (file: File) => void;
    selectedFile: File | null;
    onClearFile: () => void;
    isLoading: boolean;
}

export function FileUpload({ onFileSelect, selectedFile, onClearFile, isLoading }: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (!isLoading) setIsDragging(true);
    }, [isLoading]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (isLoading) return;
        if (e.dataTransfer.files?.[0]) validateAndSelect(e.dataTransfer.files[0]);
    }, [isLoading]);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) validateAndSelect(e.target.files[0]);
    };

    const validateAndSelect = (file: File) => {
        if (file.type !== 'application/pdf') {
            setError('Sadece PDF dosyaları desteklenmektedir.');
            return;
        }
        if (file.size > 50 * 1024 * 1024) {
            setError('Dosya boyutu 50MB\'dan küçük olmalıdır.');
            return;
        }
        setError(null);
        onFileSelect(file);
    };

    // === FILE SELECTED ===
    if (selectedFile) {
        return (
            <div className="animate-fade-up">
                <div className="upload-card-wrapper">
                    <div className="upload-card-inner">
                        <div className="file-card">
                            <div className="file-icon-box">
                                <FileText />
                            </div>
                            <div className="file-info">
                                <div className="file-name">{selectedFile.name}</div>
                                <div className="file-size">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</div>
                            </div>
                            {!isLoading && (
                                <button onClick={onClearFile} className="file-remove-btn">
                                    <X />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                {isLoading && (
                    <div className="progress-bar">
                        <div className="progress-fill" />
                    </div>
                )}
            </div>
        );
    }

    // === UPLOAD ZONE ===
    return (
        <div className="animate-fade-up">
            <div className="upload-card-wrapper">
                <div
                    className="upload-card-inner"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        className="hidden-input"
                        accept=".pdf"
                        onChange={handleFileInput}
                        disabled={isLoading}
                    />

                    <div className="upload-zone">
                        <div className={`upload-icon-circle ${isDragging ? 'dragging' : ''}`}>
                            <Upload />
                        </div>
                        <h3 className="upload-title">PDF Dosyanızı Yükleyin</h3>
                        <p className="upload-subtitle">Sürükle & bırak veya tıklayarak dosya seçin</p>
                        <div className="upload-tags">
                            <span className="upload-tag">.PDF</span>
                            <span className="upload-tag">Maks. 50MB</span>
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="error-box animate-fade-in" style={{ marginTop: '12px' }}>
                    <p className="error-text">{error}</p>
                </div>
            )}
        </div>
    );
}
