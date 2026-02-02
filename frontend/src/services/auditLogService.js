import apiClient from './apiClient';

export const auditLogService = {
  // Get audit logs
  getLogs: async (params = {}) => {
    const response = await apiClient.get('/audit-logs', { params });
    return response.data;
  },

  // Get log by ID
  getLogById: async (id) => {
    const response = await apiClient.get(`/audit-logs/${id}`);
    return response.data;
  },

  // Export logs (Not implemented in backend yet)
  // exportLogs: async (params = {}) => {
  //   const response = await apiClient.get('/audit-logs/export', {
  //     params,
  //     responseType: 'blob',
  //   });
  //   return response.data;
  // },
};

export default auditLogService;
