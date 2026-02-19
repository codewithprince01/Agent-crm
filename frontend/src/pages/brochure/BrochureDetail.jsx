import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { brochureService } from '../../services/brochureService';
import { FiTrash2, FiSearch, FiExternalLink, FiFileText, FiCopy, FiDownload, FiEdit3, FiX } from 'react-icons/fi';
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

const FILE_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '');

const BrochureDetail = () => {
    const toast = useToast();
    const navigate = useNavigate();
    const { upId } = useParams();

    const [brochures, setBrochures] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [upDetails, setUpDetails] = useState(null);
    const [categories, setCategories] = useState([]);
    const [brochureTypes, setBrochureTypes] = useState([]);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [editingBrochure, setEditingBrochure] = useState(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);

    // Search state
    const [searchTerm, setSearchTerm] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        category_id: '',
        file: null,
    });

    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchUPDetails();
        fetchCategories();
        fetchBrochureTypes();
        fetchBrochures();
    }, [upId]);

    useEffect(() => {
        // Filter data based on search term
        if (searchTerm.trim() === '') {
            setFilteredData(brochures);
        } else {
            const filtered = brochures.filter(
                (brochure) =>
                    getCategoryName(brochure.category_id)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (brochure.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (brochure.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                    brochure.date?.includes(searchTerm)
            );
            setFilteredData(filtered);
        }
        setCurrentPage(1);
    }, [searchTerm, brochures]);

    const getCategoryName = (categoryId) => {
        if (!categoryId) return 'Unknown';

        // If already populated as an object
        if (typeof categoryId === 'object') {
            if (categoryId.name) return categoryId.name;
            // Fallback to checking by ID if it's an object but name is missing for some reason
            const searchId = categoryId._id || categoryId.id;
            const category = (categories || []).find(c => (c._id || c.id) === searchId);
            return category ? category.name : 'Unknown';
        }

        // If it's just an ID
        const category = (categories || []).find(c => (c._id || c.id) === categoryId);
        return category ? category.name : 'Unknown';
    };

    const fetchUPDetails = async () => {
        try {
            const response = await brochureService.getUPById(upId);
            setUpDetails(response.data);
        } catch (error) {
            console.error('Error fetching UP details:', error);
            toast.error('Failed to load University details');
        }
    };

    const fetchBrochureTypes = async () => {
        try {
            const response = await brochureService.getBrochureTypes();
            setBrochureTypes(response.data || []);
        } catch (error) {
            console.error('Error fetching brochure types:', error);
        }
    };

    const getTypeName = (typeData) => {
        if (!typeData) return 'Unknown';
        if (typeof typeData === 'object' && typeData.name) return typeData.name;

        const id = typeof typeData === 'object' ? (typeData._id || typeData.id) : typeData;
        const type = (brochureTypes || []).find(t => (t._id || t.id) === id);
        return type ? type.name : 'Unknown';
    };

    const fetchCategories = async () => {
        try {
            const response = await brochureService.getBrochureCategories();
            setCategories(response.data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Failed to load categories');
        }
    };

    const fetchBrochures = async () => {
        try {
            setLoading(true);
            const response = await brochureService.getBrochures(upId);
            setBrochures(response.data || []);
            setFilteredData(response.data || []);
        } catch (error) {
            console.error('Error fetching brochures:', error);
            toast.error('Failed to load brochures');
        } finally {
            setLoading(false);
        }
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setFormData({
            ...formData,
            file: file,
        });
    };

    const handleReset = () => {
        setFormData({
            title: '',
            category_id: '',
            file: null,
        });
        setEditingBrochure(null);
        // Reset file input
        const fileInput = document.getElementById('brochure-file');
        if (fileInput) fileInput.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.category_id) {
            toast.error('Category is required');
            return;
        }

        if (!formData.file && !editingBrochure) {
            toast.error('Please upload a brochure file');
            return;
        }

        try {
            setUploading(true);
            const formDataToSubmit = new FormData();
            formDataToSubmit.append('title', formData.title);
            formDataToSubmit.append('category_id', formData.category_id);
            // In the backend, we map category_id to brochure_category_id
            formDataToSubmit.append('brochure_category_id', formData.category_id);

            if (formData.file) {
                formDataToSubmit.append('file', formData.file);
            }

            if (editingBrochure) {
                await brochureService.updateBrochure(editingBrochure._id || editingBrochure.id, formDataToSubmit);
                toast.success('Brochure updated successfully');
            } else {
                await brochureService.createBrochure(upId, formDataToSubmit);
                toast.success('Brochure uploaded successfully');
            }

            handleReset();
            fetchBrochures();
        } catch (error) {
            console.error('Submit error:', error);
            toast.error(editingBrochure ? 'Failed to update brochure' : 'Failed to upload brochure');
        } finally {
            setUploading(false);
        }
    };

    const handleEdit = (brochure) => {
        setEditingBrochure(brochure);
        setFormData({
            title: brochure.title || '',
            category_id: brochure.brochure_category_id?._id || brochure.brochure_category_id || '',
            file: null,
        });
        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDownload = async (fileUrl, fileName) => {
        try {
            const response = await fetch(`${FILE_BASE_URL}${fileUrl}`);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName || 'brochure.pdf');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Failed to download brochure');
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;

        try {
            await brochureService.deleteBrochure(deleteConfirm._id || deleteConfirm.id);
            toast.success('Brochure deleted successfully');
            fetchBrochures();
        } catch (error) {
            console.error('Error deleting brochure:', error);
            toast.error(error.response?.data?.message || 'Failed to delete brochure');
        } finally {
            setDeleteConfirm(null);
        }
    };

    const handleCopyLink = (url) => {
        if (!url) return;
        const fullUrl = url.startsWith('http') ? url : `${FILE_BASE_URL}${url}`;
        navigator.clipboard.writeText(fullUrl).then(() => {
            toast.success('Link copied to clipboard');
        }).catch((err) => {
            console.error('Failed to copy: ', err);
            toast.error('Failed to copy link');
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
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
            {/* Header with Breadcrumb */}
            <PageHeader
                breadcrumbs={[
                    { label: 'Dashboard', link: '/dashboard' },
                    { label: 'University Programs', link: '/brochure/university-programs' },
                    { label: upDetails?.name || 'Loading...' }
                ]}
            />
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Upload Brochure</h1>
                {upDetails && (
                    <p className="text-sm text-gray-600 mt-1">
                        {getTypeName(upDetails.brochure_type_id)} - {upDetails.country}
                    </p>
                )}
            </div>

            {/* Upload/Edit Form */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">
                        {editingBrochure ? 'Edit Brochure' : 'Upload Brochure'}
                    </h2>
                    {editingBrochure && (
                        <button
                            onClick={handleReset}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Cancel Edit"
                        >
                            <FiX size={24} />
                        </button>
                    )}
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                University
                            </label>
                            <input
                                type="text"
                                value={upDetails?.name || ''}
                                readOnly
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 text-sm cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Brochure Category
                            </label>
                            <select
                                name="category_id"
                                value={formData.category_id}
                                onChange={handleFormChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                                <option value="">Select Category</option>
                                {categories.map(cat => (
                                    <option key={cat._id || cat.id} value={cat._id || cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Brochure Title
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleFormChange}
                                placeholder="Enter Brochure Title"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>


                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Brochure
                            </label>
                            <input
                                type="file"
                                id="brochure-file"
                                onChange={handleFileChange}
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                            {formData.file && (
                                <p className="mt-1 text-sm text-gray-600">
                                    Selected: {formData.file.name}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-4 justify-end">
                        <button
                            type="button"
                            onClick={handleReset}
                            className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition duration-200"
                        >
                            Reset
                        </button>
                        <button
                            type="submit"
                            disabled={uploading}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {uploading ? 'Uploading...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>

            {/* DataTable */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800">Record List</h2>
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
                                        Category
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Title
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        File
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        URL
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentEntries.map((brochure, index) => (
                                    <tr key={brochure._id || brochure.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {indexOfFirstEntry + index + 1}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {getCategoryName(brochure.brochure_category_id)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {brochure.title || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {formatDate(brochure.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex items-center space-x-3">
                                                {brochure.fileUrl ? (
                                                    <>
                                                        <a
                                                            href={`${FILE_BASE_URL}${brochure.fileUrl}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center text-blue-600 hover:text-blue-900"
                                                            title="View Brochure"
                                                        >
                                                            <FiFileText size={16} className="mr-1" />
                                                            View
                                                        </a>
                                                        <button
                                                            onClick={() => handleDownload(brochure.fileUrl, brochure.name)}
                                                            className="inline-flex items-center text-green-600 hover:text-green-900"
                                                            title="Download Brochure"
                                                        >
                                                            <FiDownload size={16} className="mr-1" />
                                                            Download
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {brochure.url ? (
                                                <button
                                                    onClick={() => handleCopyLink(brochure.url)}
                                                    className="inline-flex items-center text-blue-600 hover:text-blue-900 px-3 py-1 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors cursor-pointer"
                                                    title="Copy shared link"
                                                >
                                                    <FiCopy size={16} className="mr-1" />
                                                    Copy Link
                                                </button>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center space-x-3">
                                                <button
                                                    onClick={() => handleEdit(brochure)}
                                                    className="text-indigo-600 hover:text-indigo-900 cursor-pointer"
                                                    title="Edit"
                                                >
                                                    <FiEdit3 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(brochure)}
                                                    className="text-red-600 hover:text-red-900 cursor-pointer"
                                                    title="Delete"
                                                >
                                                    <FiTrash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <p className="text-gray-500">No brochures found</p>
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
                            This will permanently delete this brochure. This action cannot be undone.
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

export default BrochureDetail;
