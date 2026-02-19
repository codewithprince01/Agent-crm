import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Trash2, ExternalLink, Download, Save, CheckCircle2, Shield, AlertCircle, Info, Loader2 } from 'lucide-react';
import { useToast } from '../ui/toast';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../ui/alert-dialog';
import studentService from '../../services/studentService';
import { REQUIRED_STUDENT_DOCUMENTS } from '../../utils/constants';


const StudentDocumentUpload = ({ student, onUploadSuccess, isAdmin = false, isManualMode = false, pendingDocs = [], setPendingDocs }) => {
    const toast = useToast();
    const [uploadingDoc, setUploadingDoc] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null); // Key of doc to delete
    const [docName, setDocName] = useState('');
    const [docKey, setDocKey] = useState(''); // Hidden key for smart selection
    const [file, setFile] = useState(null);
    const fileInputRef = useRef(null);

    // Calculate missing documents
    // In manual mode, check against pendingDocs
    const uploadedKeys = isManualMode
        ? pendingDocs.map(d => d.key || d.label)
        : (student?.documents ? Object.keys(student.documents).filter(key => student.documents[key]) : []);

    const missingDocs = REQUIRED_STUDENT_DOCUMENTS.filter(doc => !uploadedKeys.includes(doc.key));

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.size > 5 * 1024 * 1024) {
                toast.error("File size must be less than 5MB");
                return;
            }
            setFile(selectedFile);
        }
    };

    const handleSmartSelect = (doc) => {
        setDocName(doc.label);
        setDocKey(doc.key);
        // Reset file input
        setFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
            fileInputRef.current.click();
        }
    };

    const handleUpload = async () => {
        if (!docName || !file) {
            toast.error('Please provide both document name and file');
            return;
        }

        setUploadingDoc(true);

        try {
            if (isManualMode) {
                // Client-side staging
                const newDoc = {
                    key: docKey || docName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
                    label: docName,
                    file: file,
                    previewUrl: URL.createObjectURL(file), // Create local preview URL
                    type: file.type
                };

                // Remove existing if replacing
                const filtered = pendingDocs.filter(d => d.key !== newDoc.key && d.label !== newDoc.label);
                setPendingDocs([...filtered, newDoc]);

                toast.success('Document added to list');
            } else {
                // Server-side upload
                const formData = new FormData();
                formData.append('documentName', docKey || docName);
                formData.append('file', file);

                const userId = student._id || student.id;
                await studentService.uploadDocument(userId, formData);
                toast.success('Document uploaded successfully!');
                if (onUploadSuccess) onUploadSuccess();
            }

            // Reset form
            setDocName('');
            setDocKey('');
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';

        } catch (error) {
            console.error('Upload failed:', error);
            toast.error(error.response?.data?.message || 'Failed to upload document');
        } finally {
            setUploadingDoc(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;

        try {
            if (isManualMode) {
                // Client-side delete
                const updated = pendingDocs.filter(d => (d.key || d.label) !== deleteConfirm);
                setPendingDocs(updated);
                toast.success('Document removed from list');
            } else {
                // Server-side delete
                const userId = student._id || student.id;
                await studentService.deleteDocument(userId, deleteConfirm);
                toast.success('Document deleted successfully');
                if (onUploadSuccess) onUploadSuccess();
            }
            setDeleteConfirm(null);
        } catch (error) {
            console.error('Delete failed:', error);
            toast.error('Failed to delete document');
            setDeleteConfirm(null);
        }
    };

    // Construct backend URL helper
    const getFullUrl = (url) => {
        if (!url || typeof url !== 'string') return '';
        if (url.startsWith('blob:')) return url; // Handle local preview URLs
        if (url.startsWith('http')) return url;
        const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
        // Remove leading slash from url if present to avoid double slash
        const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
        return `${backendUrl}/${cleanUrl}`;
    };

    return (
        <div className="space-y-6">
            {/* 1. Missing Documents - Smart Selection */}
            {missingDocs.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                    <h4 className="text-sm font-bold text-amber-800 mb-4 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Action Required: Missing Documents
                    </h4>
                    <p className="text-xs text-amber-700 mb-4">
                        Select a document below to quickly upload it.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {missingDocs.map((doc) => (
                            <button
                                key={doc.key}
                                onClick={() => handleSmartSelect(doc)}
                                className={`
                                    flex items-center justify-between p-3 rounded-xl border transition-all text-left
                                    ${docKey === doc.key
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200 scale-105'
                                        : 'bg-white border-amber-200 text-amber-900 hover:border-blue-300 hover:bg-blue-50'}
                                `}
                            >
                                <span className="text-xs font-bold truncate pr-2">{doc.label}</span>
                                {docKey === doc.key ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <Upload className="w-4 h-4 flex-shrink-0 opacity-50" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* 2. Upload Form */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-blue-600" />
                    {isManualMode ? 'Add Document ' : 'Upload Document'}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 block">
                            Document Type / Name
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={docName}
                                onChange={(e) => {
                                    setDocName(e.target.value);
                                    if (docKey && e.target.value !== REQUIRED_STUDENT_DOCUMENTS.find(d => d.key === docKey)?.label) {
                                        setDocKey('');
                                    }
                                }}
                                placeholder="e.g. 10th Marksheet"
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:font-normal"
                            />
                            {docKey && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <span className="flex items-center gap-1 text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                                        Auto-Link <CheckCircle2 className="w-3 h-3" />
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="md:col-span-5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 block">
                            File
                        </label>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept={docKey === 'photo' ? ".jpg,.jpeg,.png,.webp,.avif,.heic" : ".pdf,.jpg,.jpeg,.png,.webp"}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all cursor-pointer"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <button
                            onClick={handleUpload}
                            disabled={uploadingDoc || !docName || !file}
                            className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {uploadingDoc ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {uploadingDoc ? 'Saving...' : (isManualMode ? 'Add' : 'Upload')}
                        </button>
                    </div>
                </div>
            </div>

            {/* 3. Uploaded Documents List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {uploadedKeys.length > 0 ? (
                    uploadedKeys.map((key) => {
                        let url, label, isRequired;

                        if (isManualMode) {
                            const doc = pendingDocs.find(d => (d.key || d.label) === key);
                            if (!doc) return null;
                            url = doc.previewUrl;
                            label = doc.label;
                            isRequired = REQUIRED_STUDENT_DOCUMENTS.some(d => d.key === doc.key);
                        } else {
                            const val = student.documents[key];
                            // Handle object format validation
                            if (val && typeof val === 'object' && val.documentUrl) {
                                url = val.documentUrl;
                            } else {
                                url = val;
                            }

                            label = REQUIRED_STUDENT_DOCUMENTS.find(d => d.key === key)?.label || key.replace(/([A-Z])/g, ' $1').trim();
                            isRequired = REQUIRED_STUDENT_DOCUMENTS.some(d => d.key === key);
                        }

                        if (!url) return null;
                        const fullUrl = getFullUrl(url);

                        return (
                            <div key={key} className="group flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl hover:border-blue-200 hover:shadow-sm transition-all">
                                <div className="flex items-center gap-4 overflow-hidden">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isRequired ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'}`}>
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-gray-900 truncate">{label}</p>
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mt-0.5 flex items-center gap-1">
                                            {isRequired ? <span className="text-emerald-600 flex items-center gap-0.5"><Shield className="w-3 h-3" /> {isManualMode ? 'Ready to Upload' : 'Verified'}</span> : 'Optional Document'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View">
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                    {!isManualMode && (
                                        <a href={fullUrl} download className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Download">
                                            <Download className="w-4 h-4" />
                                        </a>
                                    )}
                                    {(isAdmin || isManualMode) && (
                                        <button onClick={() => setDeleteConfirm(key)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Delete">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-100 rounded-2xl">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-gray-900 font-bold text-sm">No documents uploaded yet.</p>
                        <p className="text-gray-400 text-xs mt-1">Upload missing documents to verify this profile.</p>
                    </div>
                )}
            </div>

            {/* Delete Confirmation AlertDialog */}
            <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this document and cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default StudentDocumentUpload;
