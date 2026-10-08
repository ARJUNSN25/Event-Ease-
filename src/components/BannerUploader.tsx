/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  X,
  Check,
  Sparkles,
  Trash2,
  FolderUp,
  Camera,
  AlertCircle,
} from 'lucide-react';
import { PRESET_BANNERS } from '../store';

interface BannerUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  error?: string;
}

/**
 * Resizes an image file using an off-screen HTML5 canvas to guarantee optimal
 * dimensions (max 1280x720) and compact file size for localStorage storage.
 */
function compressAndResizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image for processing'));
      img.onload = () => {
        const maxWidth = 1280;
        const maxHeight = 720;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to original base64 if canvas context unavailable
          resolve(e.target?.result as string);
          return;
        }

        // Draw image smoothed
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to web-standard jpeg at 0.85 quality (~60-120KB)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(compressedDataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function BannerUploader({
  value,
  onChange,
  label = 'Event Banner',
  error,
}: BannerUploaderProps) {
  // Determine initial mode based on value
  const isCustomUpload = value.startsWith('data:image/');
  const isPreset = PRESET_BANNERS.some((p) => p.url === value);
  const initialMode = isCustomUpload ? 'upload' : isPreset ? 'preset' : 'url';

  const [activeTab, setActiveTab] = useState<'upload' | 'preset' | 'url'>(initialMode);
  const [customUrlInput, setCustomUrlInput] = useState(
    !isCustomUpload && !isPreset ? value : ''
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(
    isCustomUpload ? 'Custom uploaded banner' : null
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPG, PNG, WebP, etc.)');
      return;
    }

    // Limit original file size to 15MB before local compression
    if (file.size > 15 * 1024 * 1024) {
      setUploadError('File is too large. Please select an image under 15MB.');
      return;
    }

    setUploadError(null);
    setIsProcessing(true);

    try {
      const compressedUrl = await compressAndResizeImage(file);
      setFileName(file.name);
      onChange(compressedUrl);
      setActiveTab('upload');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not process image.';
      setUploadError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleUrlApply = () => {
    if (!customUrlInput.trim()) return;
    onChange(customUrlInput.trim());
  };

  const handleSelectPreset = (url: string) => {
    onChange(url);
    setFileName(null);
  };

  const handleClearBanner = () => {
    // Revert to first preset default
    onChange(PRESET_BANNERS[0].url);
    setFileName(null);
    setCustomUrlInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-[#5B6478]">
          {label} <span className="text-[#3345E8] font-normal text-[11px]">(Upload or choose)</span>
        </label>
        {value && (
          <button
            type="button"
            onClick={handleClearBanner}
            className="text-[11px] font-semibold text-[#5B6478] hover:text-[#C0302F] transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            <span>Reset to default</span>
          </button>
        )}
      </div>

      {/* Live Banner Preview Card */}
      <div className="relative rounded-[14px] overflow-hidden border border-[#E1E5EE] bg-[#0E1424] shadow-xs group">
        <div className="h-28 sm:h-32 w-full relative overflow-hidden flex items-center justify-center">
          {value.startsWith('linear-gradient') ? (
            <div className="w-full h-full" style={{ background: value }} />
          ) : (
            <img
              src={value}
              alt="Event banner preview"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                // If custom URL failed to load, show gradient fallback
                (e.target as HTMLImageElement).src = PRESET_BANNERS[0].url;
              }}
            />
          )}

          {/* Gradient overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent flex flex-col justify-between p-3 pointer-events-none">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-black/60 text-white border border-white/20 backdrop-blur-xs">
                <Sparkles className="w-2.5 h-2.5 text-[#E6A23C]" />
                {isCustomUpload
                  ? 'Your Custom Upload'
                  : isPreset
                  ? 'Preset Theme'
                  : 'Custom Image URL'}
              </span>

              {fileName && (
                <span className="text-[10px] text-white/90 font-medium truncate max-w-[140px] bg-black/40 px-2 py-0.5 rounded">
                  {fileName}
                </span>
              )}
            </div>

            <div className="text-white">
              <p className="text-[11px] text-white/80 font-medium">Banner Display Preview</p>
              <p className="text-xs font-bold text-white truncate">
                Displayed in student catalog, registration passes & portal
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex rounded-[10px] bg-[#F4F6FA] p-1 border border-[#E1E5EE]">
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-1.5 px-3 rounded-[8px] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'upload'
              ? 'bg-white text-[#3345E8] shadow-xs'
              : 'text-[#5B6478] hover:text-[#0E1424]'
          }`}
        >
          <FolderUp className="w-3.5 h-3.5" />
          <span>Upload Image</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('preset')}
          className={`flex-1 py-1.5 px-3 rounded-[8px] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'preset'
              ? 'bg-white text-[#3345E8] shadow-xs'
              : 'text-[#5B6478] hover:text-[#0E1424]'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Presets ({PRESET_BANNERS.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('url')}
          className={`flex-1 py-1.5 px-3 rounded-[8px] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'url'
              ? 'bg-white text-[#3345E8] shadow-xs'
              : 'text-[#5B6478] hover:text-[#0E1424]'
          }`}
        >
          <LinkIcon className="w-3.5 h-3.5" />
          <span>Web URL</span>
        </button>
      </div>

      {/* TAB 1: UPLOAD YOUR OWN BANNER FILE */}
      {activeTab === 'upload' && (
        <div className="space-y-2">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            className="hidden"
          />

          {/* Drag & Drop Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-[14px] p-5 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-[#3345E8] bg-[#EEF2FF]'
                : 'border-[#CBD5E1] hover:border-[#3345E8] hover:bg-[#F8FAFC]'
            }`}
          >
            <div className="flex flex-col items-center justify-center space-y-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isDragging
                    ? 'bg-[#3345E8] text-white'
                    : 'bg-[#EEF2FF] text-[#3345E8]'
                }`}
              >
                {isProcessing ? (
                  <div className="w-5 h-5 border-2 border-[#3345E8] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload className="w-5 h-5" />
                )}
              </div>

              <div>
                <p className="text-xs font-bold text-[#0E1424]">
                  {isProcessing
                    ? 'Processing & optimizing image...'
                    : 'Click to upload your own banner, or drag and drop'}
                </p>
                <p className="text-[11px] text-[#5B6478] mt-0.5">
                  PNG, JPG, WebP from your laptop or phone • Auto-optimized for crisp display
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] font-bold text-[#3345E8] bg-white border border-[#3345E8]/30 px-2.5 py-1 rounded-[6px] shadow-2xs hover:bg-[#EEF2FF]">
                  Choose from Files / Photos
                </span>
              </div>
            </div>
          </div>

          {uploadError && (
            <div className="flex items-center gap-1.5 text-xs text-[#C0302F] bg-[#FFF4F2] p-2 rounded-[8px] border border-[#FCDAD7]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {isCustomUpload && (
            <div className="flex items-center justify-between text-xs bg-[#F0FDF4] text-[#12805C] px-3 py-1.5 rounded-[8px] border border-[#BBF7D0]">
              <span className="flex items-center gap-1.5 font-bold">
                <Check className="w-3.5 h-3.5" />
                Your custom banner is active!
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="text-[11px] underline font-bold hover:text-[#0b5c41] cursor-pointer"
              >
                Upload different file
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PRESET THEME BANNERS */}
      {activeTab === 'preset' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
          {PRESET_BANNERS.map((b) => {
            const isSelected = value === b.url;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => handleSelectPreset(b.url)}
                className={`group relative rounded-[10px] overflow-hidden border-2 text-left h-16 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#3345E8] ring-2 ring-[#3345E8]/30 shadow-xs'
                    : 'border-[#E1E5EE] opacity-80 hover:opacity-100 hover:border-[#94A3B8]'
                }`}
              >
                {b.url.startsWith('linear-gradient') ? (
                  <div className="w-full h-full" style={{ background: b.url }} />
                ) : (
                  <img
                    src={b.url}
                    alt={b.label}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-black/45 flex items-end p-1.5">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-bold text-white truncate drop-shadow-xs">
                      {b.label}
                    </span>
                    {isSelected && (
                      <span className="bg-[#3345E8] text-white p-0.5 rounded-full">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* TAB 3: CUSTOM WEB IMAGE URL */}
      {activeTab === 'url' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="url"
              value={customUrlInput}
              onChange={(e) => setCustomUrlInput(e.target.value)}
              placeholder="https://images.unsplash.com/... or any image link"
              className="flex-1 px-3 py-2 text-xs bg-white border border-[#E1E5EE] rounded-[10px] text-[#0E1424] focus:outline-none focus:ring-2 focus:ring-[#3345E8]/30"
            />
            <button
              type="button"
              onClick={handleUrlApply}
              className="px-3.5 py-2 bg-[#3345E8] text-white rounded-[10px] text-xs font-bold hover:bg-[#2735C4] transition-colors cursor-pointer"
            >
              Apply
            </button>
          </div>
          <p className="text-[11px] text-[#5B6478]">
            Paste a public direct link to an image (JPEG, PNG, WebP).
          </p>
        </div>
      )}

      {error && <p className="text-xs text-[#C0302F]">{error}</p>}
    </div>
  );
}
