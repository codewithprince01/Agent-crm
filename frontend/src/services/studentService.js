import apiClient from './apiClient';

export const studentService = {
  // Get all students with optional filters
  getStudents: async (params = {}) => {
    const response = await apiClient.get('/students', { params });
    return response.data;
  },

  // Get student by ID
  getStudentById: async (id) => {
    const response = await apiClient.get(`/students/${id}`);
    return response.data;
  },

  // Create student
  createStudent: async (data) => {
    const response = await apiClient.post('/students', data);
    return response.data;
  },

  // Update student
  updateStudent: async (id, data) => {
    const response = await apiClient.put(`/students/${id}`, data);
    return response.data;
  },

  // Delete student
  deleteStudent: async (id) => {
    const response = await apiClient.delete(`/students/${id}`);
    return response.data;
  },

  // Upload document
  uploadDocument: async (id, formData) => {
    const response = await apiClient.post(`/students/${id}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get student applications (Using filter on applications endpoint)
  getStudentApplications: async (id) => {
    const response = await apiClient.get(`/applications`, { params: { student_id: id } });
    return response.data;
  },

  // Update academic details (Use main update)
  updateAcademicDetails: async (id, data) => {
    return studentService.updateStudent(id, data);
  },

  // Update passport info (Use main update)
  updatePassportInfo: async (id, data) => {
    return studentService.updateStudent(id, data);
  },

  // Document Management (Parity with Agents)
  uploadDocument: async (id, formData) => {
    const response = await apiClient.post(`/students/${id}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  uploadBulkDocuments: async (id, formData) => {
    const response = await apiClient.post(`/students/${id}/documents/bulk`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteDocument: async (id, documentName) => {
    const response = await apiClient.delete(`/students/${id}/documents/${documentName}`);
    return response.data;
  },

  // Get all countries
  getCountries: async () => {
    const response = await apiClient.get('/countries');
    return response.data;
  },

  // Public Student Registration (Draft Flow)
  saveDraftStep1: async (data) => {
    const response = await apiClient.post('/students/draft/step1', data);
    return response.data;
  },

  updateDraftStep: async (tempId, step, data) => {
    const response = await apiClient.put(`/students/draft/${tempId}/step/${step}`, data);
    return response.data;
  },

  completeRegistration: async (tempId, data) => {
    const response = await apiClient.post(`/students/draft/${tempId}/complete`, data);
    return response.data;
  },

  getDraft: async (tempId) => {
    const response = await apiClient.get(`/students/draft/${tempId}`);
    return response.data;
  },

  validateReferral: async (referralCode) => {
    const response = await apiClient.get(`/validate-referral?ref=${referralCode}`);
    return response.data;
  },

  // Draft Document Upload
  uploadDraftDocument: async (tempId, formData) => {
    const response = await apiClient.post(`/students/draft/${tempId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default studentService;
