import React, { useState, useEffect } from 'react';
import { Search, X, Plus, Copy, Check, PlusCircle, Eye, Pencil, Trash2 } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
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
import { setLoading, setStudents, setError } from '../../store/slices/studentSlice';
import studentService from '../../services/studentService';
import agentService from '../../services/agentService';
import { useToast } from '../../components/ui/toast';
import { ROLES } from '../../utils/constants';

const StudentList = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const toast = useToast();
    const { user } = useSelector((state) => state.auth);
    const { students, loading, error } = useSelector((state) => state.student);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('All');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const [showAddModal, setShowAddModal] = useState(false);
    const [showLinkDialog, setShowLinkDialog] = useState(false);
    const [generatedLink, setGeneratedLink] = useState('');
    const [linkCopied, setLinkCopied] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        totalItems: 0,
        totalPages: 0,
    });

    // Fetch students on component mount or when pagination changes
    useEffect(() => {
        fetchStudentsData();
    }, [pagination.page, pagination.limit]);

    const fetchStudentsData = async () => {
        try {
            dispatch(setLoading(true));
            const response = await studentService.getStudents({
                page: pagination.page,
                limit: pagination.limit,
                search: searchTerm,
                role: filterRole,
                startDate,
                endDate
            });

            dispatch(setStudents({
                students: response.data || [],
                pagination: {
                    page: response.pagination?.page || 1,
                    limit: response.pagination?.limit || 10,
                    total: response.pagination?.totalItems || 0
                }
            }));

            setPagination({
                page: response.pagination?.page || 1,
                limit: response.pagination?.limit || 10,
                totalItems: response.pagination?.totalItems || 0,
                totalPages: response.pagination?.totalPages || 0,
            });
        } catch (err) {
            console.error('Error fetching students:', err);
            dispatch(setError(err.response?.data?.message || 'Failed to fetch students'));
        }
    };


    // Search and filtering is now handled server-side for performance
    const filteredStudents = students;

    const handleApplyFilters = () => {
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchStudentsData();
    };

    const clearFilters = () => {
        setSearchTerm('');
        setFilterRole('All');
        setStartDate('');
        setEndDate('');
        setPagination(prev => ({ ...prev, page: 1 }));
        // Using a slight delay to ensure state updates before fetch, or pass values directly
        setTimeout(() => fetchStudentsData(), 0);
    };

    const handleShareLink = () => {
        const referralCode = user?.id || user?._id || 'ADMIN123';
        const baseUrl = window.location.origin;
        const registrationUrl = `${baseUrl}/student-registration?ref=${referralCode}`;

        setGeneratedLink(registrationUrl);
        setShowAddModal(false);
        setShowLinkDialog(true);
        setLinkCopied(false);
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(generatedLink);
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleCreateManually = () => {
        setShowAddModal(false);
        navigate('/students/create');
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;

        try {
            await studentService.deleteStudent(deleteConfirm._id);
            toast.success(`Student deleted successfully`);
            setDeleteConfirm(null);
            fetchStudentsData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete student');
            setDeleteConfirm(null);
        }
    };

    return (
        <div className="p-6">
            {/* Header */}
            <PageHeader
                breadcrumbs={[
                    { label: 'Dashboard', link: '/dashboard' },
                    { label: 'Students List' }
                ]}
            />

            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Students Management</h1>
                <button
                    className="flex w-full md:w-auto items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition duration-200 cursor-pointer shadow-lg shadow-blue-100"
                    onClick={() => setShowAddModal(true)}
                >
                    <Plus size={18} />
                    <span>Add Student</span>
                </button>
            </div>

            {/* Filters Section */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    {/* Search Bar */}
                    <div className="md:col-span-5 relative">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" size={18} />
                            <input
                                type="text"
                                placeholder="Search by name, email, id, phone..."
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Referrer Role Filter */}
                    {(user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.ADMIN) && (
                        <div className="md:col-span-3">
                            <div className="relative">
                                <select
                                    value={filterRole}
                                    onChange={(e) => setFilterRole(e.target.value)}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm cursor-pointer"
                                >
                                    <option value="All">Referrer Role: All</option>
                                    <option value="Agent">Role: Agents</option>
                                    <option value="Admin">Role: Admins</option>
                                    <option value="Super Admin">Role: Super Admins</option>
                                </select>
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>
                    )}


                    {/* From Date */}
                    <div className="md:col-span-2">
                        <div className="relative">
                            <input
                                type="date"
                                placeholder="From Date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                            />
                        </div>
                    </div>

                    {/* To Date */}
                    <div className="md:col-span-2">
                        <div className="relative">
                            <input
                                type="date"
                                placeholder="To Date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                            />
                        </div>
                    </div>

                    {/* Buttons Row */}
                    <div className="md:col-span-12 flex justify-end gap-3 mt-6">
                        <button
                            onClick={handleApplyFilters}
                            className="px-6 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all text-sm shadow-sm flex items-center gap-2 cursor-pointer"
                        >
                            <Search size={16} />
                            Apply
                        </button>
                        <button
                            onClick={clearFilters}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all text-sm cursor-pointer"
                        >
                            Clear
                        </button>
                    </div>
                </div>

                {/* Filter Summary Badge */}
                {(filterRole !== 'All' || startDate || endDate || searchTerm) && (
                    <div className="mt-6 flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Active:</span>
                        <div className="flex flex-wrap gap-2">
                            {searchTerm && <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold uppercase">Search: {searchTerm}</span>}
                            {filterRole !== 'All' && <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase">Role: {filterRole}</span>}
                            {startDate && <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-bold uppercase">From: {startDate}</span>}
                            {endDate && <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-bold uppercase">To: {endDate}</span>}
                        </div>
                    </div>
                )}
            </div>

            {/* Add Student Dialog */}
            <AlertDialog open={showAddModal} onOpenChange={setShowAddModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Add New Student</AlertDialogTitle>
                        <AlertDialogDescription>
                            Choose how you would like to add a new student to the system.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleShareLink}
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            Share Link
                        </AlertDialogAction>
                        <AlertDialogAction
                            onClick={handleCreateManually}
                            className="bg-green-600 hover:bg-green-700 cursor-pointer"
                        >
                            Create Manually
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Share Link Dialog */}
            <AlertDialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Student Registration Link</AlertDialogTitle>
                        <AlertDialogDescription>
                            Share this linkwith the student to register. Their registration will be automatically tracked to your account.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="my-4 p-4 bg-gray-100 rounded-lg border border-gray-300">
                        <p className="text-sm text-gray-700 break-all font-mono">{generatedLink}</p>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowLinkDialog(false)}>Close</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCopyLink}
                            className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
                        >
                            {linkCopied ? (
                                <>
                                    <Check size={18} />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <Copy size={18} />
                                    Copy Link
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>


            {/* Loading State */}
            {loading && (
                <div className="bg-white rounded-2xl shadow-md p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="text-gray-600 mt-4">Loading students...</p>
                </div>
            )}

            {/* Error State */}
            {error && !loading && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
                    <p className="text-red-700 font-medium">Error: {error}</p>
                    <button
                        onClick={fetchStudentsData}
                        className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Empty State */}
            {!loading && !error && filteredStudents.length === 0 && (
                <div className="bg-white rounded-2xl shadow-md p-12 text-center">
                    <div className="text-gray-400 text-6xl mb-4">📚</div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No Students Found</h3>
                    <p className="text-gray-500 mb-6">
                        {searchTerm ? 'Try adjusting your search' : 'Get started by adding your first student'}
                    </p>
                    {!searchTerm && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 cursor-pointer"
                        >
                            Add First Student
                        </button>
                    )}
                </div>
            )}

            {/* Students Table */}
            {!loading && !error && filteredStudents.length > 0 && (
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Applied</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered On</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map((student, index) => (
                                    <tr key={student._id || student.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            #{(pagination.page - 1) * pagination.limit + index + 1}
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
                                            <div className="text-xs text-gray-500">{student.mobile || 'N/A'}</div>
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
                                                {student.isApplied ? (
                                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-100">
                                                        <span>{student.applicationCount || 0} Applied</span>
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
                                                ) : (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/pending-applications?studentId=${student._id}`);
                                                        }}
                                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                                                        title="Apply for Program"
                                                    >
                                                        <PlusCircle size={16} />
                                                        Apply
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => navigate(`/students/${student._id || student.id}`)}
                                                    className="text-green-600 hover:text-green-900 transition-colors cursor-pointer"
                                                    title="View Details"
                                                >
                                                    <Eye size={18} />
                                                </button>

                                                <button
                                                    onClick={() => navigate(`/students/${student._id || student.id}/edit`)}
                                                    className="text-blue-600 hover:text-blue-900 transition-colors cursor-pointer"
                                                    title="Edit"
                                                >
                                                    <Pencil size={18} />
                                                </button>

                                                <button
                                                    onClick={() => setDeleteConfirm(student)}
                                                    className="text-red-600 hover:text-red-900 transition-colors cursor-pointer"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
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
                                <button 
                                    className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={pagination.page === 1}
                                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                                >
                                    Previous
                                </button>
                                <button 
                                    className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={pagination.page >= pagination.totalPages}
                                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation AlertDialog */}
            <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the student{' '}
                            <strong>
                                {deleteConfirm?.firstName} {deleteConfirm?.lastName}
                            </strong>{' '}
                            and their associated record. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default StudentList;
