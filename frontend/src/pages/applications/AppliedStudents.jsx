import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, Filter, Eye, ChevronDown, ChevronRight, User, Globe, FileText,
    CheckCircle, Package, Clock, ShieldCheck, RefreshCw,
    TrendingUp, ExternalLink, Mail, ArrowUpRight
} from 'lucide-react';
import applicationService from '../../services/applicationService';
import { useToast } from '../../components/ui/toast';

const AppliedStudents = () => {
    const navigate = useNavigate();
    const { error: showError } = useToast();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedStudent, setExpandedStudent] = useState(null);

    useEffect(() => {
        fetchAppliedStudents();
    }, []);

    const fetchAppliedStudents = async () => {
        try {
            setLoading(true);
            const response = await applicationService.getAppliedStudents();
            setStudents(response.data || []);
        } catch (error) {
            console.error('Error fetching applied students:', error);
            showError("Failed to load applied students");
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (studentId) => {
        setExpandedStudent(expandedStudent === studentId ? null : studentId);
    };

    const filteredStudents = students.filter(student =>
        (student.firstName + ' ' + student.lastName).toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.passportNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStageColor = (stage) => {
        switch (stage) {
            case 'Pre-Payment': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'Submission': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'Admission': return 'bg-purple-50 text-purple-600 border-purple-100';
            case 'Arrival': return 'bg-green-50 text-green-600 border-green-100';
            default: return 'bg-gray-50 text-gray-500 border-gray-100';
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
                <div className="relative">
                    <div className="h-24 w-24 rounded-3xl border-4 border-primary-100 border-t-indigo-600 animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <TrendingUp className="text-indigo-600 animate-pulse" size={32} />
                    </div>
                </div>
                <p className="mt-6 text-xl font-black text-gray-900 tracking-tight">Loading Enrollments...</p>
                <p className="text-gray-400 font-medium mt-1">Analyzing student progression</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="mb-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                        <div className="h-12 w-12 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-600/10">
                            <TrendingUp size={24} />
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Applied Students</h1>
                    </div>
                    <p className="text-gray-500 font-medium max-w-xl leading-relaxed">
                        Track the progress of student applications and enrollment status.
                    </p>
                </div>

                <div className="flex items-center space-x-3 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-black text-sm uppercase tracking-wider flex items-center">
                        <CheckCircle size={16} className="mr-2" />
                        Total Applied: {students.length}
                    </div>
                    <button
                        onClick={fetchAppliedStudents}
                        className="p-3 hover:bg-gray-50 text-gray-400 hover:text-indigo-600 rounded-xl transition-all active:scale-95"
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>

            {/* Glass Filters */}
            <div className="glass-morphism p-4 rounded-[32px] mb-8 flex flex-col md:flex-row gap-4 shadow-2xl shadow-black/[0.02]">
                <div className="relative flex-1 group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by name, email or passport..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-14 pr-4 py-5 bg-white/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all text-sm font-bold placeholder:text-gray-300 shadow-inner outline-none"
                    />
                </div>
                <button className="px-8 py-5 bg-white border border-gray-100 text-gray-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center shadow-sm">
                    <Filter className="w-4 h-4 mr-3" />
                    Global Filter
                </button>
            </div>

            {/* Main Table Container */}
            <div className="bg-white rounded-[40px] border border-gray-100 shadow-2xl shadow-black/[0.02] overflow-hidden">
                {filteredStudents.length > 0 ? (
                    <div className="overflow-x-auto overflow-y-visible">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="w-16 px-8 py-6"></th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Student Identity</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Documentation</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Activity</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Latest Milestone</th>
                                    <th className="px-8 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Control</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredStudents.map((student, idx) => {
                                    const latestApp = student.applications?.[0];
                                    const isExpanded = expandedStudent === student._id;

                                    return (
                                        <React.Fragment key={student._id}>
                                            <tr className={`
                                                transition-all duration-300 group
                                                ${isExpanded ? 'bg-indigo-50/30' : 'hover:bg-gray-50/50'}
                                            `}>
                                                <td className="px-8 py-6">
                                                    <button
                                                        onClick={() => toggleExpand(student._id)}
                                                        className={`
                                                            h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-500
                                                            ${isExpanded ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 rotate-180' : 'bg-gray-50 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600'}
                                                        `}
                                                    >
                                                        <ChevronDown size={20} />
                                                    </button>
                                                </td>
                                                <td className="px-8 py-6 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-primary-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                                                            {student.firstName?.[0]}
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-base font-black text-gray-900 group-hover:text-indigo-600 transition-colors">
                                                                {student.firstName} {student.lastName}
                                                            </div>
                                                            <div className="flex items-center text-xs font-medium text-gray-400 mt-0.5">
                                                                <Mail size={12} className="mr-1.5" />
                                                                {student.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 whitespace-nowrap">
                                                    <div className="flex flex-col">
                                                        <div className="inline-flex items-center text-[10px] font-black font-mono bg-gray-100/80 text-gray-600 px-3 py-1.5 rounded-lg border border-gray-100 tracking-[0.1em]">
                                                            <Globe size={12} className="mr-2 opacity-50" />
                                                            {student.passportNumber || "NO-PASSPORT"}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 whitespace-nowrap text-center">
                                                    <div className="inline-flex items-center space-x-2">
                                                        <span className="h-8 w-8 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-black border border-indigo-100">
                                                            {student.applications?.length || 0}
                                                        </span>
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Applications</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 whitespace-nowrap">
                                                    {latestApp ? (
                                                        <div className={`inline-flex items-center px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-colors ${getStageColor(latestApp.stage)}`}>
                                                            <div className="h-1.5 w-1.5 rounded-full bg-current mr-2.5 animate-pulse"></div>
                                                            {latestApp.stage}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-300 font-bold uppercase tracking-widest italic">No Data</span>
                                                    )}
                                                </td>
                                                <td className="px-8 py-6 whitespace-nowrap text-right">
                                                    <div className="flex items-center justify-end space-x-3">
                                                        <button
                                                            onClick={() => navigate(`/program-selection/${student._id}`)}
                                                            className="px-5 py-2.5 bg-green-50 text-green-700 hover:bg-green-600 hover:text-white rounded-xl font-black text-[10px] uppercase tracking-[0.15em] transition-all shadow-sm border border-green-100 group/btn"
                                                        >
                                                            Add New
                                                            <ArrowUpRight size={14} className="inline ml-1.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                                                        </button>
                                                        <button
                                                            onClick={() => navigate(`/students/view/${student._id}`)}
                                                            className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-white hover:text-indigo-600 hover:shadow-xl hover:border-indigo-100 transition-all border border-gray-50"
                                                        >
                                                            <Eye size={20} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>

                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan="6" className="p-0 border-b border-indigo-100/50 animate-in slide-in-from-top-4 duration-500">
                                                        <div className="bg-gradient-to-b from-indigo-50/30 to-white/0 px-12 py-10">
                                                            <div className="flex items-center space-x-4 mb-8">
                                                                <div className="h-0.5 w-12 bg-indigo-600 rounded-full"></div>
                                                                <h4 className="text-sm font-black text-indigo-900 uppercase tracking-[0.3em]">Detailed Progress Tracker</h4>
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                                {(student.applications || []).map((app, index) => (
                                                                    <div key={app._id} className="bg-white p-6 rounded-[32px] border border-indigo-100/50 shadow-xl shadow-indigo-600/[0.03] hover:shadow-indigo-600/[0.08] transition-all hover:scale-[1.02] group/app">
                                                                        <div className="flex justify-between items-start mb-6">
                                                                            <div className="space-y-1">
                                                                                <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-100 uppercase tracking-tighter">
                                                                                    {app.applicationNo || 'ID-TEMP'}
                                                                                </span>
                                                                                <h5 className="text-lg font-black text-gray-900 line-clamp-2 leading-tight group-hover/app:text-indigo-600 transition-colors">
                                                                                    {app.programSnapshot?.programName}
                                                                                </h5>
                                                                                <p className="text-xs font-bold text-gray-400 flex items-center">
                                                                                    <Building2 size={12} className="mr-1.5" />
                                                                                    {app.programSnapshot?.universityName}
                                                                                </p>
                                                                            </div>
                                                                        </div>

                                                                        <div className="grid grid-cols-2 gap-3 mb-6">
                                                                            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-50">
                                                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                                                                                <div className={`text-[10px] font-black uppercase ${getStageColor(app.stage).split(' ')[1]}`}>
                                                                                    {app.stage}
                                                                                </div>
                                                                            </div>
                                                                            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-50">
                                                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Payment</p>
                                                                                <div className={`text-[10px] font-black uppercase ${app.paymentStatus === 'paid' ? 'text-green-600' : 'text-amber-600'}`}>
                                                                                    {app.paymentStatus}
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                                                            <div>
                                                                                <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Enrolled on</p>
                                                                                <p className="text-[10px] font-black text-gray-600">{new Date(app.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                                                            </div>
                                                                            <button
                                                                                onClick={() => navigate(`/applications/${app._id}`)}
                                                                                className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center border border-indigo-100"
                                                                            >
                                                                                <ExternalLink size={16} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-32 flex flex-col items-center text-center">
                        <div className="h-32 w-32 bg-gray-50 rounded-[40px] flex items-center justify-center text-gray-200 mb-10 border border-gray-50 shadow-inner">
                            <Package size={64} />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Ecosystem is Empty</h2>
                        <p className="text-gray-400 max-w-sm mx-auto font-medium leading-relaxed px-6">
                            Registered students will manifest here the moment their first program application is initialized.
                        </p>
                        <button
                            onClick={() => navigate('/pending-students')}
                            className="mt-10 px-10 py-4 bg-primary-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/10 active:scale-95 flex items-center"
                        >
                            Select Program
                            <ChevronRight size={18} className="ml-2" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// Add helper component for icon
const Building2 = ({ size, className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M6 22V4c0-.5.2-1 .6-1.4.4-.4.9-.6 1.4-.6h8c.5 0 1 .2 1.4.6.4.4.6.9.6 1.4v18" />
        <path d="M6 18h12" />
        <path d="M6 14h12" />
        <path d="M6 10h12" />
        <path d="M6 6h12" />
        <path d="M2 22h20" />
    </svg>
);

export default AppliedStudents;
