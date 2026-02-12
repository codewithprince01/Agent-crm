import React, { useState, useEffect } from 'react';
import { Search, X, RefreshCw, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import applicationService from '../../services/applicationService';
import { useToast } from '../../components/ui/toast';
import { ROLES } from '../../utils/constants';

const AppliedStudents = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const { user } = useSelector((state) => state.auth);

    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        totalItems: 0,
        totalPages: 0,
    });

    // Fetch applied students on component mount
    useEffect(() => {
        fetchAppliedStudents();
    }, []);

    const fetchAppliedStudents = async () => {
        try {
            setLoading(true);
            const response = await applicationService.getAppliedStudents();
            setStudents(response.data || []);
            setPagination({
                page: 1,
                limit: response.data?.length || 10,
                totalItems: response.data?.length || 0,
                totalPages: 1,
            });
        } catch (err) {
            console.error('Error fetching applied students:', err);
            toast.error(err.response?.data?.message || 'Failed to fetch applied students');
        } finally {
            setLoading(false);
        }
    };

    // Filter students based on search term
    const filteredStudents = students.filter(student => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            student.firstName?.toLowerCase().includes(search) ||
            student.lastName?.toLowerCase().includes(search) ||
            student.email?.toLowerCase().includes(search) ||
            student.phone?.toLowerCase().includes(search) ||
            student.nationality?.toLowerCase().includes(search)
        );
    });

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">
                    Applied Students
                </h1>
                <p className="text-gray-500 text-sm">
                    Students who have applied for programs
                </p>
            </div>

            {/* Search and Actions Bar */}
            <div className="bg-white rounded-2xl shadow-md p-6 mb-6 border border-gray-300">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    {/* Search */}
                    <div className="relative flex-1 w-full md:w-auto">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name, email, phone, nationality..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>

                    {/* Refresh Button */}
                    <button
                        onClick={fetchAppliedStudents}
                        disabled={loading}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>

                {/* Results Count */}
                <div className="mt-4 text-sm text-gray-600">
                    Showing <span className="font-semibold text-indigo-600">{filteredStudents.length}</span> of{' '}
                    <span className="font-semibold text-indigo-600">{students.length}</span> students
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            )}

            {/* Empty State */}
            {!loading && filteredStudents.length === 0 && (
                <div className="bg-white rounded-2xl shadow-md p-12 text-center border border-gray-300">
                    <div className="text-gray-400 mb-4">
                        <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Applied Students Found</h3>
                    <p className="text-gray-500">
                        {searchTerm ? 'Try adjusting your search terms' : 'No students have applied for programs yet'}
                    </p>
                </div>
            )}

            {/* Table */}
            {!loading && filteredStudents.length > 0 && (
                <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-300">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                                <tr>
                                    <th className="p-4 text-left font-semibold text-xs uppercase tracking-wider">S.No.</th>
                                    <th className="p-4 text-left font-semibold text-xs uppercase tracking-wider">Name</th>
                                    <th className="p-4 text-left font-semibold text-xs uppercase tracking-wider">Contact</th>
                                    <th className="p-4 text-left font-semibold text-xs uppercase tracking-wider">Nationality</th>
                                    <th className="p-4 text-left font-semibold text-xs uppercase tracking-wider">Country</th>
                                    {(user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.ADMIN) && (
                                        <th className="p-4 text-left font-semibold text-xs uppercase tracking-wider">Referred By</th>
                                    )}
                                    <th className="p-4 text-left font-semibold text-xs uppercase tracking-wider text-center">Applications</th>
                                    <th className="p-4 text-left font-semibold text-xs uppercase tracking-wider">Registered On</th>
                                    <th className="p-4 text-left font-semibold text-xs uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map((student, index) => (
                                    <tr key={student._id} className="border-b border-gray-300 hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            <span className="font-semibold text-indigo-600">
                                                #{index + 1}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className="font-semibold text-gray-800">
                                                {student.firstName && student.lastName
                                                    ? `${student.firstName} ${student.lastName}`
                                                    : student.name || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                <a className="text-gray-700 text-sm hover:text-indigo-600">
                                                    {student.email || 'N/A'}
                                                </a>
                                                <a className="text-gray-500 text-xs hover:text-indigo-600">
                                                    {student.phone || 'N/A'}
                                                </a>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-gray-600">{student.nationality || 'N/A'}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-gray-600">{student.country || 'N/A'}</span>
                                        </td>
                                        {(user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.ADMIN) && (
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="text-gray-800 font-medium">
                                                        {student.referredByName || 'Direct'}
                                                    </span>
                                                    {student.referredByRole && student.referredByRole !== 'Direct' && student.referredByRole !== 'N/A' && (
                                                        <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">
                                                            {student.referredByRole}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                        <td className="p-4">
                                            <div className="flex items-center justify-center">
                                                <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all min-w-[180px]">
                                                    <span className="text-gray-700 text-sm font-semibold">
                                                        Total Applied: {student.applications?.length || 1}
                                                    </span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/pending-applications?studentId=${student._id}`);
                                                        }}
                                                        className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
                                                        title="Add Another Application"
                                                    >
                                                        <PlusCircle size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 whitespace-nowrap">
                                            <span className="text-gray-600">
                                                {student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'N/A'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => navigate(`/students/${student._id}`)}
                                                    className="px-3 py-1.5 border border-blue-300 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-600 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                                                    title="View Details"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                                    </svg>
                                                    View
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppliedStudents;
