import apiClient from './apiClient';

export const uploadService = {
    // Upload a single file
    // Upload a single file with optional custom name
    uploadFile: async (file, customName = null) => {
        const formData = new FormData();
        if (customName) {
            formData.append('customName', customName);
        }
        formData.append('file', file);

        const response = await apiClient.post('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }
};

export default uploadService;
