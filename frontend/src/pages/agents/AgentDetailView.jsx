import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    User, Building, Mail, Phone, Globe, MapPin,
    TrendingUp, Award, FileText, CheckCircle, XCircle, Shield,
    Clock, ExternalLink, CheckCircle2, UserCircle2, Loader2, AlertCircle, ChevronLeft
} from 'lucide-react';
import agentService from '../../services/agentService';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import { useToast } from '../../components/ui/toast';
import AgentDocumentUpload from '../../components/agents/AgentDocumentUpload';

const DataField = ({ label, value, type = "text", icon: Icon, mono = false }) => (
    <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
            {label}
        </label>
        <div className={`bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 w-full flex items-center ${mono ? 'font-mono' : ''} ${type === 'textarea' ? 'min-h-[80px] items-start whitespace-pre-wrap' : ''}`}>
            {value || <span className="text-gray-400 italic">Not Provided</span>}
        </div>
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

const AgentDetailView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const { success, error: showError } = toast;
    const user = useSelector((state) => state.auth.user);
    const [agent, setAgent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeSection, setActiveSection] = useState('overview');
    const [confirmAction, setConfirmAction] = useState({ type: null, isOpen: false });

    const sectionRefs = {
        overview: useRef(null),
        company: useRef(null),
        business: useRef(null),
        expertise: useRef(null),
        documents: useRef(null)
    };

    useEffect(() => {
        fetchAgentDetails();
    }, [id]);

    const fetchAgentDetails = async () => {
        try {
            setLoading(true);
            const response = await agentService.getAgentById(id);
            const agentData = response.data?.agent || response.agent || response.data || response;
            setAgent(agentData);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to load agent details');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async () => {
        try {
            if (confirmAction.type === 'approve') {
                await agentService.approveAgent(id);
                success('Agent approved successfully!');
                fetchAgentDetails();
            } else if (confirmAction.type === 'reject') {
                await agentService.rejectAgent(id);
                success('Agent application declined.');
                fetchAgentDetails();
            }
        } catch (error) {
            console.error(error);
            showError('Failed to process request');
        } finally {
            setConfirmAction({ type: null, isOpen: false, data: null });
        }
    };

    const getScrollContainer = () => {
        return document.querySelector('.h-screen.overflow-y-auto') || window;
    };

    const handleScroll = () => {
        const container = getScrollContainer();
        const scrollData = container === window ? window.scrollY : container.scrollTop;
        const scrollPosition = scrollData + 200;

        for (const [section, ref] of Object.entries(sectionRefs)) {
            if (ref.current) {
                const containerRect = container === window ? { top: 0 } : container.getBoundingClientRect();
                const elementRect = ref.current.getBoundingClientRect();
                const relativeTop = elementRect.top - containerRect.top;

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
        handleScroll();
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (sectionId) => {
        const element = sectionRefs[sectionId].current;
        const container = getScrollContainer();

        if (element && container) {
            const offset = 100;
            if (container !== window) {
                const containerRect = container.getBoundingClientRect();
                const elementRect = element.getBoundingClientRect();
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

    const [missingDocs, setMissingDocs] = useState([]);

    // Construct backend URL helper
    const getFullUrl = (url) => {
        if (!url || typeof url !== 'string') return '';
        if (url.startsWith('http')) return url;
        const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
        return `${backendUrl}/${url}`;
    };

    useEffect(() => {
        if (agent) {
            const requiredDocs = ['idProof', 'companyLicence', 'agentPhoto', 'companyPhoto', 'identityDocument', 'companyRegistration', 'resume'];
            const uploadedDocs = agent.documents ? Object.keys(agent.documents).filter(k => agent.documents[k]) : [];
            const missing = requiredDocs.filter(doc => !uploadedDocs.includes(doc));
            setMissingDocs(missing);
        }
    }, [agent]);

    if (loading && !agent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-blue-600 font-semibold">Fetching Agent Profile...</p>
                </div>
            </div>
        );
    }

    if (error || !agent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center border border-red-50">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Detailed View Unavailable</h2>
                    <p className="text-gray-600 mb-8">{error || "We couldn't find the agent you're looking for."}</p>
                    <button onClick={() => navigate('/agents')} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all">
                        Return to Agent List
                    </button>
                </div>
            </div>
        );
    }

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved': return 'bg-green-100 text-green-700 border-green-200';
            case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'declined': case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
            case 'active': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };



    return (
        <div className="max-w-[1500px] mx-auto space-y-10 pb-20">
            {/* Top Bar */}
            <div className="flex items-center justify-between pb-2 pt-6 px-6">
                <button
                    onClick={() => navigate('/agents')}
                    className="flex items-center gap-3 px-6 py-3 bg-white text-gray-700 rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-all font-black text-sm"
                >
                    <ChevronLeft className="w-5 h-5" />
                    Back
                </button>
                <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${getStatusColor(agent?.approvalStatus)}`}>
                        {agent?.approvalStatus === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                        {agent?.approvalStatus === 'pending' && <Clock className="w-3 h-3" />}
                        {(agent?.approvalStatus || 'pending').toUpperCase()}
                    </span>
                </div>
            </div>

            {/* Sticky Navigation */}
            <div className="">
                <div className="bg-white/90 p-1.5 rounded-2xl border border-gray-200 shadow-xl shadow-gray-200/50 max-w-4xl mx-auto flex overflow-x-auto no-scrollbar gap-1">
                    {[
                        { id: 'overview', label: 'Overview' },
                        { id: 'company', label: 'Company' },
                        { id: 'business', label: 'Metrics' },
                        { id: 'expertise', label: 'Expertise' },
                        { id: 'documents', label: 'Documents' },
                    ].map((item) => (
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

            <main className="max-w-7xl mx-auto px-4 py-8">
                {missingDocs.length > 0 && (
                    <div className="mb-8 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="p-2 bg-amber-100 rounded-full text-amber-600 shrink-0">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-amber-900 mb-1">Action Required: Missing Documents</h4>
                            <p className="text-sm text-amber-700 mb-2">The following documents are missing for this agent. Please upload them to complete the profile.</p>
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
                                Go to Documents Section &rarr;
                            </button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Profile Card */}
                    <div className="lg:col-span-4 space-y-6 sticky top-20">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="h-32 bg-gradient-to-br from-blue-600 to-indigo-700 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                            </div>
                            <div className="px-6 pb-8 relative text-center">
                                <div className="flex justify-center -mt-16 mb-4">
                                    <div className="p-1.5 bg-white rounded-full shadow-md">
                                        <div className="w-28 h-28 bg-blue-50 rounded-full flex items-center justify-center border-4 border-white overflow-hidden text-blue-500 relative">
                                            {(() => {
                                                const docs = agent.documents || {};
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
                                                return <UserCircle2 className="w-16 h-16" />;
                                            })()}
                                            {/* Fallback for image errors */}
                                            <div className="hidden absolute inset-0 items-center justify-center bg-blue-50">
                                                <UserCircle2 className="w-16 h-16" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <h2 className="text-2xl font-extrabold text-gray-900 leading-tight">
                                    {agent.firstName} {agent.lastName}
                                </h2>
                                <p className="text-blue-600 font-bold text-xs uppercase tracking-widest mt-1">{agent.designation || 'Partner Agent'}</p>

                                <div className="grid grid-cols-2 gap-3 mt-8">
                                    <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Students</p>
                                        <p className="text-xl font-black text-blue-600">{agent.stats?.totalStudents || 0}</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Applications</p>
                                        <p className="text-xl font-black text-indigo-600">{agent.stats?.totalApplications || 0}</p>
                                    </div>
                                </div>

                                <div className="mt-8 space-y-3 text-left">
                                    {[
                                        { icon: Mail, label: 'Email', value: agent.email, color: 'text-blue-500', bg: 'bg-blue-50' },
                                        { icon: Phone, label: 'Phone', value: agent.phone, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                                        { icon: MapPin, label: 'Location', value: `${agent.city}, ${agent.country}`, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-xl border border-gray-100">
                                            <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center ${item.color}`}>
                                                <item.icon className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{item.label}</p>
                                                <p className="text-xs font-bold text-gray-700 truncate">{item.value || 'N/A'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Tech/Security Insight */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Shield className="w-4 h-4 text-blue-600" /> Security Info
                            </h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-500 font-bold uppercase tracking-tight">Origin IP</span>
                                    <span className="font-mono text-gray-900 font-bold">{agent.ipAddress || 'Unknown'}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-500 font-bold uppercase tracking-tight">System/OS</span>
                                    <span className="text-gray-900 font-bold">{agent.os || 'Unknown'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Content */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Section: Overview */}
                        <div ref={sectionRefs.overview} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <SectionHeader title="Overview" icon={User} />

                            {/* Admin Controls Card */}
                            {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                                <div className="p-6 border-b border-gray-100">
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-sm font-black text-gray-800 flex items-center gap-2">
                                                <Shield className="w-4 h-4 text-blue-600" />
                                                Administrative Controls
                                            </h4>
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest ${getStatusColor(agent.approvalStatus || 'pending')}`}>
                                                {agent.approvalStatus || 'PENDING'}
                                            </span>
                                        </div>

                                        {agent.approvalStatus === 'pending' && (
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => setConfirmAction({ type: 'approve', isOpen: true })}
                                                    className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 shadow-sm flex items-center justify-center gap-2 transition-all"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" /> Approve Agent
                                                </button>
                                                <button
                                                    onClick={() => setConfirmAction({ type: 'reject', isOpen: true })}
                                                    className="flex-1 px-4 py-2.5 bg-white border-2 border-red-200 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 flex items-center justify-center gap-2 transition-all"
                                                >
                                                    <XCircle className="w-4 h-4" /> Reject Application
                                                </button>
                                            </div>
                                        )}

                                        {agent.approvalStatus === 'approved' && (
                                            <div className="bg-white/50 rounded-xl p-4 text-center">
                                                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                                                <p className="text-sm font-bold text-gray-700">This agent has been approved and is active.</p>
                                            </div>
                                        )}

                                        {(agent.approvalStatus === 'rejected' || agent.approvalStatus === 'declined') && (
                                            <div className="bg-white/50 rounded-xl p-4 text-center">
                                                <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                                                <p className="text-sm font-bold text-gray-700">This application has been rejected.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <DataField label="First Name" value={agent.firstName} />
                                <DataField label="Last Name" value={agent.lastName} />
                                <DataField label="Primary Email" value={agent.email} mono />
                                <DataField label="Job Designation" value={agent.designation} />
                                <DataField label="Exp. Level" value={agent.experience} />
                                <DataField label="Alternate Phone" value={agent.alternatePhone} mono />
                            </div>
                        </div>

                        {/* Section: Company */}
                        <div ref={sectionRefs.company} className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                            <SectionHeader title="Corporation Profile" icon={Building} />
                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <DataField label="Company Name" value={agent.companyName} />
                                </div>
                                <DataField label="Business Type" value={agent.companyType} />
                                <DataField label="Registration No." value={agent.registrationNumber} mono />
                                <DataField label="Founding Year" value={agent.establishedYear} />
                                <DataField label="Website" value={agent.website ? <a href={agent.website} target="_blank" className="text-blue-600 font-bold flex items-center gap-1">{agent.website} <ExternalLink className="w-3 h-3" /></a> : 'N/A'} />
                                <div className="md:col-span-2">
                                    <DataField label="Full Address" value={agent.address} type="textarea" />
                                </div>
                                <DataField label="Postal Code" value={agent.pincode} mono />
                                <DataField label="Country" value={agent.country} />
                            </div>
                        </div>

                        {/* Section: Business Logic */}
                        <div ref={sectionRefs.business} className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                            <SectionHeader title="Commercial Logic" icon={TrendingUp} />
                            <div className="p-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Company Size</p>
                                        <p className="text-lg font-black text-blue-800">{agent.teamSize || 'N/A'}</p>
                                    </div>
                                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Annual Revenue</p>
                                        <p className="text-lg font-black text-emerald-800">{agent.annualRevenue || 'N/A'}</p>
                                    </div>
                                    <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Partner Type</p>
                                        <p className="text-lg font-black text-indigo-800 capitalize">{agent.partnershipType || 'Regular'}</p>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <DataField label="Expected Flow" value={`${agent.expectedStudents || '0'} Students/Year`} />
                                    <DataField label="Marketing Budget" value={agent.marketingBudget} />
                                    <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                                        <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2 block">The Pitch / Proposal</label>
                                        <p className="text-sm text-gray-700 italic">"{agent.whyPartner || 'No statement provided.'}"</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section: Expertise */}
                        <div ref={sectionRefs.expertise} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <SectionHeader title="Expertise Areas" icon={Award} />
                            <div className="p-8 space-y-8">
                                <div>
                                    <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-3 block">Specializations</label>
                                    <div className="flex flex-wrap gap-2">
                                        {agent.specialization?.map((spec, i) => (
                                            <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl border border-blue-100">
                                                {spec}
                                            </span>
                                        )) || <span className="text-gray-400 italic text-sm">None listed</span>}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-3 block">Services Offered</label>
                                    <div className="flex flex-wrap gap-2">
                                        {agent.servicesOffered?.map((serv, i) => (
                                            <span key={i} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-100">
                                                {serv}
                                            </span>
                                        )) || <span className="text-gray-400 italic text-sm">None listed</span>}
                                    </div>
                                </div>
                            </div>
                        </div>



                        {/* Section: Documents */}
                        <div ref={sectionRefs.documents} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <SectionHeader title="Documents" icon={FileText} />
                            <div className="p-8">
                                <AgentDocumentUpload
                                    agent={agent}
                                    onUploadSuccess={() => fetchAgentDetails()}
                                    isAdmin={true}
                                />
                            </div>
                        </div>

                        {/* Footer Tracking */}
                        <div className="flex flex-col md:flex-row items-center justify-between p-6 bg-white rounded-3xl border border-gray-100 text-gray-400 text-[10px] font-black tracking-widest uppercase">
                            <div className="flex flex-wrap gap-6">
                                <span className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 opacity-50" /> Joined {new Date(agent.createdAt).toLocaleDateString()}</span>
                                {agent.lastLogin && <span className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 opacity-50" /> Last Active {new Date(agent.lastLogin).toLocaleDateString()}</span>}
                            </div>
                            {agent.approvedBy && (
                                <div className="mt-2 md:mt-0 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full">
                                    Verified by {agent.approvedBy?.name || 'Administrator'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Alert Dialog */}
            <AlertDialog open={confirmAction.isOpen} onOpenChange={(isOpen) => setConfirmAction(prev => ({ ...prev, isOpen }))}>
                <AlertDialogContent className="rounded-3xl p-8 border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black text-gray-900 mb-2">
                            {confirmAction.type === 'approve' || confirmAction.type === 'reject' ? 'Final Confirmation' : 'Confirm Action'}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-600">
                            {confirmAction.type === 'approve'
                                ? "You're about to approve this agent. An official welcome email with login credentials will be sent."
                                : confirmAction.type === 'reject'
                                    ? "Are you certain you want to reject this partnership?"
                                    : "Are you sure you want to proceed?"}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-8 gap-4">
                        <AlertDialogCancel className="rounded-xl border-2 border-gray-100 font-bold px-6 h-12">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleAction}
                            className={`rounded-xl font-black text-white px-8 h-12 shadow-lg ${confirmAction.type === 'approve'
                                ? "bg-green-600 hover:bg-green-700 shadow-green-100"
                                : "bg-red-600 hover:bg-red-700 shadow-red-100"
                                }`}
                        >
                            {confirmAction.type === 'approve'
                                ? 'Confirm Approval'
                                : confirmAction.type === 'reject'
                                    ? 'Confirm Rejection'
                                    : 'Confirm'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default AgentDetailView;
