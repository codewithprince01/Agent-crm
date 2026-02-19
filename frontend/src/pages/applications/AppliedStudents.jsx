import React, { useState, useEffect } from 'react';
import { Search, X, RefreshCw, PlusCircle } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
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
        <div className="p-6">
            {/* Header */}
            <PageHeader
                breadcrumbs={[
                    { label: 'Dashboard', link: '/dashboard' },
                    { label: 'Students', link: '/students' },
                    { label: 'Applied Students' }
                ]}
            />

            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Applied Students</h1>
            </div>

            {/* Search and Actions Bar */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    {/* Search */}
                    <div className="relative flex-1 w-full md:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, email, phone, nationality..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Refresh Button */}
                    <button
                        onClick={fetchAppliedStudents}
                        disabled={loading}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
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
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No.</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nationality</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                                    {(user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.ADMIN) && (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referred By</th>
                                    )}
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Applications</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered On</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map((student, index) => (
                                    <tr key={student._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            #{index + 1}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {student.firstName && student.lastName
                                                    ? `${student.firstName} ${student.lastName}`
                                                    : student.name || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{student.email || 'N/A'}</div>
                                            <div className="text-xs text-gray-500">{student.phone || 'N/A'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {student.nationality || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {student.country || 'N/A'}
                                        </td>
                                        {(user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.ADMIN) && (
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-gray-900">
                                                        {student.referredByName || 'Direct'}
                                                    </span>
                                                    {student.referredByRole && student.referredByRole !== 'Direct' && student.referredByRole !== 'N/A' && (
                                                        <span className="text-xs text-indigo-600">
                                                            {student.referredByRole}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex items-center justify-center">
                                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-100">
                                                    <span>{student.applications?.length || 1} Applied</span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/pending-applications?studentId=${student._id}`);
                                                        }}
                                                        className="p-1 hover:bg-green-100 rounded-full transition-colors"
                                                        title="Add Another Application"
                                                    >
                                                        <PlusCircle size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => navigate(`/students/${student._id}`)}
                                                className="px-3 py-1.5 border border-blue-300 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-600 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                                                title="View Details"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                                </svg>
                                                View detail
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 sm:px-6">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-700">
                                Showing <span className="font-medium">{filteredStudents.length}</span> of <span className="font-medium">{students.length}</span> students
                            </div>
                            <div className="flex gap-2">
                                {/* Add pagination controls here if implemented in state */}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppliedStudents;
