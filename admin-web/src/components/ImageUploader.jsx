import { useState, useRef } from 'react';
import { uploadImage } from '../services/api';
import {
    UploadCloud,
    Link2,
    CheckCircle2,
    Trash2,
    RefreshCw,
    Loader2,
    Image as ImageIcon
} from 'lucide-react';

export default function ImageUploader({
    value = '',
    onChange,
    folder = 'general',
    label = 'Image',
    placeholder = 'https://...',
    multiple = false,
    onUploadMultiple,
}) {
    const [mode, setMode] = useState('upload'); // 'upload' | 'url'
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    async function processFiles(filesList) {
        const files = Array.from(filesList || []).filter((f) => f.type.startsWith('image/'));
        if (files.length === 0) return;

        // Size check (max 5MB each)
        const oversized = files.filter((f) => f.size > 5 * 1024 * 1024);
        if (oversized.length > 0) {
            setError(`${oversized.length} file(s) exceed 5MB limit and were skipped`);
        }

        const validFiles = files.filter((f) => f.size <= 5 * 1024 * 1024);
        if (validFiles.length === 0) return;

        setUploading(true);
        if (oversized.length === 0) setError(null);

        const uploadedUrls = [];

        try {
            for (let i = 0; i < validFiles.length; i++) {
                const file = validFiles[i];
                setUploadProgress(`Uploading ${i + 1} of ${validFiles.length} photos…`);
                const res = await uploadImage(file, folder, file.name);
                const uploadedUrl = res.data?.url;
                if (uploadedUrl) {
                    uploadedUrls.push(uploadedUrl);
                }
            }

            if (uploadedUrls.length > 0) {
                if (multiple && onUploadMultiple) {
                    onUploadMultiple(uploadedUrls);
                } else if (onChange) {
                    onChange(uploadedUrls[0]);
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setUploading(false);
            setUploadProgress('');
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    }

    async function handleFileSelect(e) {
        await processFiles(e.target.files);
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }

    function handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }

    async function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer?.files) {
            await processFiles(e.dataTransfer.files);
        }
    }

    function handleRemove() {
        if (onChange) onChange('');
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-stone-700">
                    {label}
                </label>
                <div className="flex items-center gap-2 text-[11px]">
                    <button
                        type="button"
                        onClick={() => { setMode('upload'); setError(null); }}
                        className={`flex items-center gap-1 transition-colors cursor-pointer ${
                            mode === 'upload' ? 'font-semibold text-stone-900 underline' : 'text-stone-400 hover:text-stone-600'
                        }`}
                    >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Upload File</span>
                    </button>
                    <span className="text-stone-300">|</span>
                    <button
                        type="button"
                        onClick={() => { setMode('url'); setError(null); }}
                        className={`flex items-center gap-1 transition-colors cursor-pointer ${
                            mode === 'url' ? 'font-semibold text-stone-900 underline' : 'text-stone-400 hover:text-stone-600'
                        }`}
                    >
                        <Link2 className="w-3.5 h-3.5" />
                        <span>Image URL</span>
                    </button>
                </div>
            </div>

            {/* If single image mode and an image is selected/uploaded, show preview card */}
            {!multiple && value ? (
                <div className="flex items-center gap-3 p-3 bg-stone-50 border border-stone-200 rounded-xl">
                    <img
                        src={value}
                        alt="Selected Preview"
                        className="w-14 h-14 rounded-lg object-cover border border-stone-300 bg-white shadow-2xs shrink-0"
                        onError={(e) => {
                            e.target.style.display = 'none';
                        }}
                    />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-stone-800 truncate" title={value}>
                            {value.startsWith('http') ? value.split('/').pop() : 'Selected Image'}
                        </p>
                        <p className="text-[10px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 inline" />
                            <span>Ready</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg transition-colors cursor-pointer"
                        >
                            <RefreshCw className="w-3 h-3" />
                            <span>Change</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs text-red-600 hover:text-red-700 bg-white hover:bg-red-50 border border-stone-200 rounded-lg transition-colors cursor-pointer"
                        >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove</span>
                        </button>
                    </div>
                </div>
            ) : mode === 'upload' ? (
                /* Upload Dropzone / Button */
                <div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple={multiple}
                        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/gif"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                            uploading
                                ? 'bg-stone-50 border-stone-300 cursor-wait'
                                : isDragging
                                ? 'bg-stone-100 border-stone-900 ring-2 ring-stone-900/10 scale-[1.01]'
                                : 'bg-stone-50/70 hover:bg-stone-100/80 border-stone-300 hover:border-stone-500'
                        }`}
                    >
                        {uploading ? (
                            <div className="flex flex-col items-center justify-center gap-2 py-2">
                                <Loader2 className="w-6 h-6 animate-spin text-stone-700" />
                                <p className="text-xs font-semibold text-stone-800">
                                    {uploadProgress || 'Uploading photos to server…'}
                                </p>
                                <p className="text-[10px] text-stone-400">
                                    Please wait while images are being saved…
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center">
                                <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center mb-2 text-stone-600">
                                    <ImageIcon className="w-5 h-5" />
                                </div>
                                <p className="text-xs font-semibold text-stone-800">
                                    {multiple
                                        ? 'Click to Browse Multiple Photos or Drag & Drop Here'
                                        : 'Click to Browse or Drag Image Here'}
                                </p>
                                <p className="text-[11px] text-stone-400 mt-1">
                                    Supports PNG, JPG, WEBP, SVG up to 5MB
                                    {multiple && ' · Select multiple files together'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* URL Input Mode */
                <div>
                    <input
                        type="url"
                        placeholder={placeholder}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3.5 py-2 text-xs text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-stone-900"
                    />
                </div>
            )}


            {error && (
                <p className="text-[11px] text-red-600 font-medium mt-1">
                    {error}
                </p>
            )}
        </div>
    );
}
