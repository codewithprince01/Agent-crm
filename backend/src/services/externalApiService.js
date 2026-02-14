const logger = require('../utils/logger');

const BASE_URL = process.env.EXTERNAL_API_BASE_URL;

/**
 * Service to interact with the external "Search and Apply" API
 */
class ExternalApiService {
    /**
     * Fetch all countries from the external API
     */
    static async fetchCountries() {
        try {
            const response = await fetch(`${BASE_URL}/countries`);
            if (response.status === 404) {
                logger.warn('External API returned 404 for countries, returning empty list');
                return { success: true, data: [] };
            }
            if (!response.ok) throw new Error(`External API error: ${response.statusText}`);
            const data = await response.json();
            return data;
        } catch (error) {
            logger.error('Error fetching countries from external API', { error: error.message });
            // Return empty list on failure
            return { success: false, data: [] };
        }
    }

    /**
     * Fetch universities from the external API
     * @param {string} website - Website filter
     */
    static async fetchUniversities(website = '') {
        try {
            const url = new URL(`${BASE_URL}/universities`);
            if (website) url.searchParams.append('website', website);

            const response = await fetch(url.toString());
            if (response.status === 404) return { success: true, data: [] };
            if (!response.ok) throw new Error(`External API error: ${response.statusText}`);
            const data = await response.json();
            return data;
        } catch (error) {
            logger.error('Error fetching universities from external API', { error: error.message });
            throw error;
        }
    }

    /**
     * Fetch levels for a university
     * @param {string} universityId 
     */
    static async fetchLevels(universityId) {
        try {
            const response = await fetch(`${BASE_URL}/levels?university_id=${universityId}`);
            if (response.status === 404) return { success: true, data: [] };
            if (!response.ok) throw new Error(`External API error: ${response.statusText}`);
            const data = await response.json();
            return data;
        } catch (error) {
            logger.error('Error fetching levels from external API', { error: error.message });
            throw error;
        }
    }

    /**
     * Fetch categories for a university and level
     */
    static async fetchCategories(universityId, level) {
        try {
            const response = await fetch(`${BASE_URL}/categories?university_id=${universityId}&level=${level}`);
            if (response.status === 404) return { success: true, data: [] };
            if (!response.ok) throw new Error(`External API error: ${response.statusText}`);
            const data = await response.json();
            return data;
        } catch (error) {
            logger.error('Error fetching categories from external API', { error: error.message });
            throw error;
        }
    }

    /**
     * Fetch specializations for a university, level, and category
     */
    static async fetchSpecializations(universityId, level, categoryId) {
        try {
            const response = await fetch(`${BASE_URL}/specializations?university_id=${universityId}&level=${level}&course_category_id=${categoryId}`);
            if (response.status === 404) return { success: true, data: [] };
            if (!response.ok) throw new Error(`External API error: ${response.statusText}`);
            const data = await response.json();
            return data;
        } catch (error) {
            logger.error('Error fetching specializations from external API', { error: error.message });
            throw error;
        }
    }

    /**
     * Fetch programs based on filters
     */
    static async fetchPrograms(params) {
        try {
            const url = new URL(`${BASE_URL}/programs`);
            Object.keys(params).forEach(key => {
                if (params[key]) url.searchParams.append(key, params[key]);
            });

            const response = await fetch(url.toString());
            if (response.status === 404) return { success: true, data: [] };
            if (!response.ok) throw new Error(`External API error: ${response.statusText}`);
            const data = await response.json();
            return data;
        } catch (error) {
            logger.error('Error fetching programs from external API', { error: error.message });
            throw error;
        }
    }
}

module.exports = ExternalApiService;
