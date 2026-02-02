import apiClient from './apiClient';

export const dashboardService = {
  // Get admin dashboard
  getAdminDashboard: async () => {
    const response = await apiClient.get('/dashboard/admin');
    return response.data;
  },

  // Get agent dashboard
  getAgentDashboard: async () => {
    const response = await apiClient.get('/dashboard/agent');
    return response.data;
  },

  // Get student dashboard
  getStudentDashboard: async () => {
    const response = await apiClient.get('/dashboard/student');
    return response.data;
  },

  // Helper to route to correct dashboard based on role
  getDashboardData: async (role) => {
    if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
      return dashboardService.getAdminDashboard();
    } else if (role === 'AGENT') {
      return dashboardService.getAgentDashboard();
    } else if (role === 'STUDENT') {
      return dashboardService.getStudentDashboard();
    }
  }
};

export default dashboardService;
