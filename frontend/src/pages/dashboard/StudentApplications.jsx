import React, { useState, useEffect } from 'react';
import { FileText, Building2, MapPin, Clock, DollarSign, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import applicationService from '../../services/applicationService';
import { Link, useNavigate } from 'react-router-dom';
import ProgramDetailsModal from '../../components/students/ProgramDetailsModal';

const StudentApplications = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedApp, setSelectedApp] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            const response = await applicationService.getApplications();
            setApplications(response.data || []);
        } catch (err) {
            console.error('Error fetching applications:', err);
            setError('Failed to load your applications. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            submitted: 'bg-blue-100 text-blue-700',
            documents_verified: 'bg-cyan-100 text-cyan-700',
            university_applied: 'bg-indigo-100 text-indigo-700',
            offer_received: 'bg-purple-100 text-purple-700',
            accepted: 'bg-green-100 text-green-700',
            rejected: 'bg-red-100 text-red-700',
            enrolled: 'bg-emerald-100 text-emerald-700',
            // Handle capitalized variants if necessary
            Accepted: 'bg-green-100 text-green-700',
            Rejected: 'bg-red-100 text-red-700',
            Pending: 'bg-yellow-100 text-yellow-700'
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    const getStatusLabel = (status) => {
        return status?.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ') || 'Applied';
    };


    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header with Gradient and Back Button */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4 md:p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 hover:bg-white rounded-full transition-colors group"
                        title="Go Back"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-700 group-hover:text-gray-900" />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
                    <span className="bg-white px-3 py-1 rounded-full text-sm font-bold text-gray-600 border border-gray-200">
                        {applications.length}
                    </span>
                </div>
                <p className="text-gray-600 ml-11">Track the status of your university applications</p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                    {error}
                </div>
            )}

            {/* Applications List */}
            {applications.length === 0 && !error ? (
                <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">No Applications Yet</h3>
                    <p className="text-gray-500 mt-1 mb-6">You haven't applied to any programs yet.</p>
                    <Link to="/program-finder" className="inline-flex items-center px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm">
                        Explore Programs
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {applications.map((app) => (
                        <div
                            key={app._id}
                            className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 hover:shadow-md transition-shadow cursor-pointer group flex flex-col justify-between"
                            onClick={() => setSelectedApp(app)}
                        >
                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                    {app.programSnapshot?.universityName ? (
                                        <span className="font-bold text-lg">{app.programSnapshot.universityName.charAt(0)}</span>
                                    ) : (
                                        <Building2 size={24} />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-900 text-base md:text-lg group-hover:text-indigo-600 transition-colors truncate">
                                        {app.programSnapshot?.programName || 'Unknown Program'}
                                    </h3>
                                    <p className="text-sm text-gray-600 font-medium flex items-center gap-1.5 mt-1 truncate">
                                        <Building2 size={14} className="text-gray-400 shrink-0" />
                                        <span className="truncate">{app.programSnapshot?.universityName || 'Unknown University'}</span>
                                    </p>

                                    <div className="flex items-center gap-1.5 mt-2">
                                        <MapPin size={14} className="text-gray-400 shrink-0" />
                                        <span className="text-sm text-gray-500 truncate">{app.programSnapshot?.countryName || 'Location N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="flex items-center text-xs text-gray-500 font-medium bg-gray-50 px-2 py-1 rounded">
                                        <Clock size={12} className="mr-1.5 text-gray-400" />
                                        {app.programSnapshot?.duration || 'N/A'}
                                    </div>
                                    <div className="flex items-center text-xs text-gray-500 font-medium bg-gray-50 px-2 py-1 rounded">
                                        <DollarSign size={12} className="mr-1.5 text-gray-400" />
                                        {app.programSnapshot?.tuitionFee ? `${app.programSnapshot.tuitionFee}` : 'Tuition info N/A'}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusColor(app.stage)}`}>
                                        {getStatusLabel(app.stage) || 'Applied'}
                                    </span>
                                    <button className="text-sm font-semibold text-indigo-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                        View Details <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Details Modal */}
            <ProgramDetailsModal
                isOpen={!!selectedApp}
                onClose={() => setSelectedApp(null)}
                application={selectedApp}
            />
        </div>
    );
};

export default StudentApplications;
