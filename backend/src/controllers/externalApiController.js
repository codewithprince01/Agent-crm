const ExternalApiService = require('../services/externalApiService');
const ResponseHandler = require('../utils/responseHandler');
const logger = require('../utils/logger');

class ExternalApiController {
    /**
     * Proxy for Countries with access control
     */
    static async getCountries(req, res) {
        try {
            const responseData = await ExternalApiService.fetchCountries();
            const data = Array.isArray(responseData) ? responseData : (responseData.data || []);

            // If user is AGENT, strictly filter by assigned countries
            if (req.userRole === 'AGENT') {
                const allowedCountries = req.user.accessibleCountries || [];

                // Filter even if allowedCountries is empty, resulting in [] as desired
                const filteredCountries = data.filter(c =>
                    allowedCountries.includes(c.name) ||
                    allowedCountries.includes(c.website) ||
                    allowedCountries.some(ac => c.name.toLowerCase() === ac.toLowerCase())
                );
                return ResponseHandler.success(res, 'Agent specific countries retrieved', filteredCountries);
            }

            // For ADMIN and SUPER_ADMIN, return all countries
            return ResponseHandler.success(res, 'All countries retrieved', data);
        } catch (error) {
            logger.error('Proxy Countries Error', { error: error.message });
            return ResponseHandler.serverError(res, 'Failed to fetch countries', error);
        }
    }

    /**
     * Proxy for Universities with access control
     */
    static async getUniversities(req, res) {
        try {
            // Support both 'website' and 'country' query params from frontend
            const website = req.query.website || req.query.country;
            const responseData = await ExternalApiService.fetchUniversities(website);
            let universities = Array.isArray(responseData) ? responseData : (responseData.data || []);

            if (req.userRole === 'AGENT') {
                const allowedCountries = req.user.accessibleCountries || [];
                const allowedUnivs = req.user.accessibleUniversities || [];

                // 1. Strict Country check: If a country (website) was requested, check if it's in allowedCountries
                if (website) {
                    const isCountryAllowed = allowedCountries.some(ac =>
                        ac.toLowerCase() === website.toLowerCase()
                    );
                    if (!isCountryAllowed && allowedCountries.length > 0) {
                        return ResponseHandler.success(res, 'Country restricted', []);
                    }
                }

                // 2. Filter by specific universities if assigned
                if (allowedUnivs.length > 0) {
                    universities = universities.filter(u =>
                        allowedUnivs.includes(u.id?.toString()) ||
                        allowedUnivs.includes(u.university_id?.toString()) ||
                        allowedUnivs.includes(u.name)
                    );
                } else if (allowedCountries.length === 0) {
                    // No countries AND no universities assigned -> No access
                    universities = [];
                }
            }

            return ResponseHandler.success(res, 'Universities retrieved', universities);
        } catch (error) {
            logger.error('Proxy Universities Error', { error: error.message });
            return ResponseHandler.serverError(res, 'Failed to fetch universities', error);
        }
    }

    /**
     * Proxy for Levels
     */
    static async getLevels(req, res) {
        try {
            const { university_id } = req.query;
            if (!university_id) return ResponseHandler.badRequest(res, 'university_id is required');

            const responseData = await ExternalApiService.fetchLevels(university_id);
            const data = Array.isArray(responseData) ? responseData : (responseData.data || []);
            return ResponseHandler.success(res, 'Levels retrieved', data);
        } catch (error) {
            return ResponseHandler.serverError(res, 'Failed to fetch levels', error);
        }
    }

    /**
     * Proxy for Categories
     */
    static async getCategories(req, res) {
        try {
            const { university_id, level } = req.query;
            const responseData = await ExternalApiService.fetchCategories(university_id, level);
            const data = Array.isArray(responseData) ? responseData : (responseData.data || []);
            return ResponseHandler.success(res, 'Categories retrieved', data);
        } catch (error) {
            return ResponseHandler.serverError(res, 'Failed to fetch categories', error);
        }
    }

    /**
     * Proxy for Specializations
     */
    static async getSpecializations(req, res) {
        try {
            const { university_id, level, course_category_id } = req.query;
            const responseData = await ExternalApiService.fetchSpecializations(university_id, level, course_category_id);
            const data = Array.isArray(responseData) ? responseData : (responseData.data || []);
            return ResponseHandler.success(res, 'Specializations retrieved', data);
        } catch (error) {
            return ResponseHandler.serverError(res, 'Failed to fetch specializations', error);
        }
    }

    /**
     * Proxy for Programs
     */
    static async getPrograms(req, res) {
        try {
            const responseData = await ExternalApiService.fetchPrograms(req.query);
            const data = Array.isArray(responseData) ? responseData : (responseData.data || []);
            return ResponseHandler.success(res, 'Programs retrieved', data);
        } catch (error) {
            return ResponseHandler.serverError(res, 'Failed to fetch programs', error);
        }
    }
}

module.exports = ExternalApiController;
