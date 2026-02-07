import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';
import apiClient from '../../services/apiClient';
import { useToast } from '../../components/ui/toast';

const VerifyOTP = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const toast = useToast();
    const email = searchParams.get('email');
    const role = searchParams.get('role');

    const [otp, setOtp] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [canResend, setCanResend] = useState(false);
    const [countdown, setCountdown] = useState(60);

    // Countdown timer for resend button
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setCanResend(true);
        }
    }, [countdown]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email) {
            toast.error('Email not found');
            navigate(role ? `/forgot-password?role=${role}` : '/forgot-password');
            return;
        }

        if (otp.length !== 6) {
            toast.error('Please enter a 6-digit OTP');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await apiClient.post('/auth/verify-otp', { email, otp, role });

            const resetToken = response.data?.data?.resetToken;

            if (!resetToken) {
                throw new Error('Reset token not received');
            }

            toast.success('OTP verified successfully!');

            // Navigate to reset password page with token and role
            navigate(`/reset-password?token=${resetToken}${role ? `&role=${role}` : ''}`);
        } catch (error) {
            console.error('Verify OTP error:', error);
            const msg = error.response?.data?.message || 'Invalid or expired OTP';
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResend = async () => {
        if (!canResend) return;

        try {
            await apiClient.post('/auth/forgot-password', { email, role });
            toast.success('New OTP sent to your email');
            setCountdown(60);
            setCanResend(false);
            setOtp('');
        } catch (error) {
            console.error('Resend OTP error:', error);
            toast.error('Failed to resend OTP');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {/* Back Button */}
                    <button
                        onClick={() => navigate(role ? `/forgot-password?role=${role}` : '/forgot-password')}
                        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </button>

                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                            <Shield className="w-8 h-8 text-blue-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900">Verify OTP</h2>
                        <p className="mt-2 text-gray-600">
                            We've sent a 6-digit code to
                        </p>
                        <p className="font-semibold text-gray-900">{email}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* OTP Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Enter OTP *
                            </label>
                            <input
                                type="text"
                                required
                                maxLength="6"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest font-semibold"
                                placeholder="000000"
                            />
                            <p className="mt-2 text-sm text-gray-500 text-center">
                                OTP expires in 10 minutes
                            </p>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting || otp.length !== 6}
                            className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${isSubmitting || otp.length !== 6
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                        >
                            {isSubmitting ? 'Verifying...' : 'Verify OTP'}
                        </button>

                        {/* Resend OTP */}
                        <div className="text-center">
                            <p className="text-sm text-gray-600">
                                Didn't receive the code?{' '}
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    disabled={!canResend}
                                    className={`font-medium ${canResend
                                        ? 'text-blue-600 hover:text-blue-700'
                                        : 'text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    {canResend ? 'Resend OTP' : `Resend in ${countdown}s`}
                                </button>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default VerifyOTP;
