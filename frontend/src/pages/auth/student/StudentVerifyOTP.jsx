import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, ArrowLeft, RefreshCw, KeyRound } from 'lucide-react';
import { authService } from '../../../services/authService';
import { useToast } from '../../../components/ui/toast';

const StudentVerifyOTP = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { success: showSuccess, error: showError } = useToast();
    const email = searchParams.get('email');

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
            showError('Email not found in request');
            navigate('/student/forgot-password');
            return;
        }

        if (otp.length !== 6) {
            showError('Please enter the 6-digit OTP');
            return;
        }

        setIsSubmitting(true);

        try {
            const responseData = await authService.studentVerifyOTP(email, otp);
            const resetToken = responseData.resetToken;

            if (!resetToken) {
                throw new Error('Reset token not received from server');
            }

            showSuccess('OTP verified successfully!');

            // Navigate to Student reset password page with token
            navigate(`/student/reset-password?token=${resetToken}`);
        } catch (error) {
            console.error('Verify OTP error:', error);
            const msg = error.response?.data?.message || 'Invalid or expired OTP';
            showError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResend = async () => {
        if (!canResend) return;

        try {
            await authService.studentForgotPassword(email);
            showSuccess('New OTP sent to your email');
            setCountdown(60);
            setCanResend(false);
            setOtp('');
        } catch (error) {
            console.error('Resend OTP error:', error);
            showError('Failed to resend OTP');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:shadow-2xl">
                    {/* Back Button */}
                    <button
                        onClick={() => navigate('/student/forgot-password')}
                        className="flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors group"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back to Forgot Password
                    </button>

                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 rounded-full mb-4 animate-pulse-slow">
                            <Shield className="w-10 h-10 text-primary-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Verify Identity</h2>
                        <div className="mt-3 flex flex-col gap-1">
                            <p className="text-gray-600">We've sent a 6-digit security code to</p>
                            <p className="font-semibold text-primary-700 bg-primary-50 py-1 px-3 rounded-full inline-block mx-auto text-sm">{email}</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* OTP Input */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 text-center">
                                Enter 6-Digit Code
                            </label>
                            <div className="flex justify-center">
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    maxLength="6"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    className="w-full max-w-[280px] px-4 py-4 border-2 border-gray-100 bg-gray-50/50 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white text-center text-4xl tracking-widest font-bold text-primary-900 transition-all outline-none"
                                    placeholder="••••••"
                                />
                            </div>
                            <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mt-2 font-medium">
                                <RefreshCw className={`w-3 h-3 ${!canResend && 'animate-spin-slow text-amber-400'}`} />
                                <span>Code valid for 10 minutes</span>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting || otp.length !== 6}
                            className={`w-full py-4 px-4 rounded-xl font-bold text-white shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95 ${isSubmitting || otp.length !== 6
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                                    : 'bg-primary-600 hover:bg-primary-700 hover:shadow-primary-600/20'
                                }`}
                        >
                            {isSubmitting ? (
                                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <KeyRound className="w-5 h-5" />
                                    Verify & Proceed
                                </>
                            )}
                        </button>

                        {/* Resend OTP */}
                        <div className="text-center pt-2">
                            <p className="text-sm text-gray-500">
                                Didn't receive the code?{' '}
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    disabled={!canResend}
                                    className={`font-bold transition-all ${canResend
                                            ? 'text-primary-600 hover:text-primary-700 hover:underline'
                                            : 'text-gray-300 cursor-not-allowed'
                                        }`}
                                >
                                    {canResend ? 'Resend Now' : `Resend in ${countdown}s`}
                                </button>
                            </p>
                        </div>
                    </form>
                </div>

                <p className="text-center mt-8 text-sm text-gray-500">
                    Having trouble? <a href="mailto:support@britannica.com" className="text-primary-600 font-medium hover:underline">Contact Support</a>
                </p>
            </div>
        </div>
    );
};

export default StudentVerifyOTP;
