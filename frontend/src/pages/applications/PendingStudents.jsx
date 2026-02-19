import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, UserPlus, Filter, User, GraduationCap, ArrowRight, RefreshCw, Mail, Globe, Clock } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
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
        <div className="p-6">
            <PageHeader
                breadcrumbs={[
                    { label: 'Dashboard', link: '/dashboard' },
                    { label: 'Students', link: '/students' },
                    { label: 'Pending Students' }
                ]}
            />
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <div className="flex items-center space-x-3">
                    <h1 className="text-2xl font-bold text-gray-800">Pending Students</h1>
                </div>

                <div className="flex items-center space-x-3">
                    <button
                        onClick={fetchPendingStudents}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all flex items-center gap-2 cursor-pointer"
                        title="Refresh Data"
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative flex-1 w-full md:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" size={18} />
                        <input
                            type="text"
                            placeholder="Search student by name, email or passport..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Content Display */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredStudents.length > 0 ? (
                    filteredStudents.map((student, index) => (
                        <div
                            key={student._id}
                            className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden hover:shadow-md transition-all"
                        >
                            <div className="p-8">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="h-12 w-12 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xl">
                                            {student.firstName?.[0]}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {student.firstName} {student.lastName}
                                            </h3>
                                            <p className="text-xs text-gray-500">
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

                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center text-gray-500 mb-1">
                                            <Mail size={12} className="mr-1.5" />
                                            <span className="text-[10px] uppercase tracking-wider font-semibold">Phone</span>
                                        </div>
                                        <p className="text-xs font-medium text-gray-700">
                                            {student.phone || "MISSING"}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center text-gray-500 mb-1">
                                            <GraduationCap size={12} className="mr-1.5" />
                                            <span className="text-[10px] uppercase tracking-wider font-semibold">Education</span>
                                        </div>
                                        <p className="text-xs font-medium text-gray-700 truncate">
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
                                    className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm flex items-center justify-center hover:bg-blue-700 transition-all shadow-sm cursor-pointer"
                                >
                                    Select Program
                                    <ArrowRight size={16} className="ml-2" />
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
