import apiClient from './apiClient';

export const commissionService = {
  // Get all commissions
  getCommissions: async (params = {}) => {
    const response = await apiClient.get('/commissions', { params });
    return response.data;
  },

  // Get commission rules
  getRules: async (params = {}) => {
    const response = await apiClient.get('/commissions/rules', { params });
    return response.data;
  },

  // Create commission rule
  createRule: async (data) => {
    const response = await apiClient.post('/commissions/rules', data);
    return response.data;
  },

  // Update commission rule
  updateRule: async (id, data) => {
    const response = await apiClient.put(`/commissions/rules/${id}`, data);
    return response.data;
  },

  // Delete commission rule
  deleteRule: async (id) => {
    const response = await apiClient.delete(`/commissions/rules/${id}`);
    return response.data;
  },

  // Approve commission
  approveCommission: async (id) => {
    const response = await apiClient.put(`/commissions/${id}/approve`);
    return response.data;
  },

  // Get agent commissions (Helper using main list)
  getAgentCommissions: async (agentId) => {
    return commissionService.getCommissions({ agent_id: agentId });
  },
};

export default commissionService;
