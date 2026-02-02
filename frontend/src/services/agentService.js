import apiClient from './apiClient';

export const agentService = {
  // Get all agents
  getAgents: async (params = {}) => {
    const response = await apiClient.get('/agents', { params });
    return response.data;
  },

  // Get pending agents
  getPendingAgents: async () => {
    const response = await apiClient.get('/agents/pending');
    return response.data;
  },

  // Get agent by ID
  getAgentById: async (id) => {
    const response = await apiClient.get(`/agents/${id}`);
    return response.data;
  },

  // Create agent
  createAgent: async (data) => {
    const response = await apiClient.post('/agents', data);
    return response.data;
  },

  // Update agent
  updateAgent: async (id, data) => {
    const response = await apiClient.put(`/agents/${id}`, data);
    return response.data;
  },

  // Delete agent
  deleteAgent: async (id) => {
    const response = await apiClient.delete(`/agents/${id}`);
    return response.data;
  },

  // Approve agent
  approveAgent: async (id, data) => {
    const response = await apiClient.put(`/agents/${id}/approve`, data);
    return response.data;
  },

  // Reject agent
  rejectAgent: async (id, data) => {
    const response = await apiClient.put(`/agents/${id}/reject`, data);
    return response.data;
  },

  // Update bank details
  updateBankDetails: async (id, data) => {
    const response = await apiClient.put(`/agents/${id}/bank-details`, data);
    return response.data;
  },

  // Upload document
  uploadDocument: async (id, formData) => {
    const response = await apiClient.post(`/agents/${id}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get agent universities
  getAgentUniversities: async (id) => {
    const response = await apiClient.get(`/agents/${id}/universities`);
    return response.data;
  },

  // Get agent commissions
  getAgentCommissions: async (id) => {
    const response = await apiClient.get(`/agents/${id}/commissions`);
    return response.data;
  },
};

export default agentService;
