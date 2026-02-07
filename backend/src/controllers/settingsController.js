const Setting = require('../models/Setting');

class SettingsController {
    // Get all settings, optionally grouped
    static async getSettings(req, res) {
        try {
            const settings = await Setting.find().sort({ group: 1, key: 1 });

            // Group settings by their 'group' field for easier frontend consumption
            const groupedSettings = settings.reduce((acc, setting) => {
                // Filter out sensitive keys from public response
                if (setting.key.includes('password') || setting.key.includes('secret') || setting.key.includes('token')) {
                    return acc;
                }

                if (!acc[setting.group]) {
                    acc[setting.group] = {};
                }
                // Parse value based on type
                let value = setting.value;
                if (setting.type === 'boolean') {
                    value = setting.value === 'true';
                } else if (setting.type === 'number') {
                    value = Number(setting.value);
                } else if (setting.type === 'json') {
                    try {
                        value = JSON.parse(setting.value);
                    } catch (e) {
                        value = setting.value;
                    }
                }

                acc[setting.group][setting.key] = value;
                return acc;
            }, {});

            // also return the raw list for metadata if needed
            res.json({
                success: true,
                data: groupedSettings,
                meta: settings
            });
        } catch (error) {
            console.error('Error fetching settings:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch settings' });
        }
    }

    // Update or create a setting (Upsert)
    static async upsertSetting(req, res) {
        try {
            const { key, value, group = 'general', type = 'string', description } = req.body;

            if (!key) {
                return res.status(400).json({ success: false, message: 'Key is required' });
            }

            // Upsert setting
            const setting = await Setting.findOneAndUpdate(
                { key },
                { value, group, type, description },
                { new: true, upsert: true, runValidators: true }
            );

            res.json({ success: true, data: setting });
        } catch (error) {
            console.error('Error upserting setting:', error);
            res.status(500).json({ success: false, message: 'Failed to upsert setting' });
        }
    }

    // Bulk update settings
    static async bulkUpdateSettings(req, res) {
        try {
            let { settings } = req.body;

            if (!settings) {
                return res.status(400).json({ success: false, message: 'Settings are required' });
            }

            // If settings is a flat object, convert it to an array of { key, value }
            if (typeof settings === 'object' && !Array.isArray(settings)) {
                settings = Object.entries(settings).map(([key, value]) => ({
                    key,
                    value: typeof value === 'object' ? JSON.stringify(value) : String(value)
                }));
            }

            if (!Array.isArray(settings)) {
                return res.status(400).json({ success: false, message: 'Settings must be an array or an object' });
            }

            // Use Promise.all for concurrent updates
            const updatePromises = settings.map(({ key, value, group, type, description }) => {
                if (!key) return Promise.resolve(null);

                const updateData = { value: String(value) };
                if (group) updateData.group = group;
                if (type) updateData.type = type;
                if (description) updateData.description = description;

                return Setting.findOneAndUpdate(
                    { key },
                    updateData,
                    { new: true, upsert: true, runValidators: true }
                );
            });

            const updatedSettings = await Promise.all(updatePromises);

            res.json({ success: true, data: updatedSettings.filter(Boolean) });
        } catch (error) {
            console.error('Error bulk updating settings:', error);
            res.status(500).json({ success: false, message: 'Failed to bulk update settings' });
        }
    }

    // Delete a setting
    static async deleteSetting(req, res) {
        try {
            const { key } = req.params;

            const result = await Setting.findOneAndDelete({ key });

            if (!result) {
                return res.status(404).json({ success: false, message: 'Setting not found' });
            }

            res.json({ success: true, message: 'Setting deleted successfully' });
        } catch (error) {
            console.error('Error deleting setting:', error);
            res.status(500).json({ success: false, message: 'Failed to delete setting' });
        }
    }

    // Alias for bulkUpdateSettings (for backward compatibility with routes)
    static updateSettings = SettingsController.bulkUpdateSettings;
}

module.exports = SettingsController;
