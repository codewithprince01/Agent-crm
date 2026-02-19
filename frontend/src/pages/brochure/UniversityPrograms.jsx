import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { brochureService } from '../../services/brochureService';
import { FiEdit2, FiPlus, FiSearch, FiTrash2, FiCheck, FiX, FiUsers } from 'react-icons/fi';
import PageHeader from '../../components/layout/PageHeader';
import { useToast } from '../../components/ui/toast';
import apiClient from '../../services/apiClient';
import AgentAssignmentModal from './components/AgentAssignmentModal';
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

const UniversityPrograms = () => {
    const toast = useToast();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const typeIdFromUrl = searchParams.get('type');

    const [universityPrograms, setUniversityPrograms] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [countryOptions, setCountryOptions] = useState([]);
    const [brochureTypes, setBrochureTypes] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [doubleConfirm, setDoubleConfirm] = useState(false);

    // Assignment state
    const { user } = useSelector((state) => state.auth);
    const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
    const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
    const [assignmentStats, setAssignmentStats] = useState({});
    const [fetchingStats, setFetchingStats] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        brochure_type_id: typeIdFromUrl || '',
        country: '',
        name: '',
    });

    // Edit state
    const [editData, setEditData] = useState({});
    const hasFetchedRef = useRef(false);

    useEffect(() => {
        if (!hasFetchedRef.current) {
            hasFetchedRef.current = true;
            fetchInitialData();
            if (isAdmin) fetchAssignmentStats();
        }
    }, [typeIdFromUrl, isAdmin]);

    useEffect(() => {
        // Filter data based on search query
        if (searchQuery.trim() === '') {
            setFilteredData(universityPrograms);
        } else {
            const filtered = universityPrograms.filter(
                (up) =>
                    up.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    up.country?.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredData(filtered);
        }
        setCurrentPage(1);
    }, [searchQuery, universityPrograms]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            // Fetch all data concurrently
            const [programsResponse, countriesResponse, typesResponse] = await Promise.all([
                typeIdFromUrl
                    ? brochureService.getUniversityPrograms(typeIdFromUrl)
                    : brochureService.getAllUniversityPrograms(),
                brochureService.getCountries(),
                brochureService.getBrochureTypes()
            ]);

            // Set countries and types first
            setCountryOptions(countriesResponse?.data || (Array.isArray(countriesResponse) ? countriesResponse : []));
            setBrochureTypes(typesResponse?.data || (Array.isArray(typesResponse) ? typesResponse : []));

            // Set university programs directly without fetching brochure counts
            // (to avoid excessive API calls and rate limiting)
            const ups = programsResponse?.data || (Array.isArray(programsResponse) ? programsResponse : []);
            setUniversityPrograms(ups);
            setFilteredData(ups);

        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load data. Please check your connection and try again.');
            setUniversityPrograms([]);
            setFilteredData([]);
            setCountryOptions([]);
            setBrochureTypes([]);
        } finally {
            setLoading(false);
        }
    };

    // Refetch only programs after CUD operations
    const refetchPrograms = async () => {
        setLoading(true);
        try {
            let response;
            if (typeIdFromUrl) {
                response = await brochureService.getUniversityPrograms(typeIdFromUrl);
            } else {
                response = await brochureService.getAllUniversityPrograms();
            }

            // Set university programs directly without fetching brochure counts
            const ups = response?.data || (Array.isArray(response) ? response : []);
            setUniversityPrograms(ups);
            setFilteredData(ups);
        } catch (error) {
            console.error('Error refetching university programs:', error);
            toast.error('Failed to refetch university programs');
            // Fallback to mock data if refetch fails
            let mockData = [];
            if (typeIdFromUrl) {
                mockData = mockUniversityPrograms[typeIdFromUrl] || [];
            } else {
                mockData = Object.values(mockUniversityPrograms).flat();
            }
            setUniversityPrograms(mockData);
            setFilteredData(mockData);
        } finally {
            setLoading(false);
        }
    };


    const fetchAssignmentStats = async () => {
        setFetchingStats(true);
        try {
            const response = await apiClient.get('/agent-university/stats/assignment-counts');
            const stats = {};
            (response.data.data || []).forEach(item => {
                stats[item._id] = {
                    count: item.count,
                    agentIds: item.agents
                };
            });
            setAssignmentStats(stats);
        } catch (error) {
            console.error('Error fetching assignment stats:', error);
        } finally {
            setFetchingStats(false);
        }
    };

    const handleFormChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleReset = () => {
        setFormData({
            brochure_type_id: typeIdFromUrl || '',
            country: '',
            name: '',
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.country || !formData.name.trim()) {
            toast.error('Country and name are required');
            return;
        }

        try {
            await brochureService.createUniversityProgram(formData);
            toast.success('University/Program created successfully');
            handleReset();
            refetchPrograms(); // Use refetchPrograms
        } catch (error) {
            console.error('Error saving university/program:', error);
            toast.error(error.response?.data?.message || 'Failed to save university/program');
        }
    };

    const handleSearch = () => {
        // Search is already handled by useEffect
        toast.success('Search applied');
    };

    const handleSearchReset = () => {
        setSearchQuery('');
        toast.success('Search cleared');
    };

    const startEdit = (up) => {
        const id = up._id || up.id;
        setEditingId(id);
        setEditData({
            [id]: {
                name: up.name,
                country: up.country,
            }
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditData({});
    };

    const saveEdit = async (id) => {
        try {
            await brochureService.updateUniversityProgram(id, editData[id]);
            toast.success('University/Program updated successfully');
            setEditingId(null);
            setEditData({});
            refetchPrograms(); // Use refetchPrograms
        } catch (error) {
            console.error('Error updating university/program:', error);
            toast.error(error.response?.data?.message || 'Failed to update university/program');
        }
    };

    const handleEditChange = (id, field, value) => {
        setEditData({
            ...editData,
            [id]: {
                ...editData[id],
                [field]: value,
            }
        });
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;

        // If there are brochures, show the second confirmation
        if (deleteConfirm.brochureCount > 0 && !doubleConfirm) {
            setDoubleConfirm(true);
            return;
        }

        await handleFinalDelete();
    };

    const handleFinalDelete = async () => {
        try {
            await brochureService.deleteUniversityProgram(deleteConfirm._id || deleteConfirm.id);
            toast.success('University/Program and all associated brochures deleted successfully');
            refetchPrograms();
        } catch (error) {
            console.error('Error deleting university/program:', error);
            toast.error(error.response?.data?.message || 'Failed to delete university/program');
        } finally {
            setDeleteConfirm(null);
            setDoubleConfirm(false);
        }
    };

    const navigateToBrochures = (upId) => {
        navigate(`/brochure/university/${upId}`);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === currentEntries.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(currentEntries.map(up => (up._id || up.id)));
        }
    };

    const toggleSelect = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const getTypeName = (typeData) => {
        if (!typeData) return 'Unknown';

        // If it's a populated object with a name
        if (typeof typeData === 'object' && typeData.name) {
            return typeData.name;
        }

        // Otherwise search in our brochureTypes list
        const searchId = typeof typeData === 'object' ? (typeData._id || typeData.id) : typeData;

        if (!searchId) return 'Unknown';

        const type = (brochureTypes || []).find(t => (t._id || t.id) === searchId);
        return type ? type.name : 'Unknown';
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
                    { label: 'University Programs' }
                ]}
            />
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">University and Program</h1>
                {typeIdFromUrl && (
                    <p className="text-sm text-gray-600 mt-1">
                        Filtered by: {getTypeName(typeIdFromUrl)}
                    </p>
                )}
            </div>

            {/* Add New Record Form */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold text-purple-600 mb-4">Add New Record</h2>
                <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
                    {!typeIdFromUrl && (
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Brochure Type
                            </label>
                            <select
                                name="brochure_type_id"
                                value={formData.brochure_type_id}
                                onChange={handleFormChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                                <option value="">Select Type</option>
                                {(brochureTypes || []).map(type => (
                                    <option key={type._id || type.id} value={type._id || type.id}>{type.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Country
                        </label>
                        <select
                            name="country"
                            value={formData.country}
                            onChange={handleFormChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                            <option value="">Select Country</option>
                            {(countryOptions || []).map(country => (
                                <option key={country.code || country.name} value={country.name}>{country.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Enter Brochure universities and programs
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleFormChange}
                            placeholder="Enter Brochure universities and programs"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleReset}
                        className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition duration-200 cursor-pointer"
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

            {/* Search Section */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <h3 className="text-sm font-semibold text-blue-600 mb-3">Search by country and name</h3>
                <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search by country and name"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition duration-200 cursor-pointer"
                    >
                        Search
                    </button>
                    <button
                        onClick={handleSearchReset}
                        className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition duration-200 cursor-pointer"
                    >
                        Reset
                    </button>
                </div>
            </div>

            {/* DataTable */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-800">Record List</h2>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-700">Show</span>
                        <select
                            value={entriesPerPage}
                            onChange={(e) => {
                                setEntriesPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                        <span className="text-sm text-gray-700">entries</span>
                    </div>
                </div>

                {/* Bulk Actions Bar */}
                {isAdmin && selectedIds.length > 0 && (
                    <div className="mx-4 my-4 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                                {selectedIds.length}
                            </div>
                            <div>
                                <h4 className="text-blue-900 font-bold text-sm">Universities Selected</h4>
                                <p className="text-blue-700 text-xs">Ready for bulk assignment to agents.</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setSelectedIds([])}
                                className="px-4 py-2 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-semibold transition-all cursor-pointer"
                            >
                                Clear Selection
                            </button>
                            <button
                                onClick={() => setAssignmentModalOpen(true)}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95 cursor-pointer"
                            >
                                <FiUsers />
                                Assign Agents
                            </button>
                        </div>
                    </div>
                )}

                {/* Table */}
                {currentEntries.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.length === currentEntries.length && currentEntries.length > 0}
                                            onChange={toggleSelectAll}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Sr. No.
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Country
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Brochure Count
                                    </th>
                                    {isAdmin && (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Assigned Agents
                                        </th>
                                    )}
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentEntries.map((up, index) => (
                                    <tr key={up._id || up.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(up._id || up.id)}
                                                onChange={() => toggleSelect(up._id || up.id)}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {indexOfFirstEntry + index + 1}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {getTypeName(up.brochure_type_id)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {editingId === (up._id || up.id) ? (
                                                <select
                                                    value={editData[up._id || up.id]?.country || ''}
                                                    onChange={(e) => handleEditChange(up._id || up.id, 'country', e.target.value)}
                                                    className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm cursor-pointer"
                                                >
                                                    {(countryOptions || []).map(country => (
                                                        <option key={country.code || country.name} value={country.name}>{country.name}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                up.country
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {editingId === (up._id || up.id) ? (
                                                <input
                                                    type="text"
                                                    value={editData[up._id || up.id]?.name || ''}
                                                    onChange={(e) => handleEditChange(up._id || up.id, 'name', e.target.value)}
                                                    className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
                                                />
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => navigateToBrochures(up._id || up.id)}
                                                        className="text-blue-600 hover:text-blue-900 cursor-pointer font-medium"
                                                    >
                                                        {up.name}
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {up.brochureCount || 0}
                                        </td>
                                        {isAdmin && (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <button
                                                    onClick={() => {
                                                        setSelectedIds([up._id || up.id]);
                                                        setAssignmentModalOpen(true);
                                                    }}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 transition-all border border-blue-100 hover:border-blue-200 shadow-sm active:scale-95 group cursor-pointer"
                                                    title={`Manage agent assignments for ${up.name}`}
                                                >
                                                    <FiUsers size={14} className="text-blue-500 group-hover:scale-110 transition-transform" />
                                                    {assignmentStats[up._id]?.count || 0} Agents
                                                </button>
                                            </td>
                                        )}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-3">
                                                {editingId === (up._id || up.id) ? (
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => saveEdit(up._id || up.id)}
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
                                                            onClick={() => startEdit(up)}
                                                            className="text-indigo-600 hover:text-indigo-900 cursor-pointer"
                                                            title="Edit"
                                                        >
                                                            <FiEdit2 size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteConfirm(up)}
                                                            className="text-red-600 hover:text-red-900 cursor-pointer"
                                                            title="Delete"
                                                        >
                                                            <FiTrash2 size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => navigateToBrochures(up._id || up.id)}
                                                            className="text-blue-600 hover:text-blue-900 cursor-pointer"
                                                            title="View Brochures"
                                                        >
                                                            <FiPlus size={18} />
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
                    <div className="p-12 text-center text-gray-500">
                        No university/programs found
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
                                    ? 'bg-blue-600 text-white border-blue-600 font-bold'
                                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                    } cursor-pointer`}
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
            <AlertDialog
                open={!!deleteConfirm}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteConfirm(null);
                        setDoubleConfirm(false);
                    }
                }}
            >
                <AlertDialogContent className="rounded-2xl">
                    {!doubleConfirm ? (
                        <>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete the university/program{' '}
                                    <strong>{deleteConfirm?.name}</strong>. This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
                                <button
                                    onClick={handleDelete}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-sm font-medium transition-colors cursor-pointer"
                                >
                                    Delete
                                </button>
                            </AlertDialogFooter>
                        </>
                    ) : (
                        <>
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-red-600">Final Confirmation Required</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This university has <strong>{deleteConfirm?.brochureCount} brochures</strong> inside it.
                                    By continuing, all these brochures and their physical files will also be permanently deleted.
                                    <br /><br />
                                    Are you sure you want to proceed?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleFinalDelete}
                                    className="bg-red-600 hover:bg-red-700 focus:ring-red-500 font-medium rounded-lg"
                                >
                                    Yes, Delete All
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </>
                    )}
                </AlertDialogContent>
            </AlertDialog>

            {/* Agent Assignment Modal */}
            <AgentAssignmentModal
                open={assignmentModalOpen}
                onOpenChange={setAssignmentModalOpen}
                selectedUniversityIds={selectedIds}
                onAssignmentComplete={() => {
                    fetchAssignmentStats();
                    setSelectedIds([]);
                }}
            />
        </div>
    );
};

export default UniversityPrograms;
