import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, ArrowLeft, UserCircle } from 'lucide-react';
import apiClient from '../../services/apiClient';
import { useToast } from '../../components/ui/toast';
import { ROLES } from '../../utils/constants';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [searchParams] = useSearchParams();
  const roleFromUrl = searchParams.get('role');

  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState(roleFromUrl || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Role options (no SuperAdmin - they don't need password reset)
  const roleOptions = [
    { value: '', label: 'Select Your Role', disabled: true },
    { value: ROLES.ADMIN, label: 'Admin' },
    { value: ROLES.AGENT, label: 'Agent' },
    { value: ROLES.STUDENT, label: 'Student' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedRole) {
      showError('Please select your role');
      return;
    }

    if (!email) {
      showError('Please enter your email');
      return;
    }

    setIsSubmitting(true);

    try {
      // Single unified endpoint - backend routes based on role parameter
      // Admin → User table, Agent → Agent table, Student → Student table
      const response = await apiClient.post('/auth/forgot-password', {
        email,
        role: selectedRole
      });
      const message = response.data.message || 'Email sent successfully';

      success(message);

      // Check if it's a setup link (not OTP)
      if (message.includes('setup link')) {
        // Setup link sent - redirect to login after showing message
        setTimeout(() => {
          navigate(`/login?role=${selectedRole}`);
        }, 3000);
      } else {
        // OTP sent - navigate to verify OTP page with role
        navigate(`/verify-otp?role=${selectedRole}&email=${encodeURIComponent(email)}`);
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      const msg = error.response?.data?.message || 'Failed to send email';
      showError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Back Button */}
          <button
            onClick={() => navigate(selectedRole ? `/login?role=${selectedRole}` : '/login')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Forgot Password?</h2>
            <p className="mt-2 text-gray-600">
              Enter your email address and we'll send you an OTP to reset your password
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selector - Show only if no role in URL */}
            {!roleFromUrl && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Your Role *
                </label>
                <div className="relative">
                  <UserCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    required
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                  >
                    {roleOptions.map(option => (
                      <option key={option.value} value={option.value} disabled={option.disabled}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
                }`}
            >
              {isSubmitting ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
