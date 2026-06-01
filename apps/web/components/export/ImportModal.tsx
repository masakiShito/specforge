'use client';

import { useState, useCallback, useRef } from 'react';
import type { Project, Document } from '@specforge/document-schema';
import type {
  DocumentEditorState,
  FieldValue,
} from '../../lib/document-editor/create-document-state';
import {
  importProjectFromJson,
  importDocumentFromJson,
  validateImportData,
  readFileAsText,
} from '../../lib/export';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportProject: (project: Project, documentStates: DocumentEditorState[]) => void;
  onImportDocument: (document: Document, fieldValues: Record<string, FieldValue>) => void;
}

type ImportTarget = 'project' | 'document';

interface ImportPreview {
  type: ImportTarget;
  projectTitle?: string;
  documentCount?: number;
  documentTitle?: string;
  documentKind?: string;
}

export function ImportModal({
  isOpen,
  onClose,
  onImportProject,
  onImportDocument,
}: ImportModalProps) {
  const [target, setTarget] = useState<ImportTarget>('project');
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setFile(null);
    setFileContent(null);
    setPreview(null);
    setError(null);
    setValidationErrors([]);
  }, []);

  const handleFileSelect = useCallback(
    async (selectedFile: File) => {
      resetState();
      setFile(selectedFile);

      try {
        const content = await readFileAsText(selectedFile);
        setFileContent(content);

        // Validate and preview
        const parsed = JSON.parse(content);
        const validation = validateImportData(parsed);

        if (!validation.valid) {
          setError('ファイル形式が正しくありません');
          setValidationErrors(validation.errors);
          return;
        }

        // Determine type and create preview
        if ('project' in parsed) {
          setTarget('project');
          setPreview({
            type: 'project',
            projectTitle: parsed.project?.title,
            documentCount: parsed.project?.documents?.length ?? 0,
          });
        } else if ('document' in parsed) {
          setTarget('document');
          setPreview({
            type: 'document',
            documentTitle: parsed.document?.title,
            documentKind: parsed.document?.kind,
          });
        }
      } catch (err) {
        setError(
          `ファイルの読み込みに失敗しました: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    },
    [resetState]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile && droppedFile.name.endsWith('.json')) {
        handleFileSelect(droppedFile);
      } else {
        setError('JSON ファイルのみインポートできます');
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleImport = useCallback(() => {
    if (!fileContent) return;

    setIsImporting(true);
    setError(null);

    try {
      if (target === 'project') {
        const result = importProjectFromJson(fileContent);
        if (!result.success) {
          setError(result.error);
          if (result.details) {
            setValidationErrors(result.details);
          }
          return;
        }
        onImportProject(result.data.project, result.data.documentStates);
      } else {
        const result = importDocumentFromJson(fileContent);
        if (!result.success) {
          setError(result.error);
          if (result.details) {
            setValidationErrors(result.details);
          }
          return;
        }
        onImportDocument(result.data.document, result.data.fieldValues);
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsImporting(false);
    }
  }, [target, fileContent, onImportProject, onImportDocument, onClose]);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={handleClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '24px',
          width: '480px',
          maxWidth: '90vw',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 20px', fontSize: '1.25rem', fontWeight: 600, color: '#0F172A' }}>
          インポート
        </h2>

        {/* File Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '2px dashed #E2E8F0',
            borderRadius: '8px',
            padding: '32px',
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: file ? '#F0FDF4' : '#F8FAFC',
            marginBottom: '16px',
            transition: 'all 0.15s',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const selectedFile = e.target.files?.[0];
              if (selectedFile) {
                handleFileSelect(selectedFile);
              }
            }}
          />
          {file ? (
            <>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: '#22C55E',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                }}
              >
                <span style={{ color: '#FFFFFF', fontSize: '1.5rem' }}>✓</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500, color: '#0F172A' }}>
                {file.name}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#64748B' }}>
                クリックして別のファイルを選択
              </p>
            </>
          ) : (
            <>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: '#E2E8F0',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>📁</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>
                クリックまたはドラッグ&ドロップ
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>
                JSON ファイル (.json)
              </p>
            </>
          )}
        </div>

        {/* Preview */}
        {preview && (
          <div
            style={{
              padding: '12px',
              backgroundColor: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: '8px',
              marginBottom: '16px',
            }}
          >
            <h3
              style={{ margin: '0 0 8px', fontSize: '0.875rem', fontWeight: 600, color: '#166534' }}
            >
              インポート内容
            </h3>
            {preview.type === 'project' ? (
              <div style={{ fontSize: '0.8rem', color: '#15803D' }}>
                <p style={{ margin: '0 0 4px' }}>
                  <strong>種別:</strong> プロジェクト
                </p>
                <p style={{ margin: '0 0 4px' }}>
                  <strong>タイトル:</strong> {preview.projectTitle ?? '(不明)'}
                </p>
                <p style={{ margin: 0 }}>
                  <strong>ドキュメント数:</strong> {preview.documentCount}
                </p>
              </div>
            ) : (
              <div style={{ fontSize: '0.8rem', color: '#15803D' }}>
                <p style={{ margin: '0 0 4px' }}>
                  <strong>種別:</strong> ドキュメント
                </p>
                <p style={{ margin: '0 0 4px' }}>
                  <strong>タイトル:</strong> {preview.documentTitle ?? '(不明)'}
                </p>
                <p style={{ margin: 0 }}>
                  <strong>タイプ:</strong> {preview.documentKind ?? '(不明)'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            style={{
              padding: '12px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '8px',
              marginBottom: '16px',
            }}
          >
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#DC2626', fontWeight: 500 }}>
              {error}
            </p>
            {validationErrors.length > 0 && (
              <ul
                style={{
                  margin: '8px 0 0',
                  paddingLeft: '20px',
                  fontSize: '0.75rem',
                  color: '#B91C1C',
                }}
              >
                {validationErrors.map((err, index) => (
                  <li key={index}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Warning */}
        {preview && (
          <div
            style={{
              padding: '12px',
              backgroundColor: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: '8px',
              marginBottom: '16px',
            }}
          >
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#92400E' }}>
              {preview.type === 'project'
                ? 'プロジェクトをインポートすると、現在のプロジェクトは置き換えられます。'
                : 'ドキュメントは現在のプロジェクトに追加されます。'}
            </p>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={handleClose}
            style={{
              padding: '8px 16px',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#475569',
              backgroundColor: '#F1F5F9',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={isImporting || !preview || !!error}
            style={{
              padding: '8px 16px',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#FFFFFF',
              backgroundColor: isImporting || !preview || !!error ? '#94A3B8' : '#3B82F6',
              border: 'none',
              borderRadius: '6px',
              cursor: isImporting || !preview || !!error ? 'not-allowed' : 'pointer',
            }}
          >
            {isImporting ? 'インポート中...' : 'インポート'}
          </button>
        </div>
      </div>
    </div>
  );
}
