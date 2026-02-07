import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { User, UserCircle2, Home, GraduationCap, MessageSquare, Lock, ChevronLeft, Globe, MapPin, Phone, Mail, Calendar, FileText, CheckCircle2, Award, LogOut, Trash2, Plus, X, Eye, EyeOff } from 'lucide-react';
import apiClient from '../../services/apiClient';
import authService from '../../services/authService';

/**
 * StudentProfile Component
 * Balanced Premium Design: Polished but not "excessive".
 * Maintains full-width sidebar card and reduced outer padding as requested.
 */
const StudentProfile = () => {
    const navigate = useNavigate();

    // --- State Management ---
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("general");

    // Document Upload States
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [documentForm, setDocumentForm] = useState({ documentName: '', selectedFile: null });

    // Core Data States
    const [studentData, setStudentData] = useState(null);
    const [editMode, setEditMode] = useState({
        general: false,
        education: false,
        testScores: false,
        background: false
    });
    const [editData, setEditData] = useState({});

    // Change Password States
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        old: false,
        new: false,
        confirm: false
    });

    // --- Refs for Smooth Scrolling ---
    const profileRef = useRef(null);
    const generalRef = useRef(null);
    const educationRef = useRef(null);
    const testScoresRef = useRef(null);
    const backgroundRef = useRef(null);
    const uploadRef = useRef(null);
    const fileInputRef = useRef(null);

    // --- Data Fetching ---
    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/students/me');
            const data = response?.data?.data?.student || response?.data;
            if (data) {
                const formattedData = {
                    ...data,
                    dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : "",
                    passportExpiry: data.passportExpiry ? new Date(data.passportExpiry).toISOString().split('T')[0] : "",
                    examDate: data.examDate ? new Date(data.examDate).toISOString().split('T')[0] : "",
                    additionalQualifications: {
                        gre: data.additionalQualifications?.gre || { hasExam: false, examDate: "", verbalScore: "", verbalRank: "", quantScore: "", quantRank: "", writingScore: "", writingRank: "" },
                        gmat: data.additionalQualifications?.gmat || { hasExam: false, examDate: "", verbalScore: "", verbalRank: "", quantScore: "", quantRank: "", writingScore: "", writingRank: "", irScore: "", irRank: "", totalScore: "", totalRank: "" },
                        sat: data.additionalQualifications?.sat || { hasExam: false, examDate: "", reasoningPoint: "", subjectTestPoint: "" }
                    }
                };
                setStudentData(formattedData);
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
            setError('Failed to load profile data.');
        } finally {
            setLoading(false);
        }
    };

    // --- Handlers ---
    const handleTabClick = (tab, ref) => {
        setActiveTab(tab);
        ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const handleEditToggle = (section) => {
        setEditMode(prev => ({ ...prev, [section]: true }));
        setEditData({ ...studentData });
    };

    const handleCancelEdit = (section) => {
        setEditMode(prev => ({ ...prev, [section]: false }));
        setEditData({});
    };

    const handleFieldChange = (field, value) => {
        setEditData(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveEdit = async (section) => {
        try {
            setLoading(true);
            const response = await apiClient.put('/students/me', editData);
            if (response.data.success) {
                setStudentData(editData);
                setEditMode(prev => ({ ...prev, [section]: false }));
                setEditData({});
                setUploadSuccess('Profile updated successfully!');
                setTimeout(() => setUploadSuccess(false), 3000);
            }
        } catch (err) {
            setUploadError(err.response?.data?.message || 'Update failed');
            setTimeout(() => setUploadError(null), 3000);
        } finally {
            setLoading(false);
        }
    };

    // --- Document Handlers ---
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) setDocumentForm(prev => ({ ...prev, selectedFile: file }));
    };

    const handleUploadSubmit = async () => {
        if (!documentForm.documentName.trim() || !documentForm.selectedFile) return;
        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('document', documentForm.selectedFile);
            formData.append('document_type', documentForm.documentName.trim());
            const response = await apiClient.post('/students/me/documents', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (response.data.success) {
                setUploadSuccess(true);
                fetchProfile();
                setDocumentForm({ documentName: '', selectedFile: null });
                if (fileInputRef.current) fileInputRef.current.value = '';
                setTimeout(() => setUploadSuccess(false), 3000);
            }
        } catch (err) {
            setUploadError('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    // --- Password Handlers ---
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setUploadError('New passwords do not match');
            setTimeout(() => setUploadError(null), 3000);
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            setUploadError('Password must be at least 6 characters');
            setTimeout(() => setUploadError(null), 3000);
            return;
        }

        try {
            setIsChangingPassword(true);
            const response = await authService.changePassword(
                passwordForm.oldPassword,
                passwordForm.newPassword
            );

            setUploadSuccess('Password changed successfully!');
            setShowPasswordModal(false);
            setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => setUploadSuccess(false), 3000);
        } catch (err) {
            setUploadError(err.response?.data?.message || 'Failed to change password');
            setTimeout(() => setUploadError(null), 3000);
        } finally {
            setIsChangingPassword(false);
        }
    };

    // --- Render Helpers ---
    const Toggle = ({ checked, onChange, label, disabled }) => (
        <div
            onClick={() => !disabled && onChange(!checked)}
            className={`flex items-center justify-between group cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <span className="text-xs font-black text-[#002855] group-hover:text-blue-600 transition-colors">{label}</span>
            <button
                type="button"
                className={`relative inline-flex h-6 w-12 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${checked ? 'bg-[#004a99]' : 'bg-gray-200'}`}
            >
                <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-6' : 'translate-x-0'}`}
                />
            </button>
        </div>
    );

    const ScoreRankField = ({ label, score, rank, onScoreChange, onRankChange, isEditing, className = "" }) => (
        <div className={`space-y-1 ${className}`}>
            <span className="text-[10px] font-black text-[#002855] ml-1">{label}</span>
            <div className="flex gap-2 w-full">
                <input
                    type="text"
                    value={score || ''}
                    onChange={(e) => isEditing && onScoreChange(e.target.value)}
                    placeholder="Score"
                    disabled={!isEditing}
                    className="flex-1 min-w-0 bg-white border border-gray-300 rounded-md px-3 py-2 text-xs font-bold outline-none focus:border-blue-600 disabled:bg-gray-50"
                />
                <input
                    type="text"
                    value={rank || ''}
                    onChange={(e) => isEditing && onRankChange(e.target.value)}
                    placeholder="Rank"
                    disabled={!isEditing}
                    className="flex-1 min-w-0 bg-white border border-gray-300 rounded-md px-3 py-2 text-xs font-bold outline-none focus:border-blue-600 disabled:bg-gray-50"
                />
            </div>
        </div>
    );

    const SectionHeader = ({ title, icon: Icon, isEditing, onEdit, onSave, onCancel }) => (
        <div className="bg-gray-50 px-8 py-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
                    <Icon className="text-blue-600 w-5 h-5" />
                </div>
                {title}
            </h3>
            {!isEditing ? (
                <button onClick={onEdit} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-black transition-all shadow-lg shadow-blue-100">
                    Edit Section
                </button>
            ) : (
                <div className="flex gap-3">
                    <button onClick={onCancel} className="px-6 py-2.5 bg-black text-white rounded-xl hover:bg-gray-800 text-sm font-black transition-all">
                        Cancel
                    </button>
                    <button onClick={onSave} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-black transition-all shadow-lg shadow-blue-100">
                        Save
                    </button>
                </div>
            )}
        </div>
    );

    const DataField = ({ label, value, isEditing, onChange, type = "text", placeholder, options, icon: Icon, mono = false, disabled = false, maxHint }) => (
        <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                {label}
            </label>
            {isEditing && !disabled ? (
                options ? (
                    <select
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full bg-white border-2 border-blue-50 rounded-2xl px-5 py-4 text-gray-900 font-bold focus:border-blue-600 outline-none transition-all shadow-sm"
                    >
                        <option value="">Select {label}</option>
                        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                ) : (
                    <div className="relative">
                        <input
                            type={type}
                            value={value || ''}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={placeholder}
                            className={`w-full bg-white border-2 border-blue-50 rounded-2xl px-5 py-4 text-gray-900 font-bold focus:border-blue-600 outline-none transition-all shadow-sm ${mono ? 'font-mono' : ''}`}
                        />
                        {maxHint && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[8px] font-black text-gray-300 uppercase">max {maxHint}</span>}
                    </div>
                )
            ) : (
                <div className={`bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-gray-900 font-bold shadow-sm min-h-[58px] flex items-center ${mono ? 'font-mono' : ''} ${disabled ? 'opacity-60 grayscale' : ''}`}>
                    {value || <span className="text-gray-300 italic font-medium">Not Provided</span>}
                </div>
            )}
        </div>
    );

    if (loading && !studentData) return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
    );

    if (error) return (
        <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50 p-6 text-center">
            <h2 className="text-2xl font-black text-gray-900 mb-2">{error}</h2>
            <button onClick={() => navigate('/dashboard')} className="mt-4 px-8 py-3 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-100 transition-all">
                Return to Dashboard
            </button>
        </div>
    );

    return (
        <div className="max-w-[1500px] mx-auto space-y-10">

            {/* --- Top Bar --- */}
            <div className="flex items-center justify-between pb-2">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-3 px-6 py-3 bg-white text-gray-700 rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-all font-black text-sm"
                >
                    <ChevronLeft className="w-5 h-5" />
                    Back to Dashboard
                </button>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Status</span>
                    <span className="text-green-600 font-black text-sm uppercase">Active Profile</span>
                </div>
            </div>

            {/* --- Sticky Navigation --- */}
            <div className="sticky top-0 z-40 -mx-4 px-4 py-2 bg-gray-50/80 backdrop-blur-xl border-b border-gray-200/50">
                <div className="bg-white/90 p-1.5 rounded-2xl border border-gray-200 shadow-xl shadow-gray-200/50 max-w-4xl mx-auto flex overflow-x-auto no-scrollbar gap-1">
                    {[
                        { id: "profile", label: "Overview", ref: profileRef },
                        { id: "general", label: "Personal", ref: generalRef },
                        { id: "education", label: "Academic", ref: educationRef },
                        { id: "testScores", label: "Tests", ref: testScoresRef },
                        { id: "backgroundInfo", label: "Background", ref: backgroundRef },
                        { id: "uploadDocs", label: "Docs", ref: uploadRef },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabClick(tab.id, tab.ref)}
                            className={`whitespace-nowrap flex-1 px-6 py-3 rounded-xl text-sm font-black transition-all ${activeTab === tab.id
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-100 scale-105"
                                : "text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* --- Sidebar: Profile Card --- */}
                <div ref={profileRef} className="lg:col-span-4 sticky top-20 w-full">
                    <div className="bg-white rounded-2xl shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden w-full">
                        <div className="h-28 bg-gradient-to-br from-blue-600 to-indigo-700"></div>
                        <div className="px-8 pb-10">
                            <div className="relative flex justify-center -mt-12 mb-6">
                                <div className="p-2 bg-white rounded-2xl shadow-2xl">
                                    <div className="bg-blue-50 rounded-xl p-4">
                                        <UserCircle2 className="w-20 h-20 text-blue-600" />
                                    </div>
                                </div>
                            </div>
                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                                    {studentData.firstName} {studentData.lastName}
                                </h2>
                                <p className="text-gray-400 font-bold text-xs lowercase">{studentData.email}</p>
                            </div>

                            <div className="mt-2 space-y-6 border-t border-gray-50 pt-4">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <Phone className="w-3 h-3 text-blue-500" /> Contact Number
                                    </span>
                                    <p className="text-gray-900 font-black text-lg">+{studentData.countryCode} {studentData.phone}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Gender</span>
                                        <p className="text-gray-900 font-black text-sm">{studentData.gender}</p>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</span>
                                        <p className="text-gray-900 font-black text-sm">Standard</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowPasswordModal(true)}
                                className="mt-2 w-full flex items-center justify-center gap-3 px-6 py-4 bg-gray-50 text-gray-700 rounded-2xl font-black hover:bg-gray-100 transition-all border border-gray-200 text-sm"
                            >
                                <Lock className="w-5 h-5 text-blue-600" /> Change Password
                            </button>
                            <button onClick={() => navigate('/dashboard')} className="mt-2 w-full flex items-center justify-center gap-3 px-6 py-4 bg-gray-50 text-gray-700 rounded-2xl font-black hover:bg-gray-100 transition-all border border-gray-200 text-sm">
                                <LogOut className="w-5 h-5" /> Sign Out Portal
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- Main Content --- */}
                <div className="lg:col-span-8 flex flex-col gap-12">

                    {/* General Information */}
                    <section ref={generalRef} className="scroll-mt-32">
                        <div className="bg-white rounded-2xl shadow-2xl shadow-gray-200/50 border border-gray-50 overflow-hidden">
                            <SectionHeader
                                title="Personal Profile"
                                icon={User}
                                isEditing={editMode.general}
                                onEdit={() => handleEditToggle('general')}
                                onSave={() => handleSaveEdit('general')}
                                onCancel={() => handleCancelEdit('general')}
                            />
                            <div className="p-10 space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <DataField label="First Name" value={editMode.general ? editData.firstName : studentData.firstName} isEditing={editMode.general} onChange={(v) => handleFieldChange('firstName', v)} />
                                    <DataField label="Last Name" value={editMode.general ? editData.lastName : studentData.lastName} isEditing={editMode.general} onChange={(v) => handleFieldChange('lastName', v)} />
                                    <DataField label="Email Address" value={studentData.email} disabled={true} icon={Mail} />
                                    <div className="grid grid-cols-4 gap-4">
                                        <div className="col-span-1">
                                            <DataField label="Code" value={editMode.general ? editData.countryCode : studentData.countryCode} isEditing={editMode.general} onChange={(v) => handleFieldChange('countryCode', v)} />
                                        </div>
                                        <div className="col-span-3">
                                            <DataField label="Phone Number" value={editMode.general ? editData.phone : studentData.phone} isEditing={editMode.general} onChange={(v) => handleFieldChange('phone', v)} mono={true} />
                                        </div>
                                    </div>
                                    <DataField label="Father Name" value={editMode.general ? editData.fatherName : studentData.fatherName} isEditing={editMode.general} onChange={(v) => handleFieldChange('fatherName', v)} />
                                    <DataField label="Mother Name" value={editMode.general ? editData.motherName : studentData.motherName} isEditing={editMode.general} onChange={(v) => handleFieldChange('motherName', v)} />
                                    <DataField label="Nationality" value={editMode.general ? editData.nationality : studentData.nationality} options={["INDIA", "USA", "UK", "CANADA"]} isEditing={editMode.general} onChange={(v) => handleFieldChange('nationality', v)} />
                                    <DataField label="Gender" value={editMode.general ? editData.gender : studentData.gender} options={["Male", "Female", "Other"]} isEditing={editMode.general} onChange={(v) => handleFieldChange('gender', v)} />
                                </div>
                                <div className="pt-10 border-t border-gray-50 transition-all">
                                    <h4 className="flex items-center gap-3 text-lg font-black text-gray-900 mb-8">
                                        <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                                        Passport & Address Details
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        <DataField label="Passport Number" value={editMode.general ? editData.passportNumber : studentData.passportNumber} isEditing={editMode.general} onChange={(v) => handleFieldChange('passportNumber', v)} mono={true} />
                                        <DataField label="Passport Expiry" value={editMode.general ? editData.passportExpiry : studentData.passportExpiry} isEditing={editMode.general} onChange={(v) => handleFieldChange('passportExpiry', v)} type="date" />
                                        <DataField label="City" value={editMode.general ? editData.city : studentData.city} isEditing={editMode.general} onChange={(v) => handleFieldChange('city', v)} />
                                    </div>
                                    <div className="mt-8">
                                        <DataField label="Full Home Address" value={editMode.general ? editData.address : studentData.address} isEditing={editMode.general} onChange={(v) => handleFieldChange('address', v)} icon={MapPin} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Academic Section */}
                    <section ref={educationRef} className="scroll-mt-32">
                        <div className="bg-white rounded-2xl shadow-2xl shadow-gray-200/50 border border-gray-50 overflow-hidden">
                            <SectionHeader
                                title="Academic Background"
                                icon={GraduationCap}
                                isEditing={editMode.education}
                                onEdit={() => handleEditToggle('education')}
                                onSave={() => handleSaveEdit('education')}
                                onCancel={() => handleCancelEdit('education')}
                            />
                            <div className="p-10 space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <DataField label="Academic Level" value={editMode.education ? editData.academicLevel : studentData.academicLevel} options={["High School", "Diploma", "Under-Graduate", "Post-Graduate"]} isEditing={editMode.education} onChange={(v) => handleFieldChange('academicLevel', v)} />
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Grade Average / Score</label>
                                        <div className="bg-indigo-50 border-2 border-indigo-100 rounded-2xl px-6 py-4 flex items-center justify-between">
                                            <span className="text-2xl font-black text-indigo-700 font-mono tracking-tighter">
                                                {editMode.education ? (
                                                    <input type="text" value={editData.gradeAverage} onChange={(e) => handleFieldChange('gradeAverage', e.target.value)} className="bg-transparent border-none text-right outline-none w-20" />
                                                ) : (studentData.gradeAverage || "0.0")}
                                            </span>
                                            <Award className="w-5 h-5 text-indigo-400" />
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-10 border-t border-gray-50">
                                    <div className="flex items-center justify-between mb-8">
                                        <h4 className="flex items-center gap-3 text-lg font-black text-gray-900">
                                            <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                                            Institutions Attended
                                        </h4>
                                        {editMode.education && (
                                            <button onClick={() => setEditData(p => ({ ...p, schoolsAttended: [...(p.schoolsAttended || []), { institutionName: '', degreeName: '', fromMonthYear: '', toMonthYear: '' }] }))} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase shadow-lg shadow-indigo-100">+ Add Institution</button>
                                        )}
                                    </div>
                                    <div className="space-y-6">
                                        {(editMode.education ? editData.schoolsAttended : studentData.schoolsAttended)?.map((school, idx) => (
                                            <div key={idx} className="bg-gray-50 border border-gray-100 rounded-2xl p-8 relative flex flex-col md:flex-row gap-8 hover:bg-white hover:shadow-xl transition-all duration-300">
                                                <div className="w-16 h-16 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
                                                    <GraduationCap className="w-8 h-8" />
                                                </div>
                                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <DataField label="Institution" value={school.institutionName} isEditing={editMode.education} onChange={(v) => { const u = [...editData.schoolsAttended]; u[idx].institutionName = v; handleFieldChange('schoolsAttended', u); }} />
                                                    <DataField label="Degree/Course" value={school.degreeName} isEditing={editMode.education} onChange={(v) => { const u = [...editData.schoolsAttended]; u[idx].degreeName = v; handleFieldChange('schoolsAttended', u); }} />
                                                    <DataField label="From (MM/YY)" value={school.fromMonthYear} isEditing={editMode.education} onChange={(v) => { const u = [...editData.schoolsAttended]; u[idx].fromMonthYear = v; handleFieldChange('schoolsAttended', u); }} mono={true} />
                                                    <DataField label="To (MM/YY)" value={school.toMonthYear} isEditing={editMode.education} onChange={(v) => { const u = [...editData.schoolsAttended]; u[idx].toMonthYear = v; handleFieldChange('schoolsAttended', u); }} mono={true} />
                                                </div>
                                                {editMode.education && (
                                                    <button onClick={() => { const u = [...editData.schoolsAttended]; u.splice(idx, 1); handleFieldChange('schoolsAttended', u); }} className="absolute顶-6 right-8 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-5 h-5" /></button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Test Scores */}
                    <section ref={testScoresRef} className="scroll-mt-32">
                        <div className="bg-white rounded-2xl shadow-2xl shadow-gray-200/50 border border-gray-50 overflow-hidden">
                            <SectionHeader
                                title="Standardized Test Scores"
                                icon={Award}
                                isEditing={editMode.testScores}
                                onEdit={() => handleEditToggle('testScores')}
                                onSave={() => handleSaveEdit('testScores')}
                                onCancel={() => handleCancelEdit('testScores')}
                            />
                            <div className="p-10 space-y-12">
                                <div className="space-y-8">
                                    <h4 className="flex items-center gap-3 text-lg font-black text-gray-900">
                                        <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                                        Language Proficiency
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                                        <div className="col-span-2"><DataField label="Exam Type" value={editMode.testScores ? editData.examType : studentData.examType} options={["IELTS", "TOEFL", "PTE", "Duolingo"]} isEditing={editMode.testScores} onChange={(v) => handleFieldChange('examType', v)} /></div>
                                        <div className="col-span-2"><DataField label="Date" type="date" value={editMode.testScores ? editData.examDate : studentData.examDate} isEditing={editMode.testScores} onChange={(v) => handleFieldChange('examDate', v)} /></div>
                                        <DataField label="Listening" value={editMode.testScores ? editData.listeningScore : studentData.listeningScore} isEditing={editMode.testScores} onChange={(v) => handleFieldChange('listeningScore', v)} mono={true} />
                                        <DataField label="Reading" value={editMode.testScores ? editData.readingScore : studentData.readingScore} isEditing={editMode.testScores} onChange={(v) => handleFieldChange('readingScore', v)} mono={true} />
                                        <DataField label="Writing" value={editMode.testScores ? editData.writingScore : studentData.writingScore} isEditing={editMode.testScores} onChange={(v) => handleFieldChange('writingScore', v)} mono={true} />
                                        <DataField label="Speaking" value={editMode.testScores ? editData.speakingScore : studentData.speakingScore} isEditing={editMode.testScores} onChange={(v) => handleFieldChange('speakingScore', v)} mono={true} />
                                        <div className="col-span-2 bg-blue-600 p-4 rounded-2xl flex flex-col items-center justify-center text-white shadow-xl shadow-blue-100">
                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-70 leading-none">Overall Score</span>
                                            <span className="text-3xl font-black font-mono mt-1">
                                                {editMode.testScores ? (
                                                    <input type="text" value={editData.overallScore} onChange={e => handleFieldChange('overallScore', e.target.value)} className="bg-transparent border-none text-center outline-none w-20" />
                                                ) : (studentData.overallScore || "0.0")}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-10 border-t border-gray-100 space-y-6">
                                    <h4 className="flex items-center gap-3 text-lg font-black text-gray-900 mb-6">
                                        <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                                        Standardized Test Scores
                                    </h4>
                                    <div className="space-y-6">
                                        {['gre', 'gmat', 'sat'].map((exam) => (
                                            <div key={exam} className="bg-white border border-gray-100 rounded-2xl p-8 relative flex flex-col gap-8 hover:shadow-2xl transition-all duration-500 overflow-hidden group">
                                                <div className="space-y-6">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className="p-3 bg-blue-50 rounded-xl text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                                                                <Award className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <h5 className="font-black text-gray-900 uppercase tracking-widest text-[10px] opacity-40 leading-none mb-1">Standardized Test</h5>
                                                                <h6 className="font-black text-gray-900 text-lg uppercase">{exam}</h6>
                                                            </div>
                                                        </div>
                                                        <Toggle
                                                            label={`I Have ${exam.toUpperCase()} Exam Scores`}
                                                            checked={editMode.testScores ? editData.additionalQualifications[exam].hasExam : studentData.additionalQualifications[exam].hasExam}
                                                            disabled={!editMode.testScores}
                                                            onChange={(checked) => {
                                                                setEditData(prev => ({
                                                                    ...prev,
                                                                    additionalQualifications: {
                                                                        ...prev.additionalQualifications,
                                                                        [exam]: {
                                                                            ...prev.additionalQualifications[exam],
                                                                            hasExam: checked
                                                                        }
                                                                    }
                                                                }));
                                                            }}
                                                        />
                                                    </div>

                                                    {(editMode.testScores ? editData.additionalQualifications[exam].hasExam : studentData.additionalQualifications[exam].hasExam) && (
                                                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                                            {exam === 'gre' && (
                                                                <div className="space-y-6 mb-6">
                                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                                        <div className="flex flex-col gap-1">
                                                                            <span className="text-[10px] font-black text-[#002855] ml-1">Date of Exam</span>
                                                                            <input
                                                                                type="date"
                                                                                value={editMode.testScores ? editData.additionalQualifications.gre.examDate : studentData.additionalQualifications.gre.examDate}
                                                                                onChange={e => setEditData(prev => ({ ...prev, additionalQualifications: { ...prev.additionalQualifications, gre: { ...prev.additionalQualifications.gre, examDate: e.target.value } } }))}
                                                                                disabled={!editMode.testScores}
                                                                                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-xs font-bold outline-none focus:border-blue-600 disabled:bg-gray-50 h-[38px]"
                                                                            />
                                                                        </div>
                                                                        <div className="flex flex-col gap-1">
                                                                            <span className="text-[10px] font-black text-[#002855] ml-1">Verbal Score</span>
                                                                            <input
                                                                                type="text"
                                                                                placeholder="Score"
                                                                                value={editMode.testScores ? editData.additionalQualifications.gre.verbalScore : studentData.additionalQualifications.gre.verbalScore}
                                                                                onChange={e => setEditData(p => ({ ...p, additionalQualifications: { ...p.additionalQualifications, gre: { ...p.additionalQualifications.gre, verbalScore: e.target.value } } }))}
                                                                                disabled={!editMode.testScores}
                                                                                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-xs font-bold outline-none focus:border-blue-600 disabled:bg-gray-50"
                                                                            />
                                                                        </div>
                                                                        <div className="flex flex-col gap-1">
                                                                            <span className="text-[10px] font-black text-[#002855] ml-1">Verbal Rank</span>
                                                                            <input
                                                                                type="text"
                                                                                placeholder="Rank"
                                                                                value={editMode.testScores ? editData.additionalQualifications.gre.verbalRank : studentData.additionalQualifications.gre.verbalRank}
                                                                                onChange={e => setEditData(p => ({ ...p, additionalQualifications: { ...p.additionalQualifications, gre: { ...p.additionalQualifications.gre, verbalRank: e.target.value } } }))}
                                                                                disabled={!editMode.testScores}
                                                                                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-xs font-bold outline-none focus:border-blue-600 disabled:bg-gray-50"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                                                        <div className="flex flex-col gap-1">
                                                                            <span className="text-[10px] font-black text-[#002855] ml-1">Quant Score</span>
                                                                            <input type="text" placeholder="Score" value={editMode.testScores ? editData.additionalQualifications.gre.quantScore : studentData.additionalQualifications.gre.quantScore} onChange={e => setEditData(p => ({ ...p, additionalQualifications: { ...p.additionalQualifications, gre: { ...p.additionalQualifications.gre, quantScore: e.target.value } } }))} disabled={!editMode.testScores} className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-xs font-bold outline-none focus:border-blue-600 disabled:bg-gray-50" />
                                                                        </div>
                                                                        <div className="flex flex-col gap-1">
                                                                            <span className="text-[10px] font-black text-[#002855] ml-1">Quant Rank</span>
                                                                            <input type="text" placeholder="Rank" value={editMode.testScores ? editData.additionalQualifications.gre.quantRank : studentData.additionalQualifications.gre.quantRank} onChange={e => setEditData(p => ({ ...p, additionalQualifications: { ...p.additionalQualifications, gre: { ...p.additionalQualifications.gre, quantRank: e.target.value } } }))} disabled={!editMode.testScores} className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-xs font-bold outline-none focus:border-blue-600 disabled:bg-gray-50" />
                                                                        </div>
                                                                        <div className="flex flex-col gap-1">
                                                                            <span className="text-[10px] font-black text-[#002855] ml-1">Writing Score</span>
                                                                            <input type="text" placeholder="Score" value={editMode.testScores ? editData.additionalQualifications.gre.writingScore : studentData.additionalQualifications.gre.writingScore} onChange={e => setEditData(p => ({ ...p, additionalQualifications: { ...p.additionalQualifications, gre: { ...p.additionalQualifications.gre, writingScore: e.target.value } } }))} disabled={!editMode.testScores} className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-xs font-bold outline-none focus:border-blue-600 disabled:bg-gray-50" />
                                                                        </div>
                                                                        <div className="flex flex-col gap-1">
                                                                            <span className="text-[10px] font-black text-[#002855] ml-1">Writing Rank</span>
                                                                            <input type="text" placeholder="Rank" value={editMode.testScores ? editData.additionalQualifications.gre.writingRank : studentData.additionalQualifications.gre.writingRank} onChange={e => setEditData(p => ({ ...p, additionalQualifications: { ...p.additionalQualifications, gre: { ...p.additionalQualifications.gre, writingRank: e.target.value } } }))} disabled={!editMode.testScores} className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-xs font-bold outline-none focus:border-blue-600 disabled:bg-gray-50" />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {exam === 'gmat' && (
                                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-x-8 gap-y-6 mb-6">
                                                                    <div className="flex flex-col gap-1">
                                                                        <span className="text-[10px] font-black text-[#002855] ml-1">Date of Exam</span>
                                                                        <input
                                                                            type="date"
                                                                            value={editMode.testScores ? editData.additionalQualifications.gmat.examDate : studentData.additionalQualifications.gmat.examDate}
                                                                            onChange={e => setEditData(prev => ({ ...prev, additionalQualifications: { ...prev.additionalQualifications, gmat: { ...prev.additionalQualifications.gmat, examDate: e.target.value } } }))}
                                                                            disabled={!editMode.testScores}
                                                                            className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-xs font-bold outline-none focus:border-blue-600 disabled:bg-gray-50 h-[38px]"
                                                                        />
                                                                    </div>
                                                                    <ScoreRankField label="Total GMAT" score={editMode.testScores ? editData.additionalQualifications.gmat.totalScore : studentData.additionalQualifications.gmat.totalScore} rank={editMode.testScores ? editData.additionalQualifications.gmat.totalRank : studentData.additionalQualifications.gmat.totalRank} isEditing={editMode.testScores} onScoreChange={v => setEditData(p => ({ ...p, additionalQualifications: { ...p.additionalQualifications, gmat: { ...p.additionalQualifications.gmat, totalScore: v } } }))} onRankChange={v => setEditData(p => ({ ...p, additionalQualifications: { ...p.additionalQualifications, gmat: { ...p.additionalQualifications.gmat, totalRank: v } } }))} />
                                                                    <ScoreRankField label="Verbal" score={editMode.testScores ? editData.additionalQualifications.gmat.verbalScore : studentData.additionalQualifications.gmat.verbalScore} rank={editMode.testScores ? editData.additionalQualifications.gmat.verbalRank : studentData.additionalQualifications.gmat.verbalRank} isEditing={editMode.testScores} onScoreChange={v => setEditData(p => ({ ...p, additionalQualifications: { ...p.additionalQualifications, gmat: { ...p.additionalQualifications.gmat, verbalScore: v } } }))} onRankChange={v => setEditData(p => ({ ...p, additionalQualifications: { ...p.additionalQualifications, gmat: { ...p.additionalQualifications.gmat, verbalRank: v } } }))} />
                                                                    <ScoreRankField label="Quantitative" score={editMode.testScores ? editData.additionalQualifications.gmat.quantScore : studentData.additionalQualifications.gmat.quantScore} rank={editMode.testScores ? editData.additionalQualifications.gmat.quantRank : studentData.additionalQualifications.gmat.quantRank} isEditing={editMode.testScores} onScoreChange={v => setEditData(p => ({ ...p, additionalQualifications: { ...p.additionalQualifications, gmat: { ...p.additionalQualifications.gmat, quantScore: v } } }))} onRankChange={v => setEditData(p => ({ ...p, additionalQualifications: { ...p.additionalQualifications, gmat: { ...p.additionalQualifications.gmat, quantRank: v } } }))} />
                                                                    <ScoreRankField label="Integrated reasoning" score={editMode.testScores ? editData.additionalQualifications.gmat.irScore : studentData.additionalQualifications.gmat.irScore} rank={editMode.testScores ? editData.additionalQualifications.gmat.irRank : studentData.additionalQualifications.gmat.irRank} isEditing={editMode.testScores} onScoreChange={v => setEditData(p => ({ ...p, additionalQualifications: { ...p.additionalQualifications, gmat: { ...p.additionalQualifications.gmat, irScore: v } } }))} onRankChange={v => setEditData(p => ({ ...p, additionalQualifications: { ...p.additionalQualifications, gmat: { ...p.additionalQualifications.gmat, irRank: v } } }))} />
                                                                </div>
                                                            )}

                                                            {exam === 'sat' && (
                                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                                                    <div className="flex flex-col gap-1">
                                                                        <span className="text-[10px] font-black text-[#002855] ml-1">Date of Exam</span>
                                                                        <input
                                                                            type="date"
                                                                            value={editMode.testScores ? editData.additionalQualifications.sat.examDate : studentData.additionalQualifications.sat.examDate}
                                                                            onChange={e => setEditData(prev => ({ ...prev, additionalQualifications: { ...prev.additionalQualifications, sat: { ...prev.additionalQualifications.sat, examDate: e.target.value } } }))}
                                                                            disabled={!editMode.testScores}
                                                                            className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-xs font-bold outline-none focus:border-blue-600 disabled:bg-gray-50 h-[38px]"
                                                                        />
                                                                    </div>
                                                                    <div className="flex flex-col gap-1">
                                                                        <span className="text-[10px] font-black text-[#002855] ml-1">Reasoning Test Points</span>
                                                                        <input type="text" placeholder="Points" value={editMode.testScores ? editData.additionalQualifications.sat.reasoningPoint : studentData.additionalQualifications.sat.reasoningPoint} onChange={e => setEditData(p => ({ ...p, additionalQualifications: { ...p.additionalQualifications, sat: { ...p.additionalQualifications.sat, reasoningPoint: e.target.value } } }))} disabled={!editMode.testScores} className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-xs font-bold outline-none focus:border-blue-600 disabled:bg-gray-50" />
                                                                    </div>
                                                                    <div className="flex flex-col gap-1">
                                                                        <span className="text-[10px] font-black text-[#002855] ml-1">SAT Subject Test Point</span>
                                                                        <input type="text" placeholder="Points" value={editMode.testScores ? editData.additionalQualifications.sat.subjectTestPoint : studentData.additionalQualifications.sat.subjectTestPoint} onChange={e => setEditData(p => ({ ...p, additionalQualifications: { ...p.additionalQualifications, sat: { ...p.additionalQualifications.sat, subjectTestPoint: e.target.value } } }))} disabled={!editMode.testScores} className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-xs font-bold outline-none focus:border-blue-600 disabled:bg-gray-50" />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {editMode.testScores && (
                                                        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                                                            <button onClick={() => handleSaveEdit('testScores')} className="px-5 py-2 bg-[#004a99] text-white rounded-md text-xs font-black hover:bg-blue-800 transition-all">Save</button>
                                                            <button onClick={() => handleCancelEdit('testScores')} className="px-5 py-2 bg-black text-white rounded-md text-xs font-black hover:bg-gray-800 transition-all">Cancel</button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Background */}
                    <section ref={backgroundRef} className="scroll-mt-32">
                        <div className="bg-white rounded-2xl shadow-2xl shadow-gray-200/50 border border-gray-50 overflow-hidden">
                            <SectionHeader title="Global Background" icon={Globe} isEditing={editMode.background} onEdit={() => handleEditToggle('background')} onSave={() => handleSaveEdit('background')} onCancel={() => handleCancelEdit('background')} />
                            <div className="p-10 space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="p-6 bg-red-50/50 border-2 border-red-50 rounded-2xl">
                                        <DataField label="Visa Refusal Record" value={studentData.visaRefusal} options={["YES", "NO"]} isEditing={editMode.background} onChange={v => handleFieldChange('visaRefusal', v)} />
                                    </div>
                                    <div className="p-6 bg-blue-50/50 border-2 border-blue-50 rounded-2xl">
                                        <DataField label="Study Permit History" value={studentData.studyPermit} options={["YES", "NO"]} isEditing={editMode.background} onChange={v => handleFieldChange('studyPermit', v)} />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Detailed Background Narrative</label>
                                    <DataField label="" value={studentData.backgroundDetails} isEditing={editMode.background} onChange={v => handleFieldChange('backgroundDetails', v)} placeholder="Provide context on your academic or visa history..." />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Documents */}
                    <section ref={uploadRef} className="scroll-mt-32 pb-20">
                        <div className="bg-white rounded-2xl shadow-2xl shadow-gray-200/50 border border-gray-50 overflow-hidden">
                            <div className="bg-gray-50 px-8 py-5 border-b border-gray-100">
                                <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
                                        <FileText className="text-blue-600 w-5 h-5" />
                                    </div>
                                    Secure Document Vault
                                </h3>
                            </div>
                            <div className="p-10 space-y-10">
                                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-10 group/upload hover:bg-blue-50/10 transition-all">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Document Label</label>
                                            <input
                                                type="text"
                                                value={documentForm.documentName}
                                                onChange={(e) => setDocumentForm(v => ({ ...v, documentName: e.target.value }))}
                                                className="w-full bg-white border-2 border-blue-50 rounded-2xl px-6 py-4 text-gray-900 font-bold focus:border-blue-600 outline-none transition-all shadow-sm"
                                                placeholder="e.g. Passport, Degree"
                                            />
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="flex-1">
                                                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
                                                <button onClick={() => fileInputRef.current.click()} className="w-full h-[62px] bg-white border-2 border-gray-100 rounded-2xl text-xs font-black uppercase hover:border-blue-300 transition-all shadow-sm">{documentForm.selectedFile ? "File selected" : "Select File"}</button>
                                            </div>
                                            <button onClick={handleUploadSubmit} disabled={uploading} className="w-40 h-[62px] bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-50">Upload</button>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {studentData.documents?.map((doc, idx) => (
                                        <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col gap-6 hover:shadow-2xl transition-all duration-500 relative border-l-4 border-l-blue-600 shadow-sm">
                                            {doc.verified && <CheckCircle2 className="w-4 h-4 text-green-500 absolute top-4 right-4" />}
                                            <div>
                                                <h6 className="font-black text-gray-900 text-lg truncate leading-none">{doc.documentName}</h6>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">{doc.documentType}</p>
                                            </div>
                                            <a href={doc.documentUrl} target="_blank" rel="noreferrer" className="w-full py-3 bg-gray-50 text-gray-700 rounded-xl font-black text-[10px] uppercase text-center border border-gray-100 hover:bg-gray-100 transition-all">View Document</a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div >

            {/* Notifications */}
            {
                (uploadSuccess || uploadError) && (
                    <div className="fixed bottom-10 right-10 z-[100] animate-in slide-in-from-right-10 duration-500">
                        <div className={`px-8 py-5 rounded-2xl shadow-2xl border font-black text-sm uppercase tracking-tight flex items-center gap-4 ${uploadSuccess ? 'bg-black text-white border-black' : 'bg-red-600 text-white border-red-600'}`}>
                            {uploadSuccess ? <CheckCircle2 className="w-6 h-6 text-green-400" /> : <Lock className="w-6 h-6" />}
                            {uploadSuccess || uploadError}
                        </div>
                    </div>
                )
            }

            {/* Change Password Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-0">
                    <div
                        className="absolute inset-0 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300"
                        onClick={() => !isChangingPassword && setShowPasswordModal(false)}
                    ></div>
                    <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 px-10 py-12 text-white relative">
                            <button
                                onClick={() => setShowPasswordModal(false)}
                                className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-xl">
                                <Lock className="w-8 h-8" />
                            </div>
                            <h3 className="text-3xl font-black tracking-tight leading-tight">Update Your Password</h3>
                            <p className="text-blue-100 font-bold text-sm mt-3 opacity-80">Keep your account secure with a strong password.</p>
                        </div>

                        <form onSubmit={handlePasswordSubmit} className="p-10 space-y-8">
                            <div className="space-y-6">
                                {/* Old Password */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Current Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.old ? "text" : "password"}
                                            required
                                            value={passwordForm.oldPassword}
                                            onChange={(e) => setPasswordForm(p => ({ ...p, oldPassword: e.target.value }))}
                                            className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl px-6 py-4 text-gray-900 font-bold focus:border-blue-600 focus:bg-white outline-none transition-all"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords(p => ({ ...p, old: !p.old }))}
                                            className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                                        >
                                            {showPasswords.old ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* New Password */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.new ? "text" : "password"}
                                            required
                                            value={passwordForm.newPassword}
                                            onChange={(e) => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                                            className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl px-6 py-4 text-gray-900 font-bold focus:border-blue-600 focus:bg-white outline-none transition-all"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords(p => ({ ...p, new: !p.new }))}
                                            className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                                        >
                                            {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm New Password */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Confirm New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.confirm ? "text" : "password"}
                                            required
                                            value={passwordForm.confirmPassword}
                                            onChange={(e) => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
                                            className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl px-6 py-4 text-gray-900 font-bold focus:border-blue-600 focus:bg-white outline-none transition-all"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords(p => ({ ...p, confirm: !p.confirm }))}
                                            className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                                        >
                                            {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isChangingPassword}
                                className="w-full h-[62px] bg-blue-600 text-white rounded-2xl font-black shadow-2xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {isChangingPassword ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                ) : "Update Password"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div >
    );
};

export default StudentProfile;
