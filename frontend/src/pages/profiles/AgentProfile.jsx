import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    User, UserCircle2, Home, ChevronLeft, Mail, Calendar,
    Briefcase, Phone, MapPin, Building, Shield, Globe,
    Users, TrendingUp, Award, FileText, CheckCircle2,
    XCircle, Clock, Save, Edit2, X, Upload, ExternalLink, AlertCircle
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import agentService from '../../services/agentService';
import { useToast } from '../../components/ui/toast';
import AgentDocumentUpload from '../../components/agents/AgentDocumentUpload';

const DataField = ({ label, value, isEditing, onChange, type = "text", placeholder, options, icon: Icon, mono = false, disabled = false, maxHint }) => (
    <div className="space-y-1">
        <label className="text-xs font-semibold text-gray-700 ml-1">
            {label}
        </label>
        {isEditing && !disabled ? (
            options ? (
                <select
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                >
                    <option value="">Select {label}</option>
                    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            ) : type === 'textarea' ? (
                <div className="relative">
                    <textarea
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        rows={4}
                        className={`w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors ${mono ? 'font-mono' : ''}`}
                    />
                    {maxHint && <span className="absolute right-3 bottom-3 text-xs text-gray-400">max {maxHint}</span>}
                </div>
            ) : (
                <div className="relative">
                    <input
                        type={type}
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        className={`w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors ${mono ? 'font-mono' : ''}`}
                    />
                    {maxHint && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">max {maxHint}</span>}
                </div>
            )
        ) : (
            <div className={`bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 w-full flex items-center ${mono ? 'font-mono' : ''} ${disabled ? 'opacity-60' : ''} ${type === 'textarea' ? 'min-h-[100px] items-start whitespace-pre-wrap' : ''}`}>
                {value || <span className="text-gray-400 italic">Not Provided</span>}
            </div>
        )}
    </div>
);

const SectionHeader = ({ title, icon: Icon, isEditing, onEdit, onSave, onCancel }) => (
    <div className="bg-gray-100/50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Icon className="text-blue-600 w-5 h-5" />
            {title}
        </h3>
        {onEdit && (
            <div className="flex gap-2">
                {isEditing ? (
                    <>
                        <button onClick={onSave} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                            <Save className="w-4 h-4" />
                        </button>
                        <button onClick={onCancel} className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                            <X className="w-4 h-4" />
                        </button>
                    </>
                ) : (
                    <button onClick={onEdit} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                        <Edit2 className="w-4 h-4" />
                    </button>
                )}
            </div>
        )}
    </div>
);

const AgentProfile = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const toast = useToast();
    const [agentData, setAgentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState('overview');
    const [editMode, setEditMode] = useState({});
    const [editData, setEditData] = useState({});
    const [missingDocs, setMissingDocs] = useState([]);

    // Refs for scrolling
    const sectionRefs = {
        overview: useRef(null),
        company: useRef(null),
        business: useRef(null),
        expertise: useRef(null),
        documents: useRef(null)
    };

    useEffect(() => {
        const userId = user?.id || user?._id;
        if (userId) {
            fetchAgentProfile(userId);
        }
    }, [user?.id, user?._id]);

    useEffect(() => {
        if (agentData) {
            const requiredDocs = ['idProof', 'companyLicence', 'agentPhoto', 'companyPhoto', 'identityDocument', 'companyRegistration', 'resume'];
            const uploadedDocs = agentData.documents ? Object.keys(agentData.documents).filter(k => agentData.documents[k]) : [];
            const missing = requiredDocs.filter(doc => !uploadedDocs.includes(doc));
            setMissingDocs(missing);
        }
    }, [agentData]);

    const fetchAgentProfile = async (userId) => {
        try {
            setLoading(true);
            const response = await agentService.getAgentById(userId);
            // Support multiple response formats
            const data = response.data?.agent || response.agent || response.data || response;
            setAgentData(data);
        } catch (err) {
            console.error('Error fetching agent profile:', err);
            toast.error('Failed to load profile data');
        } finally {
            setLoading(false);
        }
    };

    // Construct backend URL helper
    const getFullUrl = (url) => {
        if (!url || typeof url !== 'string') return '';
        if (url.startsWith('http')) return url;
        const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '');
        return `${backendUrl}/${url.startsWith('/') ? '' : '/'}${url}`;
    };

    const getScrollContainer = () => {
        // Target the main layout container which has overflow-y-auto
        return document.querySelector('.h-screen.overflow-y-auto') || window;
    };

    const handleScroll = () => {
        const container = getScrollContainer();
        // If container is window, use window.scrollY, else container.scrollTop
        const scrollData = container === window ? window.scrollY : container.scrollTop;
        const scrollPosition = scrollData + 200; // Offset for trigger

        for (const [section, ref] of Object.entries(sectionRefs)) {
            if (ref.current) {
                // For elements within a scrollable container, using offsetTop might be relative to offsetParent.
                // A safer calculation for a scrollable container context:
                // element.getBoundingClientRect().top + container.scrollTop
                // But container is the relative text.
                // Let's stick to simple logic: match against offsetTop if the container is the offsetParent.
                // If the container is position:fixed/relative, it is the offsetParent.
                // The DashboardLayout div doesn't have position relative, so offsetParent might be body.
                // Let's use getBoundingClientRect which is viewport relative.

                // Container Top (viewport relative)
                const containerRect = container === window ? { top: 0 } : container.getBoundingClientRect();
                const elementRect = ref.current.getBoundingClientRect();

                // Element top relative to container
                const relativeTop = elementRect.top - containerRect.top;

                // If the element is near the top of the container (e.g. within 200px)
                if (relativeTop <= 200 && relativeTop > -ref.current.offsetHeight) {
                    setActiveSection(section);
                    break;
                }
            }
        }
    };

    useEffect(() => {
        const container = getScrollContainer();
        container.addEventListener('scroll', handleScroll);
        // Initial check
        handleScroll();
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (sectionId) => {
        const element = sectionRefs[sectionId].current;
        const container = getScrollContainer();

        if (element && container) {
            const offset = 100;
            // For scrollable container:
            if (container !== window) {
                const containerRect = container.getBoundingClientRect();
                const elementRect = element.getBoundingClientRect();
                // Current scroll + distance from container top - offset
                const targetScroll = container.scrollTop + (elementRect.top - containerRect.top) - offset;
                container.scrollTo({
                    top: targetScroll,
                    behavior: "smooth"
                });
            } else {
                const elementPosition = element.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - offset;
                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        }
    };

    const handleEditToggle = (section) => {
        setEditMode(prev => ({ ...prev, [section]: true }));
        setEditData({ ...agentData });
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
            // Use /me endpoint instead of /agents/:id for agent self-updates
            const response = await apiClient.put('/agents/me', editData);
            if (response.data.success) {
                setAgentData(editData);
                setEditMode(prev => ({ ...prev, [section]: false }));
                toast.success('Section updated successfully');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Update failed');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !agentData) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="text-gray-500 font-medium">Loading profile data...</p>
                </div>
            </div>
        );
    }

    if (!agentData) {
        return (
            <div className="flex justify-center items-center min-h-[60vh] bg-gray-50 p-4">
                <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-red-100 max-w-md">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <XCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Failed to Load Profile</h2>
                    <p className="text-gray-500 mb-6 text-sm">We ran into an issue loading your profile data. Please try again or contact support.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all text-sm"
                    >
                        Reload Page
                    </button>
                </div>
            </div>
        );
    }

    const navItems = [
        { id: 'overview', label: 'Overview', icon: User },
        { id: 'company', label: 'Company', icon: Building },
        { id: 'business', label: 'Metrics', icon: TrendingUp },
        { id: 'expertise', label: 'Expertise', icon: Award },
        { id: 'documents', label: 'Documents', icon: FileText },
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-700 border-green-200';
            case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'declined': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="max-w-[1500px] mx-auto space-y-10">
            {/* Top Bar */}
            <div className="flex items-center justify-between pb-2">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-3 px-6 py-3 bg-white text-gray-700 rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-all font-black text-sm"
                >
                    <ChevronLeft className="w-5 h-5" />
                    Back
                </button>
                <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${getStatusColor(agentData?.approvalStatus)}`}>
                        {agentData?.approvalStatus === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                        {agentData?.approvalStatus === 'pending' && <Clock className="w-3 h-3" />}
                        {(agentData?.approvalStatus || 'pending').toUpperCase()}
                    </span>
                </div>
            </div>

            {/* Sticky Navigation */}
            <div className="">
                <div className="bg-white/90 p-1.5 rounded-2xl border border-gray-200 shadow-xl shadow-gray-200/50 max-w-4xl mx-auto flex overflow-x-auto no-scrollbar gap-1">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => scrollToSection(item.id)}
                            className={`whitespace-nowrap flex-1 px-6 py-3 rounded-xl text-sm font-black transition-all ${activeSection === item.id
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 scale-105'
                                : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600'
                                }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Missing Documents Alert - Full Width */}
                {missingDocs.length > 0 && (
                    <div className="lg:col-span-12 mb-2 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="p-2 bg-amber-100 rounded-full text-amber-600 shrink-0">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-amber-900 mb-1">Action Required: Complete Your Profile</h4>
                            <p className="text-sm text-amber-700 mb-2">Your profile is missing the following required documents. Please upload them to ensure your account is verified and approved.</p>
                            <div className="flex flex-wrap gap-2">
                                {missingDocs.map(doc => (
                                    <span key={doc} className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-md border border-amber-200 capitalize">
                                        {doc.replace(/([A-Z])/g, ' $1').trim()}
                                    </span>
                                ))}
                            </div>
                            <button
                                onClick={() => scrollToSection('documents')}
                                className="mt-3 text-sm font-bold text-amber-800 hover:text-amber-900 underline decoration-2 underline-offset-2"
                            >
                                Jump to Documents Section &rarr;
                            </button>
                        </div>
                    </div>
                )}

                {/* Left Sidebar Card */}
                <div ref={sectionRefs.overview} className="lg:col-span-4 sticky top-20 w-full space-y-6">
                    <div className="bg-white rounded-2xl shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden w-full">
                        <div className="h-32 bg-gradient-to-br from-blue-600 to-indigo-700 relative">
                            <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]"></div>
                        </div>
                        <div className="px-6 pb-8 relative">
                            <div className="flex justify-center -mt-16 mb-4">
                                <div className="p-1.5 bg-white rounded-full shadow-md">
                                    <div className="w-28 h-28 bg-blue-50 rounded-full flex items-center justify-center border-4 border-white overflow-hidden relative">
                                        {(() => {
                                            const docs = agentData?.documents || {};
                                            // Find any key that includes 'photo'
                                            const photoKey = Object.keys(docs).find(k => k.toLowerCase().includes('photo') && docs[k]);
                                            const url = photoKey ? docs[photoKey] : null;

                                            if (url) {
                                                return (
                                                    <img
                                                        src={getFullUrl(url)}
                                                        alt="Profile"
                                                        crossOrigin="anonymous"
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.nextSibling.style.display = 'flex';
                                                        }}
                                                    />
                                                );
                                            }
                                            return <UserCircle2 className="w-16 h-16 text-blue-500" />;
                                        })()}
                                        {/* Fallback for image errors */}
                                        <div className="hidden absolute inset-0 items-center justify-center bg-blue-50">
                                            <UserCircle2 className="w-16 h-16 text-blue-500" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="text-center space-y-1">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {agentData?.firstName} {agentData?.lastName}
                                </h2>
                                <p className="text-blue-600 font-medium text-sm">{agentData?.designation || 'Partner Agent'}</p>
                                <div className="flex items-center justify-center gap-2 text-gray-500 text-sm mt-2">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {agentData?.city}, {agentData?.country}
                                </div>
                            </div>

                            <div className="mt-8 space-y-3">
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Email</p>
                                            <p className="text-xs font-semibold text-gray-700 truncate max-w-[150px]">{agentData?.email}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => window.location.href = `mailto:${agentData?.email}`} className="text-blue-600 hover:text-blue-700">
                                        <ExternalLink className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                                            <Phone className="w-4 h-4" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Phone</p>
                                            <p className="text-xs font-semibold text-gray-700 font-mono">{agentData?.phone}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                                            <Building className="w-4 h-4" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Company</p>
                                            <p className="text-xs font-semibold text-gray-700">{agentData?.companyName}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <div className="flex gap-2">
                                    <div className="flex-1 bg-blue-50 p-3 rounded-xl text-center">
                                        <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">ID Status</p>
                                        <p className="text-xs font-bold text-blue-700 mt-1 flex items-center justify-center gap-1">
                                            <Shield className="w-3 h-3" /> Verified
                                        </p>
                                    </div>
                                    <div className="flex-1 bg-emerald-50 p-3 rounded-xl text-center">
                                        <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Type</p>
                                        <p className="text-xs font-bold text-emerald-700 mt-1 capitalize">{agentData?.partnershipType || 'Regular'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity Mini-card (Optional) */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                        <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-600" /> Account History
                        </h4>
                        <div className="space-y-4">
                            <div className="flex gap-3 relative before:absolute before:left-[11px] before:top-6 before:bottom-0 before:w-[1px] before:bg-gray-100">
                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center z-10">
                                    <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                                </div>
                                <div>
                                    <p className="text-[11px] text-gray-400 font-medium">Joined on</p>
                                    <p className="text-xs font-bold text-gray-700">{new Date(agentData?.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center z-10">
                                    <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
                                </div>
                                <div>
                                    <p className="text-[11px] text-gray-400 font-medium">Last Profile Update</p>
                                    <p className="text-xs font-bold text-gray-700">{agentData?.updatedAt ? new Date(agentData.updatedAt).toLocaleDateString() : 'Never'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Content Sections */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Section: Overview */}
                    <div ref={sectionRefs.overview} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <SectionHeader
                            title="Primary Identity"
                            icon={User}
                        />
                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <DataField
                                    label="First Name"
                                    value={editMode.overview ? editData.firstName : agentData.firstName}
                                    isEditing={editMode.overview}
                                    onChange={(v) => handleFieldChange('firstName', v)}
                                />
                                <DataField
                                    label="Last Name"
                                    value={editMode.overview ? editData.lastName : agentData.lastName}
                                    isEditing={editMode.overview}
                                    onChange={(v) => handleFieldChange('lastName', v)}
                                />
                                <DataField
                                    label="Primary Email"
                                    value={editMode.overview ? editData.email : agentData.email}
                                    isEditing={editMode.overview}
                                    onChange={(v) => handleFieldChange('email', v)}
                                    disabled={true}
                                />
                                <DataField
                                    label="Contact Number"
                                    value={editMode.overview ? editData.phone : agentData.phone}
                                    isEditing={editMode.overview}
                                    onChange={(v) => handleFieldChange('phone', v)}
                                    mono={true}
                                />
                                <DataField
                                    label="Job Designation"
                                    value={editMode.overview ? editData.designation : agentData.designation}
                                    isEditing={editMode.overview}
                                    onChange={(v) => handleFieldChange('designation', v)}
                                    placeholder="e.g. Managing Director"
                                />
                                <DataField
                                    label="Experience Level"
                                    value={editMode.overview ? editData.experience : agentData.experience}
                                    isEditing={editMode.overview}
                                    onChange={(v) => handleFieldChange('experience', v)}
                                    placeholder="e.g. 5+ Years"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section: Company */}
                    <div ref={sectionRefs.company} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <SectionHeader
                            title="Corporation Profile"
                            icon={Building}
                        />
                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div className="md:col-span-2">
                                    <DataField
                                        label="Registered Business Name"
                                        value={editMode.company ? editData.companyName : agentData.companyName}
                                        isEditing={editMode.company}
                                        onChange={(v) => handleFieldChange('companyName', v)}
                                    />
                                </div>
                                <DataField
                                    label="Legal Entity Type"
                                    value={editMode.company ? editData.companyType : agentData.companyType}
                                    isEditing={editMode.company}
                                    onChange={(v) => handleFieldChange('companyType', v)}
                                    options={['Private Limited', 'Sole Proprietorship', 'Partnership', 'Registered Trust', 'Other']}
                                />
                                <DataField
                                    label="Registration Number"
                                    value={editMode.company ? editData.registrationNumber : agentData.registrationNumber}
                                    isEditing={editMode.company}
                                    onChange={(v) => handleFieldChange('registrationNumber', v)}
                                    mono={true}
                                />
                                <DataField
                                    label="Founding Year"
                                    value={editMode.company ? editData.establishedYear : agentData.establishedYear}
                                    isEditing={editMode.company}
                                    onChange={(v) => handleFieldChange('establishedYear', v)}
                                    type="number"
                                />
                                <DataField
                                    label="Corporate Website"
                                    value={editMode.company ? editData.website : agentData.website}
                                    isEditing={editMode.company}
                                    onChange={(v) => handleFieldChange('website', v)}
                                    placeholder="https://example.com"
                                />
                                <div className="md:col-span-2">
                                    <DataField
                                        label="Headquarters Address"
                                        value={editMode.company ? editData.address : agentData.address}
                                        isEditing={editMode.company}
                                        onChange={(v) => handleFieldChange('address', v)}
                                        type="textarea"
                                    />
                                </div>
                                <DataField
                                    label="City"
                                    value={editMode.company ? editData.city : agentData.city}
                                    isEditing={editMode.company}
                                    onChange={(v) => handleFieldChange('city', v)}
                                />
                                <DataField
                                    label="State/Province"
                                    value={editMode.company ? editData.state : agentData.state}
                                    isEditing={editMode.company}
                                    onChange={(v) => handleFieldChange('state', v)}
                                />
                                <DataField
                                    label="Zip/Postal Code"
                                    value={editMode.company ? editData.pincode : agentData.pincode}
                                    isEditing={editMode.company}
                                    onChange={(v) => handleFieldChange('pincode', v)}
                                    mono={true}
                                />
                                <DataField
                                    label="Operating Country"
                                    value={editMode.company ? editData.country : agentData.country}
                                    isEditing={editMode.company}
                                    onChange={(v) => handleFieldChange('country', v)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section: Business Metrics */}
                    <div ref={sectionRefs.business} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <SectionHeader
                            title="Commercial Metrics"
                            icon={TrendingUp}
                            isEditing={editMode.business}
                            onEdit={() => handleEditToggle('business')}
                            onSave={() => handleSaveEdit('business')}
                            onCancel={() => handleCancelEdit('business')}
                        />
                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                        <Users className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <DataField
                                            label="Current Active Students"
                                            value={editMode.business ? editData.currentStudents : agentData.currentStudents}
                                            isEditing={editMode.business}
                                            onChange={(v) => handleFieldChange('currentStudents', v)}
                                            placeholder="e.g. 50+"
                                        />
                                    </div>
                                </div>
                                <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                                        <Briefcase className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <DataField
                                            label="Core Team Size"
                                            value={editMode.business ? editData.teamSize : agentData.teamSize}
                                            isEditing={editMode.business}
                                            onChange={(v) => handleFieldChange('teamSize', v)}
                                            placeholder="e.g. 10-20"
                                        />
                                    </div>
                                </div>
                                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                                        <Globe className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <DataField
                                            label="International Reach"
                                            value={agentData?.specialization?.length + " Specialized Regions"}
                                            isEditing={false}
                                            disabled={true}
                                        />
                                    </div>
                                </div>
                                <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                                        <Award className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <DataField
                                            label="Annual Target (Est.)"
                                            value={editMode.business ? editData.expectedStudents : agentData.expectedStudents}
                                            isEditing={editMode.business}
                                            onChange={(v) => handleFieldChange('expectedStudents', v)}
                                            placeholder="Target students/year"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Expertise */}
                    <div ref={sectionRefs.expertise} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <SectionHeader
                            title="Service & Expertise"
                            icon={Award}
                            isEditing={editMode.expertise}
                            onEdit={() => handleEditToggle('expertise')}
                            onSave={() => handleSaveEdit('expertise')}
                            onCancel={() => handleCancelEdit('expertise')}
                        />
                        <div className="p-8">
                            <div className="space-y-6">
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Specialized Destinations</p>
                                    <div className="flex flex-wrap gap-2">
                                        {agentData?.specialization?.map((item, idx) => (
                                            <span key={idx} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-100">
                                                {item}
                                            </span>
                                        )) || <span className="text-gray-400 italic text-sm">No specializations listed</span>}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Services Offered</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {agentData?.servicesOffered?.map((service, idx) => (
                                            <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-700 font-medium">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                {service}
                                            </div>
                                        )) || <span className="text-gray-400 italic text-sm">No services listed</span>}
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-gray-100">
                                    <DataField
                                        label="The Partnership Pitch (Why Partner With Us?)"
                                        value={editMode.expertise ? editData.whyPartner : agentData.whyPartner}
                                        isEditing={editMode.expertise}
                                        onChange={(v) => handleFieldChange('whyPartner', v)}
                                        type="textarea"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Documents */}
                    <div ref={sectionRefs.documents} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <SectionHeader
                            title="Verification Vault"
                            icon={FileText}
                        />
                        <div className="p-8">
                            <AgentDocumentUpload
                                agent={agentData}
                                onUploadSuccess={() => fetchAgentProfile(agentData._id || agentData.id)}
                                isAdmin={false}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgentProfile;
