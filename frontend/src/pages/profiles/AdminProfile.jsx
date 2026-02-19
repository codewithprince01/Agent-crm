import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { User, UserCircle2, Home, ChevronLeft, Mail, Calendar, Shield, Building2 } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import apiClient from '../../services/apiClient';

const AdminProfile = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const [loading, setLoading] = useState(false);

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header Section */}
            <PageHeader
                breadcrumbs={[
                    { label: 'Dashboard', link: '/dashboard' },
                    { label: 'Profile' }
                ]}
            />
            <div className="flex items-center justify-end mb-2">
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-full border border-purple-100 uppercase tracking-wider">
                        {user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'} Profile
                    </span>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Profile Sidebar */}
                <div className="lg:w-1/3">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden sticky top-24">
                        <div className="h-24 bg-gradient-to-r from-purple-700 to-purple-900"></div>
                        <div className="px-6 pb-8">
                            <div className="relative flex justify-center -mt-12 mb-4">
                                <div className="p-1 bg-white rounded-full shadow-lg">
                                    <div className="bg-purple-50 rounded-full p-2">
                                        <UserCircle2 className="w-20 h-20 text-purple-600" />
                                    </div>
                                </div>
                            </div>
                            <div className="text-center">
                                <h2 className="text-xl font-bold text-gray-900">
                                    {user?.name || 'Admin User'}
                                </h2>
                                <p className="text-gray-500 text-sm overflow-hidden text-ellipsis whitespace-nowrap">{user?.email}</p>
                                <div className="mt-4 inline-flex items-center px-3 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-full">
                                    {user?.role === 'SUPER_ADMIN' ? (
                                        <>
                                            <Shield className="w-3 h-3 mr-1" />
                                            Super Administrator
                                        </>
                                    ) : (
                                        <>
                                            <Building2 className="w-3 h-3 mr-1" />
                                            Administrator
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="mt-8 space-y-4">
                                <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-3">
                                    <span className="text-gray-500 flex items-center gap-2">
                                        <Mail className="w-3.5 h-3.5" /> Email
                                    </span>
                                    <span className="text-gray-900 font-medium text-xs">{user?.email || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-3">
                                    <span className="text-gray-500 flex items-center gap-2">
                                        <User className="w-3.5 h-3.5" /> Role
                                    </span>
                                    <span className="text-gray-900 font-medium">{user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5" /> Status
                                    </span>
                                    <span className="text-green-600 font-bold flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        Active
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
                    {/* Account Information */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="bg-gray-50 px-8 py-4 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <User className="text-purple-600 w-5 h-5" /> Account Information
                            </h3>
                        </div>
                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Full Name</label>
                                    <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium">
                                        {user?.name || 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Email Address</label>
                                    <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium">
                                        {user?.email || 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Role</label>
                                    <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 text-purple-900 font-bold">
                                        {user?.role === 'SUPER_ADMIN' ? 'Super Administrator' : 'Administrator'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Account Status</label>
                                    <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 font-bold flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        Active
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Permissions & Access */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="bg-gray-50 px-8 py-4 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Shield className="text-purple-600 w-5 h-5" /> Permissions & Access
                            </h3>
                        </div>
                        <div className="p-8">
                            <div className="space-y-4">
                                {user?.role === 'SUPER_ADMIN' ? (
                                    <>
                                        <div className="flex items-center justify-between p-4 bg-purple-50 border border-purple-100 rounded-xl">
                                            <span className="text-sm font-semibold text-gray-700">Full System Access</span>
                                            <span className="text-xs bg-purple-600 text-white px-3 py-1 rounded-full font-bold">GRANTED</span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-purple-50 border border-purple-100 rounded-xl">
                                            <span className="text-sm font-semibold text-gray-700">User Management</span>
                                            <span className="text-xs bg-purple-600 text-white px-3 py-1 rounded-full font-bold">GRANTED</span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-purple-50 border border-purple-100 rounded-xl">
                                            <span className="text-sm font-semibold text-gray-700">System Settings</span>
                                            <span className="text-xs bg-purple-600 text-white px-3 py-1 rounded-full font-bold">GRANTED</span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-purple-50 border border-purple-100 rounded-xl">
                                            <span className="text-sm font-semibold text-gray-700">Audit Logs</span>
                                            <span className="text-xs bg-purple-600 text-white px-3 py-1 rounded-full font-bold">GRANTED</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                            <span className="text-sm font-semibold text-gray-700">Student Management</span>
                                            <span className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full font-bold">GRANTED</span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                            <span className="text-sm font-semibold text-gray-700">Agent Management</span>
                                            <span className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full font-bold">GRANTED</span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                            <span className="text-sm font-semibold text-gray-700">Application Management</span>
                                            <span className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full font-bold">GRANTED</span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl">
                                            <span className="text-sm font-semibold text-gray-400">System Settings</span>
                                            <span className="text-xs bg-gray-400 text-white px-3 py-1 rounded-full font-bold">LIMITED</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 border border-purple-100">
                        <h4 className="text-sm font-bold text-gray-700 mb-4">Quick Actions</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => navigate('/settings')}
                                className="p-3 bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all text-sm font-semibold text-gray-700"
                            >
                                Settings
                            </button>
                            <button
                                onClick={() => navigate('/students')}
                                className="p-3 bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all text-sm font-semibold text-gray-700"
                            >
                                Students
                            </button>
                            <button
                                onClick={() => navigate('/agents')}
                                className="p-3 bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all text-sm font-semibold text-gray-700"
                            >
                                Agents
                            </button>
                            <button
                                onClick={() => navigate('/applications')}
                                className="p-3 bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all text-sm font-semibold text-gray-700"
                            >
                                Applications
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminProfile;
