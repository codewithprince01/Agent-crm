import React, { useState, useEffect } from 'react';
import {
    Save, Upload, Globe, Mail, Phone, MapPin,
    Facebook, Twitter, Youtube, Instagram, MessageCircle,
    Shield, Monitor, DollarSign, Layout
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { fetchSettings as fetchSettingsThunk } from '../../store/slices/settingsSlice';
import settingService from '../../services/settingService';
import uploadService from '../../services/uploadService';
import { useToast } from '../../components/ui/toast';
import PageHeader from '../../components/layout/PageHeader';
const Settings = () => {
    const dispatch = useDispatch();
    const { success: toastSuccess, error: toastError } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({});
    const [meta, setMeta] = useState([]);
    const [activeTab, setActiveTab] = useState('branding');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await settingService.getSettings();

            // Set flat settings for easy form binding
            const flatSettings = {};
            if (response.data) {
                Object.values(response.data).forEach(group => {
                    Object.assign(flatSettings, group);
                });
            }
            setSettings(flatSettings);

            // Save metadata for dynamic rendering
            if (response.meta) {
                setMeta(response.meta);
                // Keep the default activeTab ('branding') instead of overriding it
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            toastError("Failed to load settings");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleFileUpload = async (e, key) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const response = await uploadService.uploadFile(file);
            const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
            const fileUrl = `${apiBase}${response.url}`;
            setSettings(prev => ({ ...prev, [key]: fileUrl }));
            toastSuccess("Image uploaded successfully");
        } catch (error) {
            console.error('Upload failed:', error);
            toastError("Failed to upload image");
        }
    };

    const saveSettings = async () => {
        try {
            setSaving(true);
            await settingService.updateSettings(settings);
            toastSuccess("Settings saved successfully");
            fetchSettings(); // Refresh local state
            dispatch(fetchSettingsThunk()); // Refresh global Redux state
        } catch (error) {
            console.error('Save failed:', error);
            toastError("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    // Hardcoded sections and labels for known settings
    const sections = [
        { id: 'branding', label: 'Branding', icon: Layout, description: 'Logos and visual identity' },
        { id: 'contact', label: 'Contact', icon: Phone, description: 'Public contact information' },
        { id: 'social', label: 'Social', icon: Globe, description: 'Social media profiles' },
        { id: 'widgets', label: 'Widgets', icon: Monitor, description: 'Analytics and scripts' },
        { id: 'security', label: 'Security', icon: Shield, description: 'Access and protection' }
    ];

    return (
        <div className="max-w-7xl mx-auto p-6 lg:p-10 space-y-8">
            <PageHeader
                breadcrumbs={[
                    { label: 'Dashboard', link: '/dashboard' },
                    { label: 'Settings' }
                ]}
            />
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-gray-100">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Platform Settings</h1>
                    <p className="text-gray-500 mt-1 font-medium">Control your platform's global configuration and branding.</p>
                </div>
                <button
                    onClick={saveSettings}
                    disabled={saving}
                    className={`flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-black text-white shadow-xl transition-all active:scale-[0.98] ${saving ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-0.5 shadow-indigo-200'
                        }`}
                >
                    <Save className="w-5 h-5" />
                    {saving ? 'Saving Changes...' : 'Save Settings'}
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Navigation Sidebar */}
                <aside className="w-full lg:w-72 space-y-2 lg:sticky lg:top-8">
                    {sections.map((section) => {
                        const isActive = activeTab === section.id;
                        return (
                            <button
                                key={section.id}
                                onClick={() => setActiveTab(section.id)}
                                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${isActive
                                    ? 'bg-white shadow-lg shadow-indigo-100/50 text-indigo-600 border border-indigo-50'
                                    : 'text-gray-500 hover:bg-white hover:text-gray-900 hover:shadow-md'
                                    }`}
                            >
                                <div className={`p-2.5 rounded-xl transition-colors ${isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-400 group-hover:bg-white group-hover:text-gray-600'
                                    }`}>
                                    <section.icon className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <span className="block font-bold text-sm tracking-tight">{section.label}</span>
                                    <span className={`block text-[11px] font-medium leading-none mt-1 ${isActive ? 'text-indigo-400' : 'text-gray-400'
                                        }`}>
                                        {section.description}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </aside>

                {/* Content Area */}
                <main className="flex-1 w-full bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="p-8 lg:p-10">
                        {activeTab === 'branding' && (
                            <div className="space-y-10">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Brand Identity</h2>
                                    <p className="text-gray-500 text-sm font-medium">Configure how your platform appears to users.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-bold text-gray-700 ml-1">Platform Name</label>
                                        <div className="relative group">
                                            <Layout className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                            <input
                                                type="text"
                                                name="platform_name"
                                                value={settings.platform_name || ''}
                                                onChange={handleInputChange}
                                                placeholder="e.g. Britannica Overseas"
                                                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all outline-none font-medium text-gray-700 hover:border-gray-300"
                                            />
                                        </div>
                                    </div>

                                    <div className="md:col-span-2 space-y-2">
                                        <label className="block text-sm font-bold text-gray-700 ml-1">Platform Tagline / Description</label>
                                        <textarea
                                            name="site_description"
                                            value={settings.site_description || ''}
                                            onChange={handleInputChange}
                                            rows={4}
                                            className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all outline-none font-medium text-gray-700 hover:border-gray-300 min-h-[120px]"
                                            placeholder="A short description that appears on login/landing pages..."
                                        />
                                    </div>

                                    <div className="md:col-span-2 space-y-2">
                                        <label className="block text-sm font-bold text-gray-700 ml-1">Footer Text</label>
                                        <textarea
                                            name="footer_text"
                                            value={settings.footer_text || ''}
                                            onChange={handleInputChange}
                                            rows={4}
                                            className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all outline-none font-medium text-gray-700 hover:border-gray-300 min-h-[100px]"
                                            placeholder="Text that appears in the global footer of the platform..."
                                        />
                                    </div>

                                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
                                        {[
                                            { label: 'Logo (Light)', name: 'logo_light' },
                                            { label: 'Logo (Dark)', name: 'logo_dark' },
                                            { label: 'Favicon', name: 'site_favicon' }
                                        ].map((img) => (
                                            <div key={img.name} className="space-y-3">
                                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest ml-1">{img.label}</label>
                                                <div className="group relative">
                                                    <div className="aspect-square bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center overflow-hidden transition-all group-hover:border-indigo-300 group-hover:bg-indigo-50/30">
                                                        {settings[img.name] ? (
                                                            <img src={settings[img.name]} alt={img.label} className="max-h-[80%] max-w-[80%] object-contain" />
                                                        ) : (
                                                            <Upload className="w-8 h-8 text-gray-300 transition-transform group-hover:scale-110" />
                                                        )}
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => handleFileUpload(e, img.name)}
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'contact' && (
                            <div className="space-y-10">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Contact Details</h2>
                                    <p className="text-gray-500 text-sm font-medium">Public information for support and reaching out.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-bold text-gray-700 ml-1">Primary Support Email</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                            <input
                                                type="email"
                                                name="contact_email"
                                                value={settings.contact_email || ''}
                                                onChange={handleInputChange}
                                                placeholder="support@yourdomain.com"
                                                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all outline-none font-medium text-gray-700 hover:border-gray-300"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-bold text-gray-700 ml-1">Support Phone</label>
                                        <div className="relative group">
                                            <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                            <input
                                                type="tel"
                                                name="contact_phone"
                                                value={settings.contact_phone || ''}
                                                onChange={handleInputChange}
                                                placeholder="+1 (234) 567-890"
                                                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all outline-none font-medium text-gray-700 hover:border-gray-300"
                                            />
                                        </div>
                                    </div>

                                    <div className="md:col-span-2 space-y-2 pt-4">
                                        <label className="block text-sm font-bold text-gray-700 ml-1">Office Address</label>
                                        <textarea
                                            name="contact_address"
                                            value={settings.contact_address || ''}
                                            onChange={handleInputChange}
                                            rows={3}
                                            className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all outline-none font-medium text-gray-700 hover:border-gray-300"
                                            placeholder="Full physical address..."
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'social' && (
                            <div className="space-y-10">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Social Presence</h2>
                                    <p className="text-gray-500 text-sm font-medium">Link your profiles to stay connected.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                                    {[
                                        { label: 'Facebook URL', name: 'social_facebook', icon: Facebook, ph: 'https://facebook.com/...' },
                                        { label: 'Instagram URL', name: 'social_instagram', icon: Instagram, ph: 'https://instagram.com/...' },
                                        { label: 'Twitter (X) URL', name: 'social_twitter', icon: Twitter, ph: 'https://twitter.com/...' },
                                        { label: 'WhatsApp Link', name: 'social_whatsapp', icon: MessageCircle, ph: 'https://wa.me/...' }
                                    ].map((item) => (
                                        <div key={item.name} className="space-y-2">
                                            <label className="block text-sm font-bold text-gray-700 ml-1">{item.label}</label>
                                            <div className="relative group">
                                                <item.icon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                                <input
                                                    type="url"
                                                    name={item.name}
                                                    value={settings[item.name] || ''}
                                                    onChange={handleInputChange}
                                                    placeholder={item.ph}
                                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all outline-none font-medium text-gray-700 hover:border-gray-300"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'widgets' && (
                            <div className="space-y-10">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Analytics & Widgets</h2>
                                    <p className="text-gray-500 text-sm font-medium">Embed external tools and monitoring scripts.</p>
                                </div>

                                <div className="space-y-2 pt-6">
                                    <label className="block text-sm font-bold text-gray-700 ml-1">Custom Header Scripts</label>
                                    <textarea
                                        name="widget_live_chat"
                                        value={settings.widget_live_chat || ''}
                                        onChange={handleInputChange}
                                        rows={8}
                                        className="w-full px-5 py-4 bg-gray-900 border border-gray-800 rounded-3xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-mono text-xs text-indigo-300 min-h-[200px]"
                                        placeholder="<!-- Paste tracking or chat scripts here -->"
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-10">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Global Security</h2>
                                    <p className="text-gray-500 text-sm font-medium">Control platform-wide access and protection.</p>
                                </div>

                                <div className="pt-6">
                                    <div className="flex items-center justify-between p-6 bg-gray-50 border border-gray-100 rounded-3xl transition-all hover:bg-white hover:shadow-lg hover:shadow-gray-100">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                                                <Shield className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-gray-900 tracking-tight">Enforce 2FA (Global)</h3>
                                                <p className="text-xs font-medium text-gray-500 mt-1 max-w-sm">Requires all administrative users to verify their identity via 2FA before accessing the dashboard.</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name="security_2fa_enabled"
                                                checked={settings.security_2fa_enabled === true || settings.security_2fa_enabled === 'true'}
                                                onChange={handleInputChange}
                                                className="sr-only peer"
                                            />
                                            <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-500/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Settings;
