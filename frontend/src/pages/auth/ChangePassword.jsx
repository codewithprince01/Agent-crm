import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Lock, Eye, EyeOff, CheckCircle, ArrowLeft, ShieldCheck, KeyRound } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import authService from '../../services/authService';
import { useToast } from '../../components/ui/toast';
import { ROLES } from '../../utils/constants';

const ChangePassword = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const { user } = useSelector((state) => state.auth);

    const [formData, setFormData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [showPasswords, setShowPasswords] = useState({
        old: false,
        new: false,
        confirm: false
    });

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.newPassword !== formData.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        if (formData.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            await authService.changePassword(
                formData.oldPassword,
                formData.newPassword
            );

            setSuccess(true);
            toast.success('Password updated successfully!');
            setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });

            setTimeout(() => {
                navigate('/dashboard');
            }, 3000);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center p-6">
                <div className="bg-white p-10 rounded-2xl shadow-lg text-center max-w-md w-full border border-gray-100">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Updated</h2>
                    <p className="text-gray-500 mb-8 font-medium">Your account security has been updated successfully.</p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all text-sm uppercase tracking-wider"
                    >
                        Back to Dashboard
                    </button>
                    <p className="mt-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest animate-pulse">Redirecting in 3 seconds...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[70vh] flex items-center justify-center p-6">
            <div className="max-w-md w-full">
                <PageHeader
                    breadcrumbs={[
                        { label: 'Dashboard', link: '/dashboard' },
                        { label: 'Change Password' }
                    ]}
                />
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                    <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                            <Lock className="w-5 h-5 text-gray-400" />
                            <span className="tracking-tight">Change Password</span>
                        </h3>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="space-y-5">
                            {/* Current Password */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider ml-1">Current Password</label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.old ? "text" : "password"}
                                        required
                                        value={formData.oldPassword}
                                        onChange={(e) => setFormData(p => ({ ...p, oldPassword: e.target.value }))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-3.5 text-gray-900 focus:border-gray-400 focus:bg-white outline-none transition-all placeholder:text-gray-300 font-medium"
                                        placeholder="Enter current password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords(p => ({ ...p, old: !p.old }))}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPasswords.old ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* New Password */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider ml-1">New Password</label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.new ? "text" : "password"}
                                        required
                                        value={formData.newPassword}
                                        onChange={(e) => setFormData(p => ({ ...p, newPassword: e.target.value }))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-3.5 text-gray-900 focus:border-gray-400 focus:bg-white outline-none transition-all placeholder:text-gray-300 font-medium"
                                        placeholder="Minimum 6 characters"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords(p => ({ ...p, new: !p.new }))}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider ml-1">Confirm New Password</label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.confirm ? "text" : "password"}
                                        required
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData(p => ({ ...p, confirmPassword: e.target.value }))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-3.5 text-gray-900 focus:border-gray-400 focus:bg-white outline-none transition-all placeholder:text-gray-300 font-medium"
                                        placeholder="Re-type your new password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords(p => ({ ...p, confirm: !p.confirm }))}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-14 bg-gray-900 text-white rounded-xl font-bold shadow-lg hover:bg-gray-800 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm uppercase tracking-widest"
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                ) : (
                                    <>Update Password <ShieldCheck className="w-4 h-4" /></>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChangePassword;
