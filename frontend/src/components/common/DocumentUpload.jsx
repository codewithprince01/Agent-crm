import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Upload, X, FileText, CheckCircle, AlertCircle, RefreshCw, Eye } from 'lucide-react';
import { useToast } from '../ui/toast';

const DocumentUpload = ({
    label,
    documentType,
    tempId,
    currentUrl,
    onUploadSuccess,
    onFileSelect, // New prop for batch mode
    autoUpload = true, // Default to true for backward compatibility
    acceptedTypes = "image/*,.pdf",
    maxSizeInMB = 5,
    required = false,
    description
}) => {
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);
    const [preview, setPreview] = useState(currentUrl || null);
    const fileInputRef = useRef(null);
    const toast = useToast();

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const validateFile = (file) => {
        // Size validation
        if (file.size > maxSizeInMB * 1024 * 1024) {
            setError(`File size exceeds ${maxSizeInMB}MB`);
            return false;
        }

        // Type validation
        if (acceptedTypes) {
            const fileType = file.type;
            const fileName = file.name.toLowerCase();
            const allowedTypes = acceptedTypes.split(',').map(t => t.trim().toLowerCase());

            const isValidType = allowedTypes.some(type => {
                if (type.startsWith('.')) {
                    // Check extension
                    return fileName.endsWith(type);
                } else if (type.endsWith('/*')) {
                    // Check mime group (e.g. image/*)
                    const baseType = type.split('/')[0];
                    return fileType.startsWith(baseType + '/');
                } else {
                    // Exact mime type
                    return fileType === type;
                }
            });

            if (!isValidType) {
                setError(`Invalid file type. Allowed: ${acceptedTypes}`);
                return false;
            }
        }

        return true;
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = async (file) => {
        setError(null);
        if (!validateFile(file)) return;

        // Create local preview
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => setPreview(e.target.result);
            reader.readAsDataURL(file);
        } else {
            setPreview({ type: 'file', name: file.name });
        }

        if (autoUpload) {
            uploadFile(file);
        } else {
            if (onFileSelect) {
                onFileSelect(file);
            }
        }
    };

    const uploadFile = async (file) => {
        if (!tempId) {
            setError("Session expired. Please refresh.");
            return;
        }

        setUploading(true);
        setProgress(0);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('documentType', documentType);

        try {
            const response = await axios.post(`http://localhost:5000/api/students/draft/${tempId}/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                withCredentials: true,
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setProgress(percentCompleted);
                }
            });

            if (response.data.success) {
                onUploadSuccess(documentType, response.data.document);
                toast.success(`${label} uploaded successfully`);
                // If it's a PDF/Doc, the backend URL will be the "preview" link essentially
                if (!file.type.startsWith('image/')) {
                    setPreview({ type: 'file', name: file.name });
                }
            }
        } catch (err) {
            console.error('Upload failed:', err);
            setError(err.response?.data?.message || 'Upload failed. Please try again.');
            setPreview(currentUrl || null); // Revert preview on failure
        } finally {
            setUploading(false);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    const isImage = (urlOrPreview) => {
        if (!urlOrPreview) return false;
        if (typeof urlOrPreview === 'object' && urlOrPreview.type === 'file') return false; // It's a file object, not image preview
        return urlOrPreview.match(/\.(jpeg|jpg|png|webp)$/i) || urlOrPreview.startsWith('data:image');
    };

    const getFileNameFromUrl = (url) => {
        if (!url) return '';
        return url.split('/').pop();
    };

    return (
        <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {description && <p className="text-xs text-gray-500 mb-2">{description}</p>}

            {!currentUrl && !preview ? (
                // Upload Area
                <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
                        } ${error ? 'border-red-300 bg-red-50' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={triggerFileInput}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleChange}
                        accept={acceptedTypes}
                    />

                    <div className="flex flex-col items-center justify-center">
                        <Upload className={`mb-3 ${dragActive ? 'text-indigo-600' : 'text-gray-400'}`} size={32} />
                        <p className="text-sm text-gray-600 font-medium">
                            <span className="text-indigo-600">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            {acceptedTypes.replace(/image\/\*/g, 'JPG, PNG').replace(/\./g, '').toUpperCase()} (Max {maxSizeInMB}MB)
                        </p>
                    </div>

                    {error && (
                        <div className="mt-3 text-red-500 text-sm flex items-center justify-center gap-1">
                            <AlertCircle size={14} />
                            <span>{error}</span>
                        </div>
                    )}
                </div>
            ) : (
                // Preview / Success Area
                <div className="bg-white border rounded-lg p-4 relative shadow-sm group">
                    <div className="flex items-center gap-4">
                        {/* Thumbnail / Icon */}
                        <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 border">
                            {isImage(preview || currentUrl) ? (
                                <img
                                    src={preview || `http://localhost:5000${currentUrl}`}
                                    alt={label}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <FileText className="text-indigo-500" size={32} />
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <h4 className="text-sm font-medium text-gray-900 truncate">
                                    {preview?.name || getFileNameFromUrl(currentUrl) || label}
                                </h4>
                                {!uploading && <CheckCircle className="text-green-500 flex-shrink-0" size={16} />}
                            </div>

                            {uploading ? (
                                <div className="mt-2">
                                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-600 transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Uploading... {progress}%</p>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 mt-1">
                                    {currentUrl && (
                                        <a
                                            href={`http://localhost:5000${currentUrl}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Eye size={12} /> View
                                        </a>
                                    )}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            triggerFileInput();
                                        }}
                                        className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                                    >
                                        <RefreshCw size={12} /> Replace
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Hidden Input for Replace */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleChange}
                        accept={acceptedTypes}
                    />
                </div>
            )}
        </div>
    );
};

export default DocumentUpload;
