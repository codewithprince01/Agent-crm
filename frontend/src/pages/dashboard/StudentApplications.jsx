import React, { useState, useEffect } from 'react';
import { FileText, Building2, MapPin, Clock, DollarSign, ArrowRight, ArrowLeft } from 'lucide-react';
import applicationService from '../../services/applicationService';
import { Link, useNavigate } from 'react-router-dom';
import ProgramDetailsModal from '../../components/students/ProgramDetailsModal';
import PageHeader from '../../components/layout/PageHeader';

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

    const getStatusStyle = (status) => {
        const colors = {
            submitted: 'bg-blue-50 text-blue-700 border-blue-200',
            documents_verified: 'bg-cyan-50 text-cyan-700 border-cyan-200',
            university_applied: 'bg-indigo-50 text-indigo-700 border-indigo-200',
            offer_received: 'bg-purple-50 text-purple-700 border-purple-200',
            accepted: 'bg-green-50 text-green-700 border-green-200',
            rejected: 'bg-red-50 text-red-700 border-red-200',
            enrolled: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            Accepted: 'bg-green-50 text-green-700 border-green-200',
            Rejected: 'bg-red-50 text-red-700 border-red-200',
            Pending: 'bg-yellow-50 text-yellow-700 border-yellow-200'
        };
        return colors[status] || 'bg-gray-50 text-gray-700 border-gray-200';
    };

    const getStatusLabel = (status) => {
        return status?.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ') || 'Applied';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <PageHeader
                breadcrumbs={[
                    { label: 'Dashboard', link: '/dashboard' },
                    { label: 'My Applications' }
                ]}
            />

            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">My Applications</h1>
                    <p className="text-gray-500 text-sm mt-1">Track the status of your university applications.</p>
                </div>
                <div className="bg-white px-4 py-2 border border-gray-200 rounded-lg shadow-sm flex items-center gap-2">
                    <span className="text-sm text-gray-500 font-medium">Total Active:</span>
                    <span className="text-lg font-bold text-indigo-600">{applications.length}</span>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-700 px-5 py-3 rounded-lg border border-red-200">
                    {error}
                </div>
            )}

            {/* Applications List */}
            {applications.length === 0 && !error ? (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800">No Applications Yet</h3>
                    <p className="text-gray-500 mt-2 mb-6">You haven't applied to any programs yet.</p>
                    <Link to="/program-finder" className="inline-flex items-center px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium cursor-pointer">
                        Explore Programs
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {applications.map((app) => (
                        <div
                            key={app._id}
                            className="bg-white rounded-xl border border-gray-200 border-l-4 border-l-indigo-500 hover:shadow-md transition-shadow cursor-pointer p-6 flex flex-col justify-between group"
                            onClick={() => setSelectedApp(app)}
                        >
                            {/* Card Content */}
                            <div className="flex items-start gap-4 mb-5">
                                <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                    {app.programSnapshot?.universityName ? (
                                        <span className="font-bold text-xl">{app.programSnapshot.universityName.charAt(0)}</span>
                                    ) : (
                                        <Building2 size={24} />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-indigo-600 transition-colors truncate">
                                        {app.programSnapshot?.programName || 'Unknown Program'}
                                    </h3>
                                    <p className="text-sm font-medium text-gray-600 flex items-center gap-1.5 mt-1.5 truncate">
                                        <Building2 size={15} className="text-gray-400 shrink-0" />
                                        <span className="truncate">{app.programSnapshot?.universityName || 'Unknown University'}</span>
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <MapPin size={15} className="text-gray-400 shrink-0" />
                                        <span className="text-sm text-gray-500 truncate">{app.programSnapshot?.countryName || 'Location N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="space-y-4 pt-4 border-t border-gray-50 mt-auto">
                                {(app.programSnapshot?.duration && app.programSnapshot.duration !== 'N/A') ||
                                    (app.programSnapshot?.tuitionFee && app.programSnapshot.tuitionFee !== 'N/A') ? (
                                    <div className="flex flex-wrap items-center gap-3">
                                        {app.programSnapshot?.duration && app.programSnapshot.duration !== 'N/A' && (
                                            <div className="flex items-center text-xs font-medium text-gray-600 bg-gray-50 px-2.5 py-1.5 rounded border border-gray-100">
                                                <Clock size={13} className="mr-1.5 text-gray-400" />
                                                {app.programSnapshot.duration}
                                            </div>
                                        )}
                                        {app.programSnapshot?.tuitionFee && app.programSnapshot.tuitionFee !== 'N/A' && (
                                            <div className="flex items-center text-xs font-medium text-gray-600 bg-gray-50 px-2.5 py-1.5 rounded border border-gray-100">
                                                <DollarSign size={13} className="mr-1.5 text-gray-400" />
                                                {app.programSnapshot.tuitionFee}
                                            </div>
                                        )}
                                    </div>
                                ) : null}

                                <div className="flex items-center justify-between mt-2">
                                    <span className={`px-3 py-1 rounded border text-[11px] font-bold uppercase tracking-wider ${getStatusStyle(app.stage)}`}>
                                        {getStatusLabel(app.stage)}
                                    </span>
                                    <span className="text-sm font-medium text-indigo-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                                        View Details <ArrowRight size={14} />
                                    </span>
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
