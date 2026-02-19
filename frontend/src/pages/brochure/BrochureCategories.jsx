import React, { useState, useEffect, useRef } from 'react';
import { brochureService } from '../../services/brochureService';
import { FiEdit2, FiSearch, FiTrash2, FiCheck, FiX } from 'react-icons/fi';
import PageHeader from '../../components/layout/PageHeader';
import { useToast } from '../../components/ui/toast';
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

const BrochureCategories = () => {
    const toast = useToast();
    const [categories, setCategories] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);

    // Search state
    const [searchTerm, setSearchTerm] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        name: '',
    });

    const [brochureTypes, setBrochureTypes] = useState([]);

    // Edit state
    const [editData, setEditData] = useState({});
    const hasFetchedRef = useRef(false);

    useEffect(() => {
        if (!hasFetchedRef.current) {
            hasFetchedRef.current = true;
            fetchData();
        }
    }, []);

    useEffect(() => {
        // Filter data based on search term
        if (searchTerm.trim() === '') {
            setFilteredData(categories);
        } else {
            const filtered = categories.filter(
                (cat) =>
                    cat.name?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredData(filtered);
        }
        setCurrentPage(1);
    }, [searchTerm, categories]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [catResponse, typeResponse] = await Promise.all([
                brochureService.getBrochureCategories(),
                brochureService.getBrochureTypes()
            ]);
            setCategories(catResponse.data || []);
            setFilteredData(catResponse.data || []);
            setBrochureTypes(typeResponse.data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Failed to load data. Please check your connection and try again.');
            setCategories([]);
            setFilteredData([]);
            setBrochureTypes([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFormChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleReset = () => {
        setFormData({ name: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error('Category name is required');
            return;
        }

        try {
            await brochureService.createCategory(formData);
            toast.success('Category created successfully');
            handleReset();
            fetchData();
        } catch (error) {
            console.error('Error saving category:', error);
            toast.error(error.response?.data?.message || 'Failed to save category');
        }
    };

    const startEdit = (category) => {
        const id = category._id || category.id;
        setEditingId(id);
        setEditData({ [id]: category.name });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditData({});
    };

    const saveEdit = async (id) => {
        try {
            await brochureService.updateCategory(id, { name: editData[id] });
            toast.success('Category updated successfully');
            setEditingId(null);
            setEditData({});
            fetchData();
        } catch (error) {
            console.error('Error updating category:', error);
            toast.error(error.response?.data?.message || 'Failed to update category');
        }
    };

    const handleEditChange = (id, value) => {
        setEditData({ ...editData, [id]: value });
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;

        try {
            await brochureService.deleteBrochureCategory(deleteConfirm._id || deleteConfirm.id);
            toast.success('Category deleted successfully');
            fetchData();
        } catch (error) {
            console.error('Error deleting category:', error);
            toast.error(error.response?.data?.message || 'Failed to delete category');
        } finally {
            setDeleteConfirm(null);
        }
    };

    // Pagination calculations
    const indexOfLastEntry = currentPage * entriesPerPage;
    const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
    const currentEntries = filteredData.slice(indexOfFirstEntry, indexOfLastEntry);
    const totalPages = Math.ceil(filteredData.length / entriesPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    if (loading) {
        return (
            <div className="p-6 flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <PageHeader
                breadcrumbs={[
                    { label: 'Dashboard', link: '/dashboard' },
                    { label: 'Brochure Categories' }
                ]}
            />
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Brochure Category</h1>
            </div>

            {/* Add New Record Form */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold text-purple-600 mb-4">Add New Record</h2>
                <form onSubmit={handleSubmit} className="flex items-end gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Enter Brochure Category
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleFormChange}
                            placeholder="Enter Brochure Category"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleReset}
                        className="px-6 py-2 bg-green-500 cursor-pointer hover:bg-green-600 text-white rounded-lg transition duration-200"
                    >
                        Reset
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-200 cursor-pointer"
                    >
                        Save
                    </button>
                </form>
            </div>

            {/* DataTable */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800">Lead Status List</h2>
                </div>

                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-700">Show</span>
                        <select
                            value={entriesPerPage}
                            onChange={(e) => {
                                setEntriesPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                        <span className="text-sm text-gray-700">entries</span>
                    </div>

                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-64"
                        />
                    </div>
                </div>

                {/* Table */}
                {currentEntries.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Sr. No.
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Brochure Category
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentEntries.map((category, index) => (
                                    <tr key={category._id || category.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {indexOfFirstEntry + index + 1}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {editingId === (category._id || category.id) ? (
                                                <input
                                                    type="text"
                                                    value={editData[category._id || category.id] || ''}
                                                    onChange={(e) => handleEditChange(category._id || category.id, e.target.value)}
                                                    className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                />
                                            ) : (
                                                category.name
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-3">
                                                {editingId === (category._id || category.id) ? (
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => saveEdit(category._id || category.id)}
                                                            className="text-green-600 hover:text-green-900 cursor-pointer"
                                                            title="Save"
                                                        >
                                                            <FiCheck size={18} />
                                                        </button>
                                                        <button
                                                            onClick={cancelEdit}
                                                            className="text-gray-600 hover:text-gray-900 cursor-pointer"
                                                            title="Cancel"
                                                        >
                                                            <FiX size={18} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => startEdit(category)}
                                                            className="text-indigo-600 hover:text-indigo-900 cursor-pointer"
                                                            title="Edit"
                                                        >
                                                            <FiEdit2 size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteConfirm(category)}
                                                            className="text-red-600 hover:text-red-900 cursor-pointer"
                                                            title="Delete"
                                                        >
                                                            <FiTrash2 size={18} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <p className="text-gray-500">No categories found</p>
                    </div>
                )}

                {/* Pagination */}
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                        Showing {filteredData.length === 0 ? 0 : indexOfFirstEntry + 1} to{' '}
                        {Math.min(indexOfLastEntry, filteredData.length)} of {filteredData.length} entries
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`px-3 py-1 border border-gray-300 rounded text-sm ${currentPage === 1
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:bg-gray-50 cursor-pointer'
                                }`}
                        >
                            Previous
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`px-3 py-1 border rounded text-sm ${currentPage === page
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                {page}
                            </button>
                        ))}

                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className={`px-3 py-1 border border-gray-300 rounded text-sm ${currentPage === totalPages || totalPages === 0
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:bg-gray-50 cursor-pointer'
                                }`}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation AlertDialog */}
            <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the category{' '}
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

export default BrochureCategories;
