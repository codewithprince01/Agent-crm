import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, ShieldCheck } from 'lucide-react';
import { authService } from '../../../services/authService';
import { useToast } from '../../../components/ui/toast';
import PasswordStrengthIndicator from '../../../components/ui/PasswordStrengthIndicator';
import PasswordRequirements from '../../../components/ui/PasswordRequirements';

const StudentResetPassword = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { success: showSuccess, error: showError } = useToast();
    const token = searchParams.get('token');

    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            showError('Passwords do not match');
            return;
        }

        if (!token) {
            showError('Invalid or missing reset token');
            return;
        }

        setIsSubmitting(true);

        try {
            await authService.studentResetPassword(token, formData.password);

            setSuccess(true);
            showSuccess('Password reset successfully!');

            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (error) {
            console.error('Reset password error:', error);
            const msg = error.response?.data?.message || 'Failed to reset password';
            showError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center bg-white p-8 rounded-2xl shadow-xl max-w-sm">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Link</h2>
                    <p className="text-gray-600 mb-6">This password reset link is invalid or has expired.</p>
                    <button
                        onClick={() => navigate('/student/forgot-password')}
                        className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-all"
                    >
                        Request New OTP
                    </button>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="bg-white p-10 rounded-2xl shadow-2xl text-center max-w-md border border-green-100">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-short">
                        <ShieldCheck className="w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Success!</h2>
                    <p className="text-gray-600 mb-8">Your password has been successfully updated. You can now use your new password to access your student portal.</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full py-4 px-6 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-primary-600/20 active:scale-95"
                    >
                        Login to Portal
                    </button>
                    <p className="mt-6 text-sm text-gray-400 italic">Redirecting you to login in a few moments...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                            <Lock className="w-8 h-8 text-primary-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">New Password</h2>
                        <p className="mt-2 text-gray-600">Create a secure password for your student account</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* New Password */}
                        <div className="space-y-1">
                            <label className="block text-sm font-semibold text-gray-700">
                                New Password *
                            </label>
                            <div className="relative group">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    autoFocus
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none pr-12"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            <PasswordStrengthIndicator password={formData.password} />
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-1">
                            <label className="block text-sm font-semibold text-gray-700">
                                Confirm Password *
                            </label>
                            <div className="relative group">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    required
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none pr-12"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Password Requirements */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <PasswordRequirements password={formData.password} />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full py-4 px-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 ${isSubmitting
                                ? 'bg-gray-300 cursor-not-allowed shadow-none'
                                : 'bg-primary-600 hover:bg-primary-700 hover:shadow-primary-600/20'
                                }`}
                        >
                            {isSubmitting ? (
                                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
                            ) : 'Update Password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default StudentResetPassword;
