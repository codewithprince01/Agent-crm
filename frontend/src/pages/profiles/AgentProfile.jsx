import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    User, UserCircle2, Home, ChevronLeft, Mail, Calendar,
    Briefcase, Phone, MapPin, Building, Shield, Globe,
    Users, TrendingUp, Award, FileText, CheckCircle2,
    XCircle, Clock, Save, Edit2, X, Upload, ExternalLink
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import agentService from '../../services/agentService';
import { useToast } from '../../components/ui/toast';

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

const SectionHeader = ({ title, icon: Icon }) => (
    <div className="bg-gray-100/50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Icon className="text-blue-600 w-5 h-5" />
            {title}
        </h3>
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

    const handleScroll = () => {
        const scrollPosition = window.scrollY + 200;
        for (const [section, ref] of Object.entries(sectionRefs)) {
            if (ref.current &&
                scrollPosition >= ref.current.offsetTop &&
                scrollPosition < ref.current.offsetTop + ref.current.offsetHeight) {
                setActiveSection(section);
                break;
            }
        }
    };

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (sectionId) => {
        const element = sectionRefs[sectionId].current;
        if (element) {
            const offset = 100;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;
            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
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
                    Back to Dashboard
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
            <div className="sticky top-0 z-40 -mx-4 px-4 py-2 bg-gray-50/80 backdrop-blur-xl border-b border-gray-200/50">
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
                {/* Left Sidebar Card */}
                <div ref={sectionRefs.overview} className="lg:col-span-4 sticky top-20 w-full space-y-6">
                    <div className="bg-white rounded-2xl shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden w-full">
                        <div className="h-32 bg-gradient-to-br from-blue-600 to-indigo-700 relative">
                            <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]"></div>
                        </div>
                        <div className="px-6 pb-8 relative">
                            <div className="flex justify-center -mt-16 mb-4">
                                <div className="p-1.5 bg-white rounded-full shadow-md">
                                    <div className="w-28 h-28 bg-blue-50 rounded-full flex items-center justify-center border-4 border-white overflow-hidden">
                                        {agentData?.profileImage ? (
                                            <img src={agentData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <UserCircle2 className="w-16 h-16 text-blue-500" />
                                        )}
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
                        <div className="bg-gray-100/50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <FileText className="text-blue-600 w-5 h-5" />
                                Verification Vault
                            </h3>
                            <button
                                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium transition-colors shadow-sm"
                            >
                                <Upload className="w-3.5 h-3.5" />
                                Upload New
                            </button>
                        </div>
                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(!agentData?.documents || agentData.documents.length === 0) ? (
                                    <div className="md:col-span-2 py-10 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                        <FileText className="w-12 h-12 mb-2 opacity-20" />
                                        <p className="font-medium">No documents uploaded</p>
                                        <p className="text-xs">Upload company registration or ID proof</p>
                                    </div>
                                ) : (
                                    agentData.documents.map((doc, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-700 truncate max-w-[150px]">{doc.name}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{doc.type || 'Document'}</p>
                                                </div>
                                            </div>
                                            <a
                                                href={doc.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgentProfile;
