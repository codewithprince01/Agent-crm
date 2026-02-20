import React, { useState, useEffect } from 'react';
import userService from '../../services/userService';
import { useNavigate, Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import { ROLES } from '../../utils/constants';
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '../../components/ui/dialog';
import { useToast } from '../../components/ui/toast';

const AdminList = () => {
    const navigate = useNavigate();
    const { success, error: showError } = useToast();
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    });

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
    const [currentAdmin, setCurrentAdmin] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        status: 'active',
    });
    const [formError, setFormError] = useState('');
    const [formLoading, setFormLoading] = useState(false);

    // Delete confirmation state
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const fetchAdmins = async (page = 1) => {
        try {
            setLoading(true);
            const data = await userService.getUsers({
                role: ROLES.ADMIN,
                page,
                limit: pagination.limit,
            });
            setAdmins(data.data || []);
            setPagination({
                ...pagination,
                page: data.pagination?.page || page,
                total: data.pagination?.total || 0,
                totalPages: data.pagination?.totalPages || 0,
            });
            setError(null);
        } catch (err) {
            setError('Failed to fetch admins');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchAdmins(newPage);
        }
    };

    const openAddModal = () => {
        setModalMode('add');
        setCurrentAdmin(null);
        setFormData({ name: '', email: '', phone: '', password: '', status: 'active' });
        setFormError('');
        setIsModalOpen(true);
    };

    const openEditModal = (admin) => {
        setModalMode('edit');
        setCurrentAdmin(admin);
        setFormData({
            name: admin.name,
            email: admin.email,
            phone: admin.phone || '',
            password: '',
            status: admin.status,
        });
        setFormError('');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentAdmin(null);
        setFormData({ name: '', email: '', phone: '', password: '', status: 'active' });
        setFormError('');
    };

    const handleFormChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setFormLoading(true);

        try {
            if (modalMode === 'add') {
                if (!formData.password || formData.password.length < 6) {
                    setFormError('Password must be at least 6 characters');
                    setFormLoading(false);
                    return;
                }
                await userService.createUser(formData);
                success('Admin created successfully');
            } else {
                const updateData = {
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    status: formData.status,
                };
                if (formData.password) {
                    if (formData.password.length < 6) {
                        setFormError('Password must be at least 6 characters');
                        setFormLoading(false);
                        return;
                    }
                    updateData.password = formData.password;
                }
                await userService.updateUser(currentAdmin._id, updateData);
                success('Admin updated successfully');
            }
            closeModal();
            fetchAdmins(pagination.page);
        } catch (err) {
            setFormError(err.response?.data?.message || 'Operation failed');
            showError(err.response?.data?.message || 'Operation failed');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;

        try {
            await userService.deleteUser(deleteConfirm._id);
            success(`Admin "${deleteConfirm.name}" deleted successfully`);
            setDeleteConfirm(null);
            fetchAdmins(pagination.page);
        } catch (err) {
            showError(err.response?.data?.message || 'Failed to delete admin');
            setDeleteConfirm(null);
        }
    };

    if (loading && admins.length === 0) {
        return (
            <div className="p-6 flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <PageHeader
                breadcrumbs={[
                    { label: 'Dashboard', link: '/dashboard' },
                    { label: 'Admins List' }
                ]}
            />

            {/* Title & Action Row */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Admin Management</h1>
                    <p className="text-gray-500 text-sm font-medium mt-1">Manage and monitor administrative access.</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center justify-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] group w-full sm:w-auto"
                >
                    <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                    <span>Add New Admin</span>
                </button>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Last Login
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {admins.length > 0 ? (
                                admins.map((admin, index) => (
                                    <tr key={admin._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            #{(pagination.page - 1) * pagination.limit + index + 1}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {admin.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {admin.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${admin.status === 'active'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                    }`}
                                            >
                                                {admin.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {admin.lastLogin
                                                ? new Date(admin.lastLogin).toLocaleString()
                                                : 'Never'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-3">
                                                <button
                                                    onClick={() => openEditModal(admin)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(admin)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center"
                                    >
                                        No admins found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 sm:px-6">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Showing{' '}
                            <span className="font-medium">
                                {(pagination.page - 1) * pagination.limit + 1}
                            </span>{' '}
                            to{' '}
                            <span className="font-medium">
                                {Math.min(
                                    pagination.page * pagination.limit,
                                    pagination.total
                                )}
                            </span>{' '}
                            of <span className="font-medium">{pagination.total}</span> results
                        </div>
                        <div className="flex space-x-2">
                            {/* Previous Button */}
                            <button
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={pagination.page === 1}
                                className={`px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 ${pagination.page === 1
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'hover:bg-gray-50 cursor-pointer'
                                    }`}
                            >
                                Previous
                            </button>

                            {/* Page Numbers */}
                            {(() => {
                                const pages = [];
                                const totalPages = pagination.totalPages;
                                const currentPage = pagination.page;

                                // Always show first page
                                if (totalPages > 0) {
                                    pages.push(
                                        <button
                                            key={1}
                                            onClick={() => handlePageChange(1)}
                                            className={`px-3 py-1 border rounded text-sm ${currentPage === 1
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer'
                                                }`}
                                        >
                                            1
                                        </button>
                                    );
                                }

                                // Show ellipsis if there are pages between 1 and currentPage-1
                                if (currentPage > 3) {
                                    pages.push(
                                        <span key="ellipsis-1" className="px-2 py-1 text-gray-500">
                                            ...
                                        </span>
                                    );
                                }

                                // Show pages around current page
                                for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                                    pages.push(
                                        <button
                                            key={i}
                                            onClick={() => handlePageChange(i)}
                                            className={`px-3 py-1 border rounded text-sm ${currentPage === i
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer'
                                                }`}
                                        >
                                            {i}
                                        </button>
                                    );
                                }

                                // Show ellipsis if there are pages between currentPage+1 and last page
                                if (currentPage < totalPages - 2) {
                                    pages.push(
                                        <span key="ellipsis-2" className="px-2 py-1 text-gray-500">
                                            ...
                                        </span>
                                    );
                                }

                                // Always show last page (if more than 1 page)
                                if (totalPages > 1) {
                                    pages.push(
                                        <button
                                            key={totalPages}
                                            onClick={() => handlePageChange(totalPages)}
                                            className={`px-3 py-1 border rounded text-sm ${currentPage === totalPages
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer'
                                                }`}
                                        >
                                            {totalPages}
                                        </button>
                                    );
                                }

                                return pages;
                            })()}

                            {/* Next Button */}
                            <button
                                onClick={() => handlePageChange(pagination.page + 1)}
                                disabled={pagination.page === pagination.totalPages}
                                className={`px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 ${pagination.page === pagination.totalPages
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'hover:bg-gray-50 cursor-pointer'
                                    }`}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Admin Form Dialog */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {modalMode === 'add' ? 'Add New Admin' : 'Edit Admin'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4 py-4">
                            {formError && (
                                <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
                                    {formError}
                                </div>
                            )}

                            <div>
                                <label
                                    htmlFor="name"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                    Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleFormChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="Enter admin name"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="email"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleFormChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="admin@example.com"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="phone"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                    Phone
                                </label>
                                <input
                                    type="text"
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleFormChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="Enter phone number"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="password"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                    Password {modalMode === 'edit' ? '' : <span className="text-red-500">*</span>}
                                </label>
                                {modalMode === 'edit' && (
                                    <p className="text-xs text-gray-500 mb-1">
                                        Leave blank to keep current password
                                    </p>
                                )}
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleFormChange}
                                    required={modalMode === 'add'}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="Enter password (min 6 characters)"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="status"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                    Status <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="status"
                                    name="status"
                                    value={formData.status}
                                    onChange={handleFormChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>

                        <DialogFooter>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={formLoading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                {formLoading ? 'Saving...' : modalMode === 'add' ? 'Create Admin' : 'Update Admin'}
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation AlertDialog */}
            <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the admin account for{' '}
                            <strong>{deleteConfirm?.name}</strong>. This action cannot be undone.
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

export default AdminList;