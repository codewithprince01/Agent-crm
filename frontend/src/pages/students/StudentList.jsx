import React, { useState, useEffect } from 'react';
import { Search, X, Plus, Copy, Check, PlusCircle } from 'lucide-react';
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
        <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Students Management</h1>
                    <p className="text-gray-600">Manage and monitor all registered students</p>
                </div>
                <button
                    className="bg-indigo-600 text-white rounded-lg px-6 py-3 font-medium hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg"
                    onClick={() => setShowAddModal(true)}
                >
                    <Plus size={20} />
                    Add Student
                </button>
            </div>

            {/* Filters Section */}
            <div className="bg-white rounded-3xl shadow-sm p-8 mb-8 border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    {/* Search Bar */}
                    <div className="md:col-span-5 relative">
                        <div className="relative">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by name, email, id, phone..."
                                className="w-full pl-14 pr-6 py-4 bg-white border border-gray-300 rounded-full focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium placeholder:text-gray-400 shadow-sm"
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
                                    className="w-full px-6 py-4 bg-white border border-gray-300 rounded-full focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium appearance-none shadow-sm cursor-pointer"
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
                                className="w-full px-6 py-4 bg-white border border-gray-300 rounded-full focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium shadow-sm"
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
                                className="w-full px-6 py-4 bg-white border border-gray-300 rounded-full focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Buttons Row */}
                    <div className="md:col-span-12 flex justify-end gap-3 mt-6">
                        <button
                            onClick={handleApplyFilters}
                            className="px-8 py-3 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 transition-all text-sm shadow-md flex items-center gap-2"
                        >
                            <Search size={18} />
                            Apply filter
                        </button>
                        <button
                            onClick={clearFilters}
                            className="px-8 py-3 border-2 border-indigo-600 text-indigo-600 rounded-full font-bold hover:bg-indigo-50 transition-all text-sm"
                        >
                            Clear filter
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
                            className="bg-green-600 hover:bg-green-700"
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
                        className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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
                            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
                        >
                            Add First Student
                        </button>
                    )}
                </div>
            )}

            {/* Students Table */}
            {!loading && !error && filteredStudents.length > 0 && (
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
                                    <th className="p-4 text-left font-semibold text-xs uppercase tracking-wider text-center">Applied</th>
                                    <th className="p-4 text-left font-semibold text-xs uppercase tracking-wider">Registered On</th>
                                    <th className="p-4 text-left font-semibold text-xs uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map((student, index) => (
                                    <tr key={student._id || student.id} className="border-b border-gray-300 hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            <span className="font-semibold text-indigo-600">
                                                #{(pagination.page - 1) * pagination.limit + index + 1}
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
                                                    {student.mobile || 'N/A'}
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
                                                {student.isApplied ? (
                                                    <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all min-w-[180px]">
                                                        <span className="text-gray-700 text-sm font-semibold">
                                                            Total Applied: {student.applicationCount || 0}
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
                                                ) : (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/pending-applications?studentId=${student._id}`);
                                                        }}
                                                        className="px-4 py-2.5 bg-white text-indigo-600 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:bg-indigo-50 transition-all flex items-center gap-2 text-sm font-semibold"
                                                        title="Apply for Program"
                                                    >
                                                        <PlusCircle size={16} />
                                                        Apply Now
                                                    </button>
                                                )}
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
                                                    onClick={() => navigate(`/students/${student._id || student.id}`)}
                                                    className="px-3 py-1.5 border border-blue-300 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-600 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                                                    title="View Details"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                                    </svg>
                                                    <span className="sr-only">View</span>
                                                </button>

                                                <button
                                                    onClick={() => navigate(`/students/${student._id || student.id}/edit`)}
                                                    className="px-3 py-1.5 border border-green-300 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-600 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                                                    title="Edit"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                    </svg>
                                                    <span className="sr-only">Edit</span>
                                                </button>

                                                <button
                                                    onClick={() => setDeleteConfirm(student)}
                                                    className="px-3 py-1.5 border border-red-300 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-600 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                                                    title="Delete"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                    <span className="sr-only">Delete</span>
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

            {!loading && !error && filteredStudents.length > 0 && (
                <div className="flex justify-between items-center bg-white px-6 py-5 rounded-2xl shadow-md border border-gray-300 mt-6">
                    <div className="text-gray-600 text-sm">
                        Showing <strong className="text-gray-800 font-semibold">{filteredStudents.length}</strong> of <strong className="text-gray-800 font-semibold">{students.length}</strong> students
                    </div>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                            Previous
                        </button>
                        <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                            Next
                        </button>
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
