import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    User, Building, Mail, Phone, Globe, MapPin, Calendar,
    Briefcase, Award, Users, TrendingUp, Target, FileText,
    CheckCircle, XCircle, ArrowLeft, Edit, Shield, Info,
    BarChart3, PieChart, Clock, ExternalLink, Download, Save, Check,
    ChevronLeft, Upload, CheckCircle2, X, UserCircle2
} from 'lucide-react';
import agentService from '../../services/agentService';
import externalSearchService from '../../services/externalSearchService';
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
        access: useRef(null),
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
                setTimeout(() => navigate('/agents'), 1500);
            } else if (confirmAction.type === 'reject') {
                await agentService.rejectAgent(id);
                success('Agent application declined.');
                fetchAgentDetails();
            }
        } catch (error) {
            showError('Failed to process request');
        } finally {
            setConfirmAction({ type: null, isOpen: false });
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
            window.scrollTo({ top: offsetPosition, behavior: "smooth" });
        }
    };

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
        <div className="min-h-screen bg-gray-50/50 pb-20">
            {/* Sticky Header */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/agents')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 truncate max-w-[200px] md:max-w-none">
                                {agent.firstName} {agent.lastName}
                            </h1>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{agent.companyName}</p>
                        </div>
                    </div>

                    <div className="hidden lg:flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                        {[
                            { id: 'overview', label: 'Identity', icon: User },
                            { id: 'company', label: 'Company', icon: Building },
                            { id: 'business', label: 'Metrics', icon: TrendingUp },
                            { id: 'expertise', label: 'Expertise', icon: Award },
                            { id: 'access', label: 'API Access', icon: Shield },
                            { id: 'documents', label: 'Docs', icon: FileText },
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => scrollToSection(item.id)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeSection === item.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'}`}
                            >
                                <item.icon className="w-3.5 h-3.5" />
                                {item.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        {agent.approvalStatus === 'pending' && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setConfirmAction({ type: 'approve', isOpen: true })}
                                    className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 shadow-sm flex items-center gap-2"
                                >
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                                </button>
                                <button
                                    onClick={() => setConfirmAction({ type: 'reject', isOpen: true })}
                                    className="px-4 py-1.5 bg-white border border-red-100 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 flex items-center gap-2"
                                >
                                    <XCircle className="w-3.5 h-3.5" /> Reject
                                </button>
                            </div>
                        )}
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest ${getStatusColor(agent.approvalStatus || 'pending')}`}>
                            {agent.approvalStatus || 'PENDING'}
                        </span>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Profile Card */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden sticky top-24">
                            <div className="h-32 bg-blue-600 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                            </div>
                            <div className="px-6 pb-8 relative text-center">
                                <div className="flex justify-center -mt-16 mb-4">
                                    <div className="p-1.5 bg-white rounded-full shadow-md">
                                        <div className="w-28 h-28 bg-blue-50 rounded-full flex items-center justify-center border-4 border-white overflow-hidden text-blue-500">
                                            <UserCircle2 className="w-16 h-16" />
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
                        <div ref={sectionRefs.overview} className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                            <SectionHeader title="Agent Identity" icon={User} />
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
                        <div ref={sectionRefs.expertise} className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
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

                        {/* Section: Access Control */}
                        <div ref={sectionRefs.access}>
                            <AccessControlSection agent={agent} onUpdate={fetchAgentDetails} />
                        </div>

                        {/* Section: Documents */}
                        <div ref={sectionRefs.documents} className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                            <SectionHeader title="Verification Vault" icon={FileText} />
                            <div className="p-8">
                                {agent.documents && agent.documents.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {agent.documents.map((doc, index) => (
                                            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-white shadow-xs flex items-center justify-center text-blue-600">
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-gray-700 capitalize">{doc.documentType || 'Document'}</p>
                                                        <p className="text-[9px] text-gray-400 uppercase font-bold tracking-tighter">Verified File</p>
                                                    </div>
                                                </div>
                                                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                                        <Info className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-400 font-bold text-sm italic">No digital documents uploaded.</p>
                                    </div>
                                )}
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
                        <AlertDialogTitle className="text-2xl font-black text-gray-900 mb-2">Final Confirmation</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-600">
                            {confirmAction.type === 'approve'
                                ? "You're about to approve this agent. An official welcome email with login credentials will be sent."
                                : "Are you certain you want to reject this partnership?"}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-8 gap-4">
                        <AlertDialogCancel className="rounded-xl border-2 border-gray-100 font-bold px-6 h-12">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleAction}
                            className={`rounded-xl font-black text-white px-8 h-12 shadow-lg ${confirmAction.type === 'approve' ? "bg-green-600 hover:bg-green-700 shadow-green-100" : "bg-red-600 hover:bg-red-700 shadow-red-100"}`}
                        >
                            {confirmAction.type === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

const AccessControlSection = ({ agent, onUpdate }) => {
    const [countries, setCountries] = useState([]);
    const [universities, setUniversities] = useState([]);
    const [selectedCountries, setSelectedCountries] = useState(agent.accessibleCountries || []);
    const [selectedUniversities, setSelectedUniversities] = useState(agent.accessibleUniversities || []);
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const { success, error } = useToast();

    useEffect(() => {
        const loadData = async () => {
            try {
                setFetchLoading(true);
                const [countriesData, univsData] = await Promise.all([
                    externalSearchService.getCountries(),
                    externalSearchService.getUniversities()
                ]);
                setCountries(countriesData.data || countriesData || []);
                setUniversities(univsData.data || univsData || []);
            } catch (err) {
                console.error('Failed to load access control data', err);
            } finally {
                setFetchLoading(false);
            }
        };
        loadData();
    }, []);

    const handleToggleCountry = (countryName) => {
        setSelectedCountries(prev => prev.includes(countryName) ? prev.filter(c => c !== countryName) : [...prev, countryName]);
    };

    const handleToggleUniversity = (univId) => {
        setSelectedUniversities(prev => prev.includes(univId.toString()) ? prev.filter(id => id !== univId.toString()) : [...prev, univId.toString()]);
    };

    const handleSaveAccess = async () => {
        try {
            setLoading(true);
            await agentService.updateAgent(agent._id, {
                accessible_countries: selectedCountries,
                accessible_universities: selectedUniversities
            });
            success('Access control updated successfully');
            if (onUpdate) onUpdate();
        } catch (err) {
            error(err.response?.data?.message || 'Failed to update access control');
        } finally {
            setLoading(false);
        }
    };

    if (fetchLoading) return (
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm animate-pulse h-48"></div>
    );

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-100/50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Shield className="text-blue-600 w-5 h-5" />
                    API Access Control
                </h3>
                <button
                    onClick={handleSaveAccess}
                    disabled={loading}
                    className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                    <Save className="w-3.5 h-3.5" /> {loading ? 'Saving...' : 'Save Rules'}
                </button>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5" /> Permitted Countries
                    </label>
                    <div className="grid grid-cols-1 gap-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                        {countries.map((country) => (
                            <button
                                key={country.name}
                                onClick={() => handleToggleCountry(country.name)}
                                className={`flex items-center p-3 rounded-xl border transition-all text-left ${selectedCountries.includes(country.name) ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-100 bg-white text-gray-500'}`}
                            >
                                <div className={`w-4 h-4 rounded border mr-3 flex items-center justify-center ${selectedCountries.includes(country.name) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                                    {selectedCountries.includes(country.name) && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <span className="text-xs font-bold">{country.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-2">
                        <Building className="w-3.5 h-3.5" /> Specific Universities
                    </label>
                    <div className="grid grid-cols-1 gap-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                        {universities
                            .filter(u => selectedCountries.includes(u.country))
                            .map((univ) => (
                                <button
                                    key={univ.id || univ.university_id}
                                    onClick={() => handleToggleUniversity(univ.id || univ.university_id)}
                                    className={`flex items-center p-3 rounded-xl border transition-all text-left ${selectedUniversities.includes((univ.id || univ.university_id).toString()) ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-gray-100 bg-white text-gray-500'}`}
                                >
                                    <div className={`w-4 h-4 rounded border mr-3 flex items-center justify-center ${selectedUniversities.includes((univ.id || univ.university_id).toString()) ? 'bg-emerald-600 border-emerald-600' : 'border-gray-300'}`}>
                                        {selectedUniversities.includes((univ.id || univ.university_id).toString()) && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold truncate">{univ.name}</p>
                                        <p className="text-[9px] opacity-70 font-bold">{univ.country}</p>
                                    </div>
                                </button>
                            ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgentDetailView;
