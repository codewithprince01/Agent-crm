import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, UserPlus, Filter, User, GraduationCap, ArrowRight, RefreshCw, Mail, Globe, Clock } from 'lucide-react';
import applicationService from '../../services/applicationService';
import { useToast } from '../../components/ui/toast';
import { ROLES } from '../../utils/constants';
import { useSelector } from 'react-redux';

const PendingStudents = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { error: showError } = useToast();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { user } = useSelector(state => state.auth);

    useEffect(() => {
        fetchPendingStudents();
    }, []);

    // Auto-navigate to program selection if studentId is in URL (for adding multiple applications)
    const studentIdParam = searchParams.get('studentId');
    useEffect(() => {
        if (studentIdParam) {
            // Directly navigate to program selection without checking pending list
            // This allows adding multiple courses to already-applied students
            navigate(`/program-selection/${studentIdParam}`);
        }
    }, [studentIdParam, navigate]);

    const fetchPendingStudents = async () => {
        try {
            setLoading(true);
            const response = await applicationService.getPendingStudents();
            setStudents(response.data || []);
        } catch (error) {
            console.error('Error fetching pending students:', error);
            showError("Failed to load eligible students");
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students.filter(student =>
        (student.firstName + ' ' + student.lastName).toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.passportNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
                <div className="relative">
                    <div className="h-24 w-24 rounded-3xl border-4 border-primary-100 border-t-primary-600 animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <User className="text-primary-600 animate-pulse" size={32} />
                    </div>
                </div>
                <p className="mt-6 text-xl font-black text-gray-900 tracking-tight">Syncing Students...</p>
                <p className="text-gray-400 font-medium mt-1">Refining your application queue</p>
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
                            <RefreshCw size={24} className="animate-spin-slow" />
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Pending Students</h1>
                    </div>
                    <p className="text-gray-500 font-medium max-w-xl leading-relaxed">
                        List of students who have completed their profiles and are ready for program selection.
                    </p>
                </div>

                <div className="flex items-center space-x-3 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="px-4 py-2 bg-amber-50 text-amber-600 rounded-xl font-black text-sm uppercase tracking-wider flex items-center">
                        <Clock size={16} className="mr-2" />
                        Awaiting Action: {students.length}
                    </div>
                    <button
                        onClick={fetchPendingStudents}
                        className="p-3 hover:bg-gray-50 text-gray-400 hover:text-primary-600 rounded-xl transition-all active:scale-95"
                        title="Refresh Data"
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>

            {/* Glass Search & Filter Bar */}
            <div className="glass-morphism p-4 rounded-[32px] mb-8 flex flex-col md:flex-row gap-4 shadow-2xl shadow-black/[0.02]">
                <div className="relative flex-1 group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search student by name, email or passport..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-14 pr-4 py-5 bg-white/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white transition-all text-sm font-bold placeholder:text-gray-300 shadow-inner"
                    />
                </div>
                <button className="px-8 py-5 bg-white border border-gray-100 text-gray-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center shadow-sm">
                    <Filter className="w-4 h-4 mr-3" />
                    Advanced Filters
                </button>
            </div>

            {/* Content Display */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredStudents.length > 0 ? (
                    filteredStudents.map((student, index) => (
                        <div
                            key={student._id}
                            className="glass-card group hover:scale-[1.02] transition-all duration-500 animate-in fade-in slide-in-from-bottom-5"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="p-8">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center space-x-4">
                                        <div className="h-16 w-16 rounded-[24px] bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-primary-500/30 group-hover:rotate-6 transition-transform">
                                            {student.firstName?.[0]}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-gray-900 tracking-tight leading-tight group-hover:text-primary-600 transition-colors">
                                                {student.firstName} {student.lastName}
                                            </h3>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-primary-500/60 mt-0.5">
                                                ID: {student._id ? student._id.toString().slice(-8).toUpperCase() : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    {student.isCompleted ? (
                                        <div className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                            Ready
                                        </div>
                                    ) : (
                                        <div className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-wider animate-pulse">
                                            Partial
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50">
                                        <div className="flex items-center text-gray-400 mb-1">
                                            <Mail size={14} className="mr-1.5" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Phone</span>
                                        </div>
                                        <p className="text-xs font-bold text-gray-700 font-mono italic">
                                            {student.phone || "MISSING"}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50">
                                        <div className="flex items-center text-gray-400 mb-1">
                                            <GraduationCap size={14} className="mr-1.5" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Education</span>
                                        </div>
                                        <p className="text-xs font-bold text-gray-700 truncate">
                                            {student.highestLevel || "N/A"}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-8">
                                    <div className="flex items-center text-gray-500 text-xs font-medium">
                                        <Mail size={14} className="mr-3 text-primary-400" />
                                        <span className="truncate">{student.email}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => navigate(`/program-selection/${student._id}`)}
                                    className="w-full py-4 bg-primary-600 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/10 active:scale-95 group/btn"
                                >
                                    Select Program
                                    <ArrowRight size={16} className="ml-3 group-hover/btn:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-20 bg-white/50 rounded-[48px] border-2 border-dashed border-gray-100 flex flex-col items-center text-center">
                        <div className="h-32 w-32 bg-gray-50 rounded-[40px] flex items-center justify-center text-gray-200 mb-8 border border-gray-50 shadow-inner">
                            <User size={64} />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">No Eligible Students</h2>
                        <p className="text-gray-400 max-w-sm mx-auto font-medium px-4 leading-relaxed">
                            {searchTerm
                                ? "We couldn't find any students matching your search criteria."
                                : "The queue is empty. Either all students have already applied, or they haven't finished their profile details."
                            }
                        </p>
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="mt-8 text-primary-600 font-black text-sm uppercase tracking-widest hover:underline"
                            >
                                Clear search and try again
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PendingStudents;
