import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, X, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface FileDropzoneProps {
  onFileLoaded: (validEmails: string[], invalidEmails: string[], fileName: string) => void;
  onClear: () => void;
  fileName?: string;
  detectedCount?: number;
  invalidEmails?: string[];
  isUploading?: boolean;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFileLoaded,
  onClear,
  fileName,
  detectedCount = 0,
  invalidEmails = [],
  isUploading = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const parseFileContent = (content: string, name: string) => {
    const lines = content.split(/[\r\n,;]+/);
    const valid: string[] = [];
    const invalid: string[] = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      if (emailRegex.test(trimmed)) {
        if (!valid.includes(trimmed.toLowerCase())) {
          valid.push(trimmed.toLowerCase());
        }
      } else {
        if (!invalid.includes(trimmed)) {
          invalid.push(trimmed);
        }
      }
    });

    onFileLoaded(valid, invalid, name);
  };

  const handleFileSelect = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseFileContent(text || '', file.name);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full flex flex-col gap-2">
      <label className="text-xs font-semibold text-text-secondary tracking-wide uppercase">
        Lead Recipients (CSV / TXT)
      </label>

      {fileName ? (
        /* Uploaded State */
        <div className="border border-border bg-surface-muted/50 rounded-ten p-4 flex flex-col gap-3 animate-scale-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-text-primary">{fileName}</span>
                <span className="text-xs text-text-secondary">
                  {detectedCount} valid recipient{detectedCount === 1 ? '' : 's'} detected
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClear}
              className="p-1.5 text-text-tertiary hover:text-danger hover:bg-danger-light rounded-lg transition-smooth"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Status Line */}
          <div className="flex items-center gap-2 text-xs border-t border-border pt-3 mt-1">
            <span className="flex items-center gap-1 text-success font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {detectedCount} Valid
            </span>
            {invalidEmails.length > 0 && (
              <span className="flex items-center gap-1 text-warning font-medium ml-2">
                <AlertCircle className="w-3.5 h-3.5" />
                {invalidEmails.length} Skipped
              </span>
            )}
          </div>

          {/* Invalid Emails Warning */}
          {invalidEmails.length > 0 && (
            <div className="bg-warning-light border border-warning/30 rounded-lg p-3 text-xs text-warning-900">
              <span className="font-semibold block mb-2">Invalid format rows (skipped):</span>
              <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                {invalidEmails.slice(0, 10).map((inv, idx) => (
                  <span key={idx} className="bg-warning/10 text-warning px-2 py-0.5 rounded font-mono text-[11px]">
                    {inv}
                  </span>
                ))}
                {invalidEmails.length > 10 && (
                  <span className="text-[11px] font-semibold text-warning/70">+{invalidEmails.length - 10} more</span>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty Drop Zone */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-ten p-8 text-center cursor-pointer transition-smooth flex flex-col items-center justify-center gap-3 ${
            isDragOver
              ? 'border-accent bg-accent-light/30'
              : 'border-border hover:border-text-tertiary bg-surface-muted/40 hover:bg-surface-muted'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv, .txt"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0]);
              }
            }}
          />

          <div className={`p-3 rounded-full transition-smooth ${isDragOver ? 'bg-accent/10 text-accent' : 'bg-surface-muted text-text-secondary'}`}>
            <UploadCloud className="w-6 h-6 stroke-[1.5]" />
          </div>

          <div className="space-y-1">
            <div>
              <span className="text-sm font-semibold text-accent">Click to upload</span>
              <span className="text-sm text-text-secondary"> or drag here</span>
            </div>
            <p className="text-xs text-text-tertiary">CSV or TXT format (one email per line)</p>
          </div>
        </div>
      )}
    </div>
  );
};
