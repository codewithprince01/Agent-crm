import apiClient from './apiClient';

export const applicationService = {
  // Get all applications
  getApplications: async (params = {}) => {
    const response = await apiClient.get('/applications', { params });
    return response.data;
  },

  // Get application by ID
  getApplicationById: async (id) => {
    const response = await apiClient.get(`/applications/${id}`);
    return response.data;
  },

  // Create application
  createApplication: async (data) => {
    const response = await apiClient.post('/applications', data);
    return response.data;
  },

  // Update application
  updateApplication: async (id, data) => {
    const response = await apiClient.put(`/applications/${id}`, data);
    return response.data;
  },

  // Delete application
  deleteApplication: async (id) => {
    const response = await apiClient.delete(`/applications/${id}`);
    return response.data;
  },

  // Submit application
  submitApplication: async (id) => {
    return applicationService.updateStatus(id, 'submitted', 'Application submitted');
  },

  // Update status
  updateStatus: async (id, status, notes) => {
    const response = await apiClient.put(`/applications/${id}/status`, { status, notes });
    return response.data;
  },

  // Upload document
  uploadDocument: async (id, formData) => {
    const response = await apiClient.post(`/applications/${id}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get status history
  getStatusHistory: async (id) => {
    const response = await apiClient.get(`/applications/${id}/history`);
    return response.data;
  },

  // Get application commission
  getApplicationCommission: async (id) => {
    const response = await apiClient.get(`/applications/${id}/commission`);
    return response.data;
  },

  // Accept offer
  acceptOffer: async (id) => {
    return applicationService.updateStatus(id, 'offer_accepted', 'Offer accepted by student');
  },

  // Mark fee paid
  markFeePaid: async (id, paymentDetails) => {
    return applicationService.updateStatus(id, 'fee_paid', `Fee paid. Ref: ${paymentDetails?.reference || 'N/A'}`);
  },

  // Get students without any applications
  getPendingStudents: async () => {
    const response = await apiClient.get('/applications/pending-students');
    return response.data;
  },

  // Get students with existing applications
  getAppliedStudents: async () => {
    const response = await apiClient.get('/applications/applied-students');
    return response.data;
  },

  // Get status counts
  getStatusCounts: async () => {
    const response = await apiClient.get('/applications/stats/status-counts');
    return response.data;
  },
};

export default applicationService;
