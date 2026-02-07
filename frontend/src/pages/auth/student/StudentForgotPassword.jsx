import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { authService } from '../../../services/authService';
import { useToast } from '../../../components/ui/toast';

const StudentForgotPassword = () => {
    const navigate = useNavigate();
    const { success, error: showError } = useToast();
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email) {
            showError('Please enter your email');
            return;
        }

        setIsSubmitting(true);

        try {
            const responseData = await authService.studentForgotPassword(email);
            const message = responseData.message || 'OTP sent successfully';

            success(message);

            // Navigate to verify OTP page for students
            navigate(`/student/verify-otp?email=${encodeURIComponent(email)}`);
        } catch (error) {
            console.error('Forgot password error:', error);
            const msg = error.response?.data?.message || 'Failed to send OTP';
            showError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {/* Back Button */}
                    <button
                        onClick={() => navigate('/login')}
                        className="flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Login
                    </button>

                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                            <Mail className="w-8 h-8 text-primary-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900">Forgot Password?</h2>
                        <p className="mt-2 text-gray-600">
                            Enter your student email address and we'll send you an OTP to reset your password
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address *
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                    placeholder="Enter your registered email"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full py-3 px-4 rounded-lg font-medium text-white shadow-md transition-all flex items-center justify-center gap-2 ${isSubmitting
                                ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                                : 'bg-primary-600 hover:bg-primary-700 hover:shadow-lg active:scale-[0.98]'
                                }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Send OTP
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                        <p className="text-sm text-gray-500 italic">
                            Remember your password? <button onClick={() => navigate('/login')} className="text-primary-600 hover:underline font-medium">Login instead</button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentForgotPassword;
