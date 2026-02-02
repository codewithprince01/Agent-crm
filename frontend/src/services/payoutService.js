import apiClient from './apiClient';

export const payoutService = {
  // Get all payouts
  getPayouts: async (params = {}) => {
    const response = await apiClient.get('/payouts', { params });
    return response.data;
  },

  // Get payout requests (Using filter)
  getPayoutRequests: async () => {
    return payoutService.getPayouts({ status: 'requested' });
  },

  // Request payout
  requestPayout: async (data) => {
    const response = await apiClient.post('/payouts/request', data);
    return response.data;
  },

  // Approve payout
  approvePayout: async (id, paymentReference) => {
    const response = await apiClient.put(`/payouts/${id}/approve`, { payment_reference: paymentReference });
    return response.data;
  },

  // Reject payout
  rejectPayout: async (id, reason) => {
    const response = await apiClient.put(`/payouts/${id}/reject`, { notes: reason });
    return response.data;
  },

  // Mark as paid
  markAsPaid: async (id, paymentReference) => {
    const response = await apiClient.put(`/payouts/${id}/mark-paid`, { payment_reference: paymentReference });
    return response.data;
  },

  // Get agent earnings
  getAgentEarnings: async (agentId) => {
    const response = await apiClient.get('/payouts/earnings', { params: { agent_id: agentId } });
    return response.data;
  },
};

export default payoutService;
