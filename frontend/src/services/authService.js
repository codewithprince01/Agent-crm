import apiClient from './apiClient';

export const authService = {
  // Login
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  // Register Agent
  registerAgent: async (data) => {
    const response = await apiClient.post('/auth/register-agent', data);
    return response.data;
  },

  // Register Student
  registerStudent: async (data) => {
    const response = await apiClient.post('/auth/register-student', data);
    return response.data;
  },

  // Forgot Password
  forgotPassword: async (email) => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Reset Password
  resetPassword: async (token, password) => {
    const response = await apiClient.post('/auth/reset-password', { token, password });
    return response.data;
  },

  // Verify OTP
  verifyOTP: async (email, otp) => {
    const response = await apiClient.post('/auth/verify-otp', { email, otp });
    return response.data;
  },

  // Resend OTP
  resendOTP: async (email) => {
    const response = await apiClient.post('/auth/resend-otp', { email });
    return response.data;
  },

  // Get Current User
  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  // Update Profile
  updateProfile: async (data) => {
    const response = await apiClient.put('/auth/profile', data);
    return response.data;
  },

  // Change Password
  changePassword: async (oldPassword, newPassword) => {
    const response = await apiClient.put('/auth/change-password', {
      oldPassword,
      newPassword,
    });
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },
};

export default authService;
