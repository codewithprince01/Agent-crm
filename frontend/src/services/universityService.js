import apiClient from './apiClient';

export const universityService = {
  // Get all universities
  getUniversities: async (params = {}) => {
    const response = await apiClient.get('/universities', { params });
    return response.data;
  },

  // Get university by ID
  getUniversityById: async (id) => {
    const response = await apiClient.get(`/universities/${id}`);
    return response.data;
  },

  // Create university
  createUniversity: async (data) => {
    const response = await apiClient.post('/universities', data);
    return response.data;
  },

  // Update university
  updateUniversity: async (id, data) => {
    const response = await apiClient.put(`/universities/${id}`, data);
    return response.data;
  },

  // Delete university
  deleteUniversity: async (id) => {
    const response = await apiClient.delete(`/universities/${id}`);
    return response.data;
  },

  // Upload logo (Not implemented in backend yet)
  // uploadLogo: async (id, formData) => {
  //   const response = await apiClient.post(`/universities/${id}/logo`, formData, {
  //     headers: {
  //       'Content-Type': 'multipart/form-data',
  //     },
  //   });
  //   return response.data;
  // },

  // Get university courses
  getUniversityCourses: async (id) => {
    // Use the courses endpoint with filter
    const response = await apiClient.get(`/courses`, { params: { university_id: id } });
    return response.data;
  },

  // Update status (Not implemented as separate route in backend)
  // updateStatus: async (id, status) => {
  //   const response = await apiClient.put(`/universities/${id}/status`, { status });
  //   return response.data;
  // },
};

export default universityService;
