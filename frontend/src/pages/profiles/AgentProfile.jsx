import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { User, UserCircle2, Home, ChevronLeft, Mail, Calendar, Briefcase, Phone, MapPin, Building } from 'lucide-react';
import apiClient from '../../services/apiClient';

const AgentProfile = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const [agentData, setAgentData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAgentProfile();
    }, []);

    const fetchAgentProfile = async () => {
        try {
            setLoading(true);
            // Assuming there's an endpoint to get agent's own profile
            // If not, we can use the user data from Redux store
            // const response = await apiClient.get('/agents/me');
            // setAgentData(response.data.data);

            // For now, using Redux user data
            setAgentData(user);
        } catch (err) {
            console.error('Error fetching agent profile:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-2">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 group text-gray-600 hover:text-green-600 transition-colors font-medium bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100"
                >
                    <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                    Back to Dashboard
                </button>
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-100 uppercase tracking-wider">
                        Agent Profile
                    </span>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Profile Sidebar */}
                <div className="lg:w-1/3">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden sticky top-24">
                        <div className="h-24 bg-gradient-to-r from-green-700 to-green-900"></div>
                        <div className="px-6 pb-8">
                            <div className="relative flex justify-center -mt-12 mb-4">
                                <div className="p-1 bg-white rounded-full shadow-lg">
                                    <div className="bg-green-50 rounded-full p-2">
                                        <UserCircle2 className="w-20 h-20 text-green-600" />
                                    </div>
                                </div>
                            </div>
                            <div className="text-center">
                                <h2 className="text-xl font-bold text-gray-900">
                                    {agentData?.firstName} {agentData?.lastName}
                                </h2>
                                <p className="text-gray-500 text-sm overflow-hidden text-ellipsis whitespace-nowrap">{agentData?.email}</p>
                                <div className="mt-4 inline-flex items-center px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                                    <Briefcase className="w-3 h-3 mr-1" />
                                    Partner Agent
                                </div>
                            </div>

                            <div className="mt-8 space-y-4">
                                <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-3">
                                    <span className="text-gray-500 flex items-center gap-2">
                                        <Mail className="w-3.5 h-3.5" /> Email
                                    </span>
                                    <span className="text-gray-900 font-medium text-xs">{agentData?.email || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-3">
                                    <span className="text-gray-500 flex items-center gap-2">
                                        <Phone className="w-3.5 h-3.5" /> Phone
                                    </span>
                                    <span className="text-gray-900 font-medium font-mono">{agentData?.phone || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5" /> Status
                                    </span>
                                    <span className="text-green-600 font-bold flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        {agentData?.status === 'active' ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-8">
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-semibold"
                                >
                                    <Home className="w-4 h-4" /> Back to Dashboard
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:w-2/3 space-y-6">
                    {/* Personal Information */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="bg-gray-50 px-8 py-4 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <User className="text-green-600 w-5 h-5" /> Personal Information
                            </h3>
                        </div>
                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">First Name</label>
                                    <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium">
                                        {agentData?.firstName || 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Last Name</label>
                                    <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium">
                                        {agentData?.lastName || 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Email Address</label>
                                    <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium">
                                        {agentData?.email || 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Phone Number</label>
                                    <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-mono">
                                        {agentData?.phone || 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Company Name</label>
                                    <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium">
                                        {agentData?.companyName || 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Account Status</label>
                                    <div className={`border rounded-xl px-4 py-3 font-bold flex items-center gap-2 ${agentData?.status === 'active'
                                            ? 'bg-green-50 border-green-200 text-green-700'
                                            : 'bg-gray-50 border-gray-200 text-gray-700'
                                        }`}>
                                        <div className={`w-2 h-2 rounded-full ${agentData?.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                        {agentData?.status === 'active' ? 'Active' : 'Inactive'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Business Information */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="bg-gray-50 px-8 py-4 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Building className="text-green-600 w-5 h-5" /> Business Information
                            </h3>
                        </div>
                        <div className="p-8">
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Company Name</label>
                                    <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium">
                                        {agentData?.companyName || 'Not provided'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Business Address</label>
                                    <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 min-h-[60px]">
                                        {agentData?.address || 'Not provided'}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">City</label>
                                        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium">
                                            {agentData?.city || 'N/A'}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">State</label>
                                        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium">
                                            {agentData?.state || 'N/A'}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Postal Code</label>
                                        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-mono">
                                            {agentData?.postalCode || 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                        <h4 className="text-sm font-bold text-gray-700 mb-4">Quick Actions</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => navigate('/students')}
                                className="p-3 bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-md transition-all text-sm font-semibold text-gray-700"
                            >
                                My Students
                            </button>
                            <button
                                onClick={() => navigate('/applications')}
                                className="p-3 bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-md transition-all text-sm font-semibold text-gray-700"
                            >
                                Applications
                            </button>
                            <button
                                onClick={() => navigate('/students/create')}
                                className="p-3 bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-md transition-all text-sm font-semibold text-gray-700"
                            >
                                Add Student
                            </button>
                            <button
                                onClick={() => navigate('/commissions')}
                                className="p-3 bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-md transition-all text-sm font-semibold text-gray-700"
                            >
                                Commissions
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgentProfile;
