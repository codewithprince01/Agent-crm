import React, { useState, useEffect } from 'react';
import { brochureService } from '../../services/brochureService';
import { FiSearch, FiDownload, FiEye, FiBook, FiGlobe, FiMapPin, FiLayers, FiTag } from 'react-icons/fi';
import { useToast } from '../../components/ui/toast';
import apiClient from '../../services/apiClient';
import { format } from 'date-fns';

const FILE_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '');

const AgentBrochures = () => {
    const toast = useToast();
    const [universityPrograms, setUniversityPrograms] = useState([]);
    const [brochures, setBrochures] = useState([]);
    const [filteredBrochures, setFilteredBrochures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUniversity, setSelectedUniversity] = useState('all');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage] = useState(10);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        filterBrochures();
    }, [searchQuery, selectedUniversity, brochures]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            // 1. Fetch all assigned university programs (Backend handles filtering via req.userRole)
            const upsResponse = await brochureService.getAllUniversityPrograms();
            const ups = upsResponse?.data || (Array.isArray(upsResponse) ? upsResponse : []);
            setUniversityPrograms(ups);

            // 2. Fetch brochures for all assigned UPs
            // We can fetch them one by one or create a bulk endpoint.
            // For now, let's fetch for each assigned UP concurrently.
            const allBrochuresPromises = ups.map(up =>
                brochureService.getBrochures(up._id || up.id)
                    .then(res => {
                        const bList = res?.data || (Array.isArray(res) ? res : []);
                        // Inject UP info into each brochure for the flat table
                        return bList.map(b => ({
                            ...b,
                            universityName: up.name,
                            country: up.country,
                            typeName: up.brochure_type_id?.name || 'Standard'
                        }));
                    })
                    .catch(err => {
                        console.error(`Error fetching brochures for UP ${up._id}:`, err);
                        return [];
                    })
            );

            const brochuresResult = await Promise.all(allBrochuresPromises);
            const flatBrochures = brochuresResult.flat();

            // Sort by updated date
            flatBrochures.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

            setBrochures(flatBrochures);
            setFilteredBrochures(flatBrochures);
        } catch (error) {
            console.error('Error fetching agent brochures:', error);
            toast.error('Failed to load brochure data');
        } finally {
            setLoading(false);
        }
    };

    const filterBrochures = () => {
        let filtered = [...brochures];

        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(b =>
                (b.title || '').toLowerCase().includes(query) ||
                (b.universityName || '').toLowerCase().includes(query) ||
                (b.brochure_category_id?.name || '').toLowerCase().includes(query)
            );
        }

        if (selectedUniversity !== 'all') {
            filtered = filtered.filter(b => b.university_program_id === selectedUniversity);
        }

        setFilteredBrochures(filtered);
        setCurrentPage(1);
    };

    const handleDownload = (fileUrl, fileName) => {
        if (!fileUrl) {
            toast.error('File not available for download');
            return;
        }

        // Construct full URL if it's relative
        const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${FILE_BASE_URL}${fileUrl}`;

        const link = document.createElement('a');
        link.href = fullUrl;
        link.download = fileName || 'brochure';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Pagination logic
    const indexOfLastEntry = currentPage * entriesPerPage;
    const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
    const currentEntries = filteredBrochures.slice(indexOfFirstEntry, indexOfLastEntry);
    const totalPages = Math.ceil(filteredBrochures.length / entriesPerPage);

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                            <FiBook className="text-primary-600" />
                            Brochure Details
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Access and download university materials assigned to your account.
                        </p>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search brochures or universities..."
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <FiGlobe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <select
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all appearance-none"
                                value={selectedUniversity}
                                onChange={(e) => setSelectedUniversity(e.target.value)}
                            >
                                <option value="all">All Universities</option>
                                {universityPrograms.map(up => (
                                    <option key={up._id || up.id} value={up._id || up.id}>
                                        {up.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center justify-end">
                            <span className="text-sm font-medium text-gray-500">
                                {filteredBrochures.length} Result{filteredBrochures.length !== 1 ? 's' : ''} Found
                            </span>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                            <p className="text-gray-500 mt-4">Fetching assigned brochures...</p>
                        </div>
                    ) : filteredBrochures.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">University & Program</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Type / Country</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Category</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Brochure Title</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {currentEntries.map(brochure => (
                                        <tr key={brochure._id || brochure.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-gray-900 font-bold">{brochure.universityName}</span>
                                                    <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                        <FiLayers className="h-3 w-3" />
                                                        {brochure.typeName}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="flex items-center gap-1.5 text-sm text-gray-600">
                                                        <FiMapPin className="h-3.5 w-3.5 text-red-400" />
                                                        {brochure.country}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 font-medium uppercase mt-1">
                                                        Updated: {format(new Date(brochure.updatedAt), 'dd MMM, yyyy')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                    <FiTag className="mr-1.5 h-3 w-3" />
                                                    {brochure.brochure_category_id?.name || 'Uncategorized'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-medium text-gray-700 truncate block max-w-[200px]" title={brochure.title || brochure.name}>
                                                    {brochure.title || brochure.name}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleDownload(brochure.fileUrl)}
                                                        className="p-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-600 hover:text-white transition-all shadow-sm group-hover:shadow-md"
                                                        title="Download Brochure"
                                                    >
                                                        <FiDownload size={18} />
                                                    </button>
                                                    {brochure.fileUrl && (
                                                        <a
                                                            href={brochure.fileUrl.startsWith('http') ? brochure.fileUrl : `${FILE_BASE_URL}${brochure.fileUrl}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-200 transition-all shadow-sm"
                                                            title="View Brochure"
                                                        >
                                                            <FiEye size={18} />
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-16 text-center">
                            <FiBook className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-gray-900">No brochures found</h3>
                            <p className="text-gray-500 max-w-sm mx-auto mt-2">
                                You don't have any brochures assigned yet or your search query didn't match any results.
                            </p>
                        </div>
                    )}

                    {/* Footer / Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                            <span className="text-sm text-gray-500">
                                Page <span className="font-bold text-gray-900">{currentPage}</span> of {totalPages}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AgentBrochures;
